import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '../../auth/[...nextauth]/route'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Simple in-memory rate limiter
let lastRequestTime = 0;
const COOLDOWN_PERIOD = 5000; // 5 seconds

async function getFileContent(drive, fileId, mimeType) {
  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Docs as plain text
      const response = await drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      })
      return response.data
    } else if (mimeType === 'application/pdf') {
      // For PDFs, we'll need to download and parse them
      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      })
      // Note: In a real implementation, you'd use pdf-parse here
      return 'PDF content extraction would go here'
    }
    return null
  } catch (error) {
    console.error('Error getting file content:', error)
    return null
  }
}

async function callQwenAPI(prompt) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL,
        'X-Title': 'Drive AI Organizer'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-coder-32b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant specialized in file organization and naming conventions. Your task is to:

1. IMPROVE FILE NAMES by:
   - Adding date information if relevant (e.g., "2025" in appropriate position)
   - Including version numbers if applicable (e.g., "v1", "v2")
   - Using clear descriptive terms (e.g., "Q3_Revenue" instead of just "Revenue")
   - Maintaining proper capitalization and word separation
   - Adding relevant context (e.g., "Company_" prefix for company documents)

2. CREATE FOLDER STRUCTURE by:
   - Using logical hierarchies based on file type and content
   - Creating category-based root folders (e.g., "Presentations", "Documents")
   - Adding appropriate subfolders based on content
   - Using clear, descriptive folder names

3. ALWAYS suggest both:
   - A renamed file with improved naming
   - An appropriate folder structure for organization

Respond with a JSON array of suggestions. Each suggestion should have:
- originalName: the current file name
- suggestedName: your improved name suggestion
- reasoning: brief explanation of the change
- type: "rename" or "organize"
- suggestedPath: if organizing, suggest a folder path
- confidence: number 0-1 indicating confidence in suggestion`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Qwen API Error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const now = Date.now();
    if (now - lastRequestTime < COOLDOWN_PERIOD) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    lastRequestTime = now;
    
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { files } = await request.json()
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Invalid files data' }, { status: 400 })
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    
    const drive = google.drive({ version: 'v3', auth })
    
    // Get detailed file information
    const fileDetails = []
    
    for (const fileId of files) {
      try {
        const fileResponse = await drive.files.get({
          fileId: fileId,
          fields: 'id,name,mimeType,size,modifiedTime,parents,description'
        })
        
        const file = fileResponse.data
        
        // Get file content for better context (for supported types)
        const content = await getFileContent(drive, fileId, file.mimeType)
        
        fileDetails.push({
          ...file,
          content: content ? content.substring(0, 500) : null // Limit content length
        })
      } catch (error) {
        console.error(`Error getting file details for ${fileId}:`, error)
      }
    }
    
    // Create prompt for AI
    const prompt = `Analyze these files and suggest better names and organization:

${fileDetails.map(file => `
File: ${file.name}
Type: ${file.mimeType}
Size: ${file.size ? Math.round(file.size / 1024) + 'KB' : 'Unknown'}
Modified: ${file.modifiedTime}
${file.content ? `Content preview: ${file.content}` : ''}
---`).join('\n')}

Please provide suggestions for renaming and organizing these files into a logical folder structure. Consider:
1. File content and purpose
2. Creation dates and patterns
3. File types and relationships
4. Professional naming conventions
5. Logical grouping opportunities

Return your response as a valid JSON array.`

    // Call Qwen AI API
    const aiResponse = await callQwenAPI(prompt)
    
    // Parse AI response
    let suggestions = []
    const uniqueFolders = new Set()
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedSuggestions = JSON.parse(jsonMatch[0])
        // Filter out duplicate folder creations while preserving file moves
        suggestions = parsedSuggestions.filter(suggestion => {
          if (suggestion.type === 'create_folder') {
            if (uniqueFolders.has(suggestion.name)) {
              return false
            }
            uniqueFolders.add(suggestion.name)
          }
          return true
        })
      } else {
        // Fallback: create basic suggestions
        suggestions = fileDetails.map(file => ({
          id: uuidv4(),
          fileId: file.id,
          originalName: file.name,
          suggestedName: file.name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          reasoning: 'Improved capitalization and spacing',
          type: 'rename',
          confidence: 0.7
        }))
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback suggestions
      suggestions = fileDetails.map(file => ({
        id: uuidv4(),
        fileId: file.id,
        originalName: file.name,
        suggestedName: file.name,
        reasoning: 'AI parsing failed, no changes suggested',
        type: 'rename',
        confidence: 0.5
      }))
    }
    
    // Add IDs and file IDs to suggestions
    suggestions = suggestions.map(suggestion => ({
      ...suggestion,
      id: suggestion.id || uuidv4(),
      fileId: suggestion.fileId || fileDetails.find(f => f.name === suggestion.originalName)?.id
    }))
    
    return NextResponse.json({
      success: true,
      suggestions: suggestions,
      aiResponse: aiResponse
    })
    
  } catch (error) {
    console.error('AI Suggestions Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate suggestions'
    }, { status: 500 })
  }
}
