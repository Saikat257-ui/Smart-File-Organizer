import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { google } from 'googleapis'

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

            content = response.data.toString().substring(0, 5000) // Limit content length
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
          content: content,
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

    return NextResponse.json({
      success: true,
      analysis: fileAnalysis,
      aiResponse: aiResponse,
      actions: aiResponse.actions || []
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
  // This is a simplified AI response generator
  // In a real implementation, you would use OpenAI API, Google AI, or another LLM service
  
  const files = fileAnalysis.filter(f => !f.error)
  
  // Analyze content similarity
  const contentGroups = analyzeContentSimilarity(files)
  
  // Generate folder structure based on analysis
  const folderStructure = generateFolderStructure(contentGroups, prompt)
  
  // Create actions for organizing files
  const actions = []
  
  for (const group of contentGroups) {
    // Create folder action
    const folderName = group.suggestedFolder
    actions.push({
      type: 'create_folder',
      name: folderName,
      reasoning: group.reasoning
    })
    
    // Move files actions
    for (const file of group.files) {
      actions.push({
        type: 'move_file',
        fileId: file.id,
        fileName: file.name,
        targetFolder: folderName,
        reasoning: `File contains ${group.commonThemes.join(', ')}`
      })
    }
  }

  return {
    summary: `Analyzed ${files.length} files and identified ${contentGroups.length} content groups. Created organization plan with ${actions.filter(a => a.type === 'create_folder').length} folders.`,
    contentGroups: contentGroups,
    folderStructure: folderStructure,
    actions: actions,
    reasoning: generateReasoningText(prompt, contentGroups)
  }
}

function analyzeContentSimilarity(files) {
  const groups = []
  const processedFiles = new Set()
  
  for (const file of files) {
    if (processedFiles.has(file.id)) continue
    
    const similarFiles = [file]
    processedFiles.add(file.id)
    
    // Find similar files based on content, name patterns, and type
    for (const otherFile of files) {
      if (processedFiles.has(otherFile.id)) continue
      
      const similarity = calculateSimilarity(file, otherFile)
      if (similarity > 0.3) { // 30% similarity threshold
        similarFiles.push(otherFile)
        processedFiles.add(otherFile.id)
      }
    }
    
    // Determine group characteristics
    const commonThemes = extractCommonThemes(similarFiles)
    const suggestedFolder = generateFolderName(similarFiles, commonThemes)
    
    groups.push({
      id: `group_${groups.length + 1}`,
      files: similarFiles,
      commonThemes: commonThemes,
      suggestedFolder: suggestedFolder,
      reasoning: `Files share common characteristics: ${commonThemes.join(', ')}`
    })
  }
  
  return groups
}

function calculateSimilarity(file1, file2) {
  let similarity = 0
  
  // MIME type similarity
  if (file1.mimeType === file2.mimeType) {
    similarity += 0.3
  }
  
  // Name pattern similarity
  const name1Words = file1.name.toLowerCase().split(/[\s\-_\.]/)
  const name2Words = file2.name.toLowerCase().split(/[\s\-_\.]/)
  const commonWords = name1Words.filter(word => name2Words.includes(word) && word.length > 2)
  if (commonWords.length > 0) {
    similarity += Math.min(0.4, commonWords.length * 0.1)
  }
  
  // Content similarity (basic keyword matching)
  if (file1.content && file2.content && file1.content !== 'Content not accessible' && file2.content !== 'Content not accessible') {
    const content1Words = file1.content.toLowerCase().split(/\s+/).slice(0, 100)
    const content2Words = file2.content.toLowerCase().split(/\s+/).slice(0, 100)
    const commonContentWords = content1Words.filter(word => 
      content2Words.includes(word) && word.length > 3
    )
    if (commonContentWords.length > 2) {
      similarity += Math.min(0.3, commonContentWords.length * 0.05)
    }
  }
  
  return similarity
}

function extractCommonThemes(files) {
  const themes = []
  
  // Extract themes from file types
  const mimeTypes = [...new Set(files.map(f => f.mimeType))]
  if (mimeTypes.length === 1) {
    const type = mimeTypes[0]
    if (type.includes('image')) themes.push('images')
    else if (type.includes('video')) themes.push('videos')
    else if (type.includes('audio')) themes.push('audio')
    else if (type.includes('text') || type.includes('document')) themes.push('documents')
    else if (type.includes('spreadsheet')) themes.push('spreadsheets')
    else if (type.includes('presentation')) themes.push('presentations')
  }
  
  // Extract themes from file names
  const allWords = files.flatMap(f => 
    f.name.toLowerCase().split(/[\s\-_\.]/).filter(word => word.length > 2)
  )
  const wordCounts = {}
  allWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })
  
  const commonWords = Object.entries(wordCounts)
    .filter(([word, count]) => count >= Math.ceil(files.length * 0.5))
    .map(([word]) => word)
    .slice(0, 3)
  
  themes.push(...commonWords)
  
  return themes.length > 0 ? themes : ['mixed content']
}

function generateFolderName(files, themes) {
  if (themes.length === 0) return 'Miscellaneous'
  
  // Create meaningful folder names
  const primaryTheme = themes[0]
  
  if (primaryTheme === 'images') return 'Images & Media'
  if (primaryTheme === 'documents') return 'Documents'
  if (primaryTheme === 'spreadsheets') return 'Spreadsheets & Data'
  if (primaryTheme === 'presentations') return 'Presentations'
  if (primaryTheme === 'videos') return 'Videos'
  if (primaryTheme === 'audio') return 'Audio Files'
  
  // Use the most common word/theme
  return themes.slice(0, 2).map(t => 
    t.charAt(0).toUpperCase() + t.slice(1)
  ).join(' & ') + ' Files'
}

function generateFolderStructure(groups) {
  return groups.map(group => ({
    name: group.suggestedFolder,
    fileCount: group.files.length,
    themes: group.commonThemes
  }))
}

function generateReasoningText(prompt, groups) {
  return `Based on your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}", I analyzed the selected files and identified ${groups.length} distinct content groups. Each group contains files with similar characteristics such as file type, naming patterns, and content themes. The suggested folder structure will help organize your files in a logical and accessible way.`
}
