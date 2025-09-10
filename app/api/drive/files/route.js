import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken || session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        message: session.error === 'RefreshAccessTokenError' 
          ? 'Your session has expired. Please sign in again.' 
          : 'Not authenticated'
      }, { status: 401 })
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    auth.setCredentials({ 
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    })
    
    const drive = google.drive({ version: 'v3', auth })
    
    // Get all files owned by the user (not shared)
    const response = await drive.files.list({
      q: "trashed=false and 'me' in owners",
      fields: 'files(id,name,mimeType,size,modifiedTime,parents,webViewLink)',
      pageSize: 1000,
      orderBy: 'name'
    })
    
    const files = response.data.files || []
    
    // Build hierarchical structure
    const fileMap = new Map()
    const rootFiles = []
    
    // First pass: create file objects
    files.forEach(file => {
      fileMap.set(file.id, {
        ...file,
        children: []
      })
    })
    
    // Second pass: build hierarchy
    files.forEach(file => {
      const fileObj = fileMap.get(file.id)
      
      if (file.parents && file.parents.length > 0) {
        const parent = fileMap.get(file.parents[0])
        if (parent) {
          parent.children.push(fileObj)
        } else {
          rootFiles.push(fileObj)
        }
      } else {
        rootFiles.push(fileObj)
      }
    })
    
    return NextResponse.json({
      success: true,
      files: rootFiles,
      totalCount: files.length
    })
    
  } catch (error) {
    console.error('Drive API Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch files'
    }, { status: 500 })
  }
}
