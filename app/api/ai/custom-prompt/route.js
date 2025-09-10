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
  // Don't convert prompt to lowercase to preserve case sensitivity
  
  // Check for explicit move command first
  const moveToFolderMatch = prompt.match(/move.*(?:to|into)(?: a)? folder (?:called |named )?['""]?([^'""\n]+)['""]?/i) ||
                           prompt.match(/move.*(?:to|into) ['""]?([^'""\n]+)['""]? folder/i)
  
  if (moveToFolderMatch) {
    // Preserve the exact case of the folder name from the original prompt
    const folderName = moveToFolderMatch[1].trim()
    const actions = []
    
    // Get parent folder ID from the first file (assuming all files are in the same folder)
    const parentFolderId = files[0]?.parents?.[0]
    
    // Create the specified folder with exact case preservation
    actions.push({
      type: 'create_folder',
      name: folderName, // Using the exact case from the original match
      parentFolderId: parentFolderId,
      reasoning: `Creating folder "${folderName}" with preserved case in the current directory as explicitly requested for file movement`
    })
    
    // Move all selected files to this folder
    for (const file of files) {
      actions.push({
        type: 'move_file',
        fileId: file.id,
        fileName: file.name,
        targetFolder: folderName,
        reasoning: `Moving to folder "${folderName}" in the current directory as explicitly requested`
      })
    }
    
    return {
      summary: `Moving ${files.length} files to "${folderName}" folder as requested.`,
      contentGroups: [{
        id: 'explicit_move_group',
        files: files,
        commonThemes: ['user-specified-move'],
        suggestedFolder: folderName,
        reasoning: 'Moving files to user-specified folder'
      }],
      folderStructure: [{
        name: folderName,
        fileCount: files.length,
        themes: ['user-specified']
      }],
      actions: actions,
      reasoning: `Based on your request to move files to a folder named "${folderName}", I will create this folder (if it doesn't exist) and move all selected files into it.`
    }
  }
  
  // Check for explicit folder creation command
  const createFolderMatch = prompt.match(/create (?:a )?folder (?:called |named )?['""]?([^'""\n]+)['""]?/i)
  
  if (createFolderMatch) {
    // User explicitly specified a folder name - preserve exact case
    const folderName = createFolderMatch[1].trim()
    const actions = []
    
    // Create the specified folder
    actions.push({
      type: 'create_folder',
      name: folderName,
      reasoning: `Creating folder "${folderName}" as explicitly requested`
    })
    
    // Move all selected files to this folder
    for (const file of files) {
      actions.push({
        type: 'move_file',
        fileId: file.id,
        fileName: file.name,
        targetFolder: folderName,
        reasoning: `Moving to folder "${folderName}" as requested`
      })
    }
    
    return {
      summary: `Creating folder "${folderName}" and moving ${files.length} files as requested.`,
      contentGroups: [{
        id: 'explicit_group',
        files: files,
        commonThemes: ['user-specified'],
        suggestedFolder: folderName,
        reasoning: 'User-specified folder name'
      }],
      folderStructure: [{
        name: folderName,
        fileCount: files.length,
        themes: ['user-specified']
      }],
      actions: actions,
      reasoning: `Based on your request to create a folder named "${folderName}", I will create this folder and move all selected files into it.`
    }
  }
  
  // If no explicit folder name was given, fall back to content analysis
  const contentGroups = analyzeContentSimilarity(files)
  
  // Generate folder structure based on analysis
  const folderStructure = generateFolderStructure(contentGroups, prompt)
  
  // Create actions for organizing files
  const actions = []
  const createdFolders = new Set()
  
  for (const group of contentGroups) {
    // Create folder action - only if it hasn't been created yet
    const folderName = group.suggestedFolder
    if (!createdFolders.has(folderName)) {
      actions.push({
        type: 'create_folder',
        name: folderName,
        reasoning: group.reasoning
      })
      createdFolders.add(folderName)
    }
    
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
    
    // Generate improved file name suggestion
    const improvedName = generateImprovedFileName(file)
    file.suggestedName = improvedName
    
    const similarFiles = [file]
    processedFiles.add(file.id)
    
    // Find similar files based on content, name patterns, and type
    for (const otherFile of files) {
      if (processedFiles.has(otherFile.id)) continue
      
      const similarity = calculateSimilarity(file, otherFile)
      if (similarity > 0.3) { // 30% similarity threshold
        // Also generate improved name for similar files
        otherFile.suggestedName = generateImprovedFileName(otherFile)
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
  
  // Create hierarchical folder names based on file type and content
  const fileTypes = new Set(files.map(f => {
    if (f.mimeType.includes('presentation')) return 'Presentations'
    if (f.mimeType.includes('spreadsheet')) return 'Spreadsheets'
    if (f.mimeType.includes('document')) return 'Documents'
    if (f.mimeType.includes('image')) return 'Images'
    if (f.mimeType.includes('video')) return 'Videos'
    if (f.mimeType.includes('audio')) return 'Audio'
    return 'Other'
  }))

  // Get the primary file type
  const primaryType = Array.from(fileTypes)[0]
  
  // Get content-based subfolder from themes
  const contentTheme = themes.find(t => 
    !['images', 'documents', 'spreadsheets', 'presentations', 'videos', 'audio'].includes(t.toLowerCase())
  )

  // Create a hierarchical path if we have both type and content theme
  if (contentTheme && primaryType) {
    return `${primaryType}/${contentTheme.charAt(0).toUpperCase() + contentTheme.slice(1)}`
  }
  
  // Fallback to just the type if no content theme
  return primaryType
}

function generateFolderStructure(groups) {
  return groups.map(group => ({
    name: group.suggestedFolder,
    fileCount: group.files.length,
    themes: group.commonThemes
  }))
}

function generateImprovedFileName(file) {
  const name = file.name
  const nameParts = name.split('.')
  const extension = nameParts.pop()
  let baseName = nameParts.join('.')
  
  // Extract date if present
  const currentYear = new Date().getFullYear()
  const hasYear = baseName.includes(currentYear.toString())
  
  // Add context based on file type
  if (file.mimeType.includes('presentation')) {
    if (!hasYear) {
      baseName = `${baseName}_${currentYear}`
    }
    // Add prefix for presentation types
    if (!baseName.toLowerCase().includes('pitch') && baseName.toLowerCase().includes('startup')) {
      baseName = `Pitch_${baseName}`
    }
  }
  
  // Replace underscores with dashes for readability
  baseName = baseName.replace(/_/g, '-')
  
  // Add version if not present
  if (!baseName.match(/v\d+/i) && !baseName.match(/version-\d+/i)) {
    baseName = `${baseName}-v1`
  }
  
  return `${baseName}.${extension}`
}

function generateReasoningText(prompt, groups) {
  return `Based on your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}", I analyzed the selected files and identified ${groups.length} distinct content groups. Each group contains files with similar characteristics such as file type, naming patterns, and content themes. The suggested folder structure will help organize your files in a logical and accessible way.`
}
