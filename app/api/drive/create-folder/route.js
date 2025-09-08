import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, parentId } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    
    const drive = google.drive({ version: 'v3', auth })
    
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder'
    }
    
    if (parentId) {
      fileMetadata.parents = [parentId]
    }
    
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id,name,parents'
    })
    
    return NextResponse.json({
      success: true,
      folder: response.data
    })
    
  } catch (error) {
    console.error('Create Folder Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create folder'
    }, { status: 500 })
  }
}
