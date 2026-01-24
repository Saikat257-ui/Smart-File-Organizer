import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '../../auth/[...nextauth]/route'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

// Simple in-memory rate limiter
let lastRequestTime = 0;
const COOLDOWN_PERIOD = 5000; // 5 seconds

// NOTE: Removed file content fetching. The app no longer requests file contents
// from Drive (uses least-privilege scopes). If you need content in future,
// restore logic here and ensure the OAuth scopes match.

async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI assistant specialized in file organization and naming conventions. For each file, provide ONE suggestion that includes both renaming and optional folder organization.

For each file, suggest:
1. An improved file name with better naming conventions
2. An optional folder structure for better organization

Respond with a JSON array where each object represents ONE file with:
- fileId: the file ID
- originalName: current file name
- suggestedName: improved file name
- renameReasoning: explanation for the rename
- suggestedFolder: optional folder path for organization (can be null)
- folderReasoning: explanation for folder suggestion (can be null)
- confidence: number 0-1 indicating confidence

${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
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

        // We no longer fetch file contents; only include metadata.
        fileDetails.push({
          ...file
        })
      } catch (error) {
        console.error(`Error getting file details for ${fileId}:`, error)
      }
    }

    // Create prompt for AI
    const prompt = `Analyze these files and provide ONE suggestion per file for renaming and optional folder organization:

    ${fileDetails.map(file => `
    File: ${file.name}
    Type: ${file.mimeType}
    Size: ${file.size ? Math.round(file.size / 1024) + 'KB' : 'Unknown'}
    Modified: ${file.modifiedTime}
    ---`).join('\n')}

    For each file, provide exactly ONE suggestion object with:
    - fileId: "${fileDetails.map(f => f.id).join('" or "')}"
    - originalName: current file name
    - suggestedName: improved file name
    - renameReasoning: why this name is better
    - suggestedFolder: folder path (can be null if no organization needed)
    - folderReasoning: why this folder structure (can be null)
    - confidence: 0-1 score

    Return a JSON array with exactly ${fileDetails.length} objects, one per file.`

    // Call Gemini AI API
    const aiResponse = await callGeminiAPI(prompt)

    // Parse AI response
    let suggestions = []
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedSuggestions = JSON.parse(jsonMatch[0])
        suggestions = parsedSuggestions.map(suggestion => ({
          id: uuidv4(),
          fileId: suggestion.fileId || fileDetails.find(f => f.name === suggestion.originalName)?.id,
          originalName: suggestion.originalName,
          suggestedName: suggestion.suggestedName,
          renameReasoning: suggestion.renameReasoning || suggestion.reasoning,
          suggestedFolder: suggestion.suggestedFolder || null,
          folderReasoning: suggestion.folderReasoning || null,
          confidence: suggestion.confidence || 0.7
        }))
      } else {
        // Fallback: create basic suggestions
        suggestions = fileDetails.map(file => ({
          id: uuidv4(),
          fileId: file.id,
          originalName: file.name,
          suggestedName: file.name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          renameReasoning: 'Improved capitalization and spacing',
          suggestedFolder: null,
          folderReasoning: null,
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
        renameReasoning: 'AI parsing failed, no changes suggested',
        suggestedFolder: null,
        folderReasoning: null,
        confidence: 0.5
      }))
    }

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
