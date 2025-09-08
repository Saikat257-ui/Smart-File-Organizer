import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { FileProcessor } from '../../../../lib/fileProcessors'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await request.json()
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    
    const drive = google.drive({ version: 'v3', auth })
    
    // Get file metadata
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,size'
    })
    
    const file = fileResponse.data
    let content = null
    let analysis = null
    
    try {
      // Handle Google Docs
      if (file.mimeType === 'application/vnd.google-apps.document') {
        const exportResponse = await drive.files.export({
          fileId: fileId,
          mimeType: 'text/plain'
        })
        content = exportResponse.data
        analysis = FileProcessor.analyzeFileContent(content)
      }
      // Handle Google Sheets
      else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const exportResponse = await drive.files.export({
          fileId: fileId,
          mimeType: 'text/csv'
        })
        content = exportResponse.data
        analysis = FileProcessor.analyzeFileContent(content)
      }
      // Handle other file types
      else if (file.mimeType !== 'application/vnd.google-apps.folder') {
        const downloadResponse = await drive.files.get({
          fileId: fileId,
          alt: 'media'
        })
        
        if (downloadResponse.data) {
          const buffer = Buffer.from(downloadResponse.data)
          const processResult = await FileProcessor.processFile(buffer, file.mimeType, file.name)
          
          if (processResult.success) {
            content = processResult.text
            analysis = FileProcessor.analyzeFileContent(content)
          }
        }
      }
    } catch (contentError) {
      console.error('Error processing file content:', contentError)
      // Continue without content analysis
    }
    
    return NextResponse.json({
      success: true,
      file: file,
      content: content ? content.substring(0, 1000) : null, // Limit content length
      analysis: analysis
    })
    
  } catch (error) {
    console.error('File Content Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get file content'
    }, { status: 500 })
  }
}
