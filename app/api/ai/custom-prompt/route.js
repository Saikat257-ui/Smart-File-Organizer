import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { google } from 'googleapis'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

// Simple in-memory rate limiter
let lastRequestTime = 0;
const COOLDOWN_PERIOD = 2000; // 2 seconds

async function callGeminiAPI(prompt, fileAnalysis) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant specialized in file organization. 
            
User Request: "${prompt}"

Files to Analyze:
${JSON.stringify(fileAnalysis.map(f => ({
              name: f.name,
              type: f.mimeType,
              contentSnippet: f.content ? f.content.substring(0, 500) : "No text content"
            })), null, 2)}

Goal: Analyze the files and user request. Return a JSON response with actions to organize the files.

Output Format (JSON Property "actions"):
An array of action objects. 
Supported actions:
- { type: "create_folder", name: "FolderName", reasoning: "..." }
- { type: "move_file", fileId: "...", fileName: "...", targetFolder: "FolderName", reasoning: "..." }
- { type: "rename_file", fileId: "...", fileName: "...", newName: "NewName", reasoning: "..." }

Rules:
1. If the user asks to "move to a suitable folder" or "organize", analyze the file content/metadata to Create INTELLIGENTLY NAMED folders (e.g., "Financial Reports", "Images 2024", "Project Alpha Docs"). DO NOT use generic names like "folder", "other", "files", or "misc".
2. If the user specifies a name (e.g., "Rename to X", "Move to folder Y"), follow it EXACTLY (preserve case).
3. If renaming, preserve correct file extensions.
4. If the user prompt is vague (e.g. "Move selected file"), infer the best folder name based on the file's content or name.
5. Combine actions: If moving files, you usually need to create the folder first (unless you know it exists, but safe to emit create_folder).

Response Format:
{
  "summary": "Brief summary of what will be done",
  "reasoning": "Explanation of the analysis",
  "contentGroups": [ { "suggestedFolder": "...", "files": [...], "reasoning": "..." } ],
  "actions": [ ... ]
}

Return ONLY the JSON.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4000,
          responseMimeType: "application/json"
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { prompt, files } = await request.json()

    if (!prompt || !files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Prompt and files are required'
      }, { status: 400 })
    }

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Analyze files and get their content
    const fileAnalysis = []

    for (const file of files) {
      try {
        let content = ''
        let metadata = {}

        // Get file metadata
        const fileMetadata = await drive.files.get({
          fileId: file.id,
          fields: 'id,name,mimeType,size,createdTime,modifiedTime,parents'
        })

        metadata = fileMetadata.data

        // Try to get file content for text-based files
        if (file.mimeType && (
          file.mimeType.includes('text/') ||
          file.mimeType.includes('application/json') ||
          file.mimeType.includes('application/javascript') ||
          file.mimeType.includes('application/xml') ||
          file.mimeType === 'application/vnd.google-apps.document' ||
          file.mimeType === 'application/vnd.google-apps.spreadsheet'
        )) {
          try {
            let exportMimeType = file.mimeType

            // Handle Google Workspace files
            if (file.mimeType === 'application/vnd.google-apps.document') {
              exportMimeType = 'text/plain'
            } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
              exportMimeType = 'text/csv'
            }

            const response = file.mimeType.startsWith('application/vnd.google-apps.')
              ? await drive.files.export({ fileId: file.id, mimeType: exportMimeType })
              : await drive.files.get({ fileId: file.id, alt: 'media' })

            content = response.data.toString().substring(0, 2000) // Limit content length for AI context
          } catch (contentError) {
            console.log(`Could not get content for ${file.name}:`, contentError.message)
            content = 'Content not accessible'
          }
        } else {
          content = `Binary file (${file.mimeType})`
        }

        fileAnalysis.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: metadata.size,
          createdTime: metadata.createdTime,
          modifiedTime: metadata.modifiedTime,
          content: content, // Include snippet of content
          parents: metadata.parents || []
        })
      } catch (error) {
        console.error(`Error analyzing file ${file.name}:`, error)
        fileAnalysis.push({
          id: file.id,
          name: file.name,
          error: error.message
        })
      }
    }

    // Generate AI response based on prompt and file analysis
    const aiResponse = await generateAIResponse(prompt, fileAnalysis)

    // Ensure actions is always an array
    if (!aiResponse.actions) {
      aiResponse.actions = []
    }

    // Map file IDs in actions back to their original files if needed (AI might mess up IDs)
    // But usually asking AI to return IDs is reliable enough, or we can look up by name if failed.
    // For now, trust the AI returned the right IDs as they were provided in input.

    // Add fileId to action if missing or incorrect. We trust the fileName from the AI more than the ID it hallucinates.
    aiResponse.actions = aiResponse.actions.map(action => {
      if (action.type === 'move_file' || action.type === 'rename_file') {
        // AI often hallucinates IDs or puts filenames as IDs. 
        // We strictly look up the real ID using the fileName provided by the AI.
        const matchingFile = fileAnalysis.find(f => f.name === action.fileName)
        if (matchingFile) {
          console.log(`[ID Map] Correcting ID for ${action.fileName}: ${action.fileId} -> ${matchingFile.id}`)
          action.fileId = matchingFile.id
        }
      }
      return action
    })

    return NextResponse.json({
      success: true,
      analysis: fileAnalysis,
      aiResponse: aiResponse,
      actions: aiResponse.actions
    })

  } catch (error) {
    console.error('Custom prompt API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function generateAIResponse(prompt, fileAnalysis) {
  // Check for EXPLICIT simple rename command to avoid AI overhead/hallucination for simple tasks
  // But since we want "intelligent" naming if vague, we generally prefer AI.
  // We keep the regex check ONLY for very strict "Rename X to Y" where the user provides the name.

  const renameMatch = prompt.match(/^change.*names?.*to ['""]?([^'""\n]+)['""]?$/i) ||
    prompt.match(/^rename.*to ['""]?([^'""\n]+)['""]?$/i)

  if (renameMatch) {
    const targetName = renameMatch[1].trim()
    const actions = []

    fileAnalysis.forEach((file, index) => {
      let newName = targetName
      const originalExt = file.name.includes('.') ? file.name.split('.').pop() : ''
      const hasExtension = targetName.includes('.')

      if (fileAnalysis.length > 1) {
        if (hasExtension) {
          const parts = targetName.split('.')
          const ext = parts.pop()
          const base = parts.join('.')
          newName = `${base} (${index + 1}).${ext}`
        } else {
          newName = `${targetName} (${index + 1})`
          if (originalExt) newName += '.' + originalExt
        }
      } else {
        if (!hasExtension && originalExt) newName = `${targetName}.${originalExt}`
      }

      actions.push({
        type: 'rename_file',
        fileId: file.id,
        fileName: file.name,
        newName: newName,
        reasoning: `Renaming to "${newName}" as explicitly requested`
      })
    })

    return {
      summary: `Renaming ${fileAnalysis.length} files to pattern "${targetName}" as requested.`,
      contentGroups: [],
      actions: actions,
      reasoning: `Explicit rename request detected.`
    }
  }

  // Check for EXPLICIT "Create folder X" command (without "move")
  // If the user says "Move to folder X", we let Gemini handle it to ensure move actions are generated.
  // But "Create folder X" is simple.
  const createFolderMatch = prompt.match(/^create (?:a )?folder (?:called |named )?['""]?([^'""\n]+)['""]?$/i)
  if (createFolderMatch) {
    const folderName = createFolderMatch[1].trim()
    return {
      summary: `Creating folder "${folderName}"`,
      actions: [{ type: 'create_folder', name: folderName, reasoning: "User requested creation" }],
      reasoning: "Explicit create folder request"
    }
  }

  // For everything else ("Move to suitable folder", "Organize these", "Move to folder Docs"), use Gemini
  try {
    const geminiResponseText = await callGeminiAPI(prompt, fileAnalysis)
    const jsonMatch = geminiResponseText.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    } else {
      console.warn("AI response not JSON:", geminiResponseText)
      throw new Error("Failed to parse AI response")
    }
  } catch (error) {
    console.error("AI Generation failed:", error)
    return {
      summary: "AI analysis failed. Please try again.",
      error: "AI analysis failed",
      actions: []
    }
  }
}
