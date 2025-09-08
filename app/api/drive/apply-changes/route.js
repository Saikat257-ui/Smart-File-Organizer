import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { changes } = await request.json()
    
    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json({ error: 'Invalid changes data' }, { status: 400 })
    }

    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    
    const drive = google.drive({ version: 'v3', auth })
    
    let appliedCount = 0
    const results = []
    
    for (const change of changes) {
      try {
        const updateData = {}
        
        // Handle file renaming
        if (change.suggestedName && change.suggestedName !== change.originalName) {
          updateData.name = change.suggestedName
        }
        
        // Handle folder moving
        if (change.suggestedPath && change.targetFolderId) {
          // Get current parents
          const file = await drive.files.get({
            fileId: change.fileId,
            fields: 'parents'
          })
          
          const previousParents = file.data.parents ? file.data.parents.join(',') : ''
          
          updateData.addParents = change.targetFolderId
          updateData.removeParents = previousParents
        }
        
        if (Object.keys(updateData).length > 0) {
          await drive.files.update({
            fileId: change.fileId,
            resource: updateData.name ? { name: updateData.name } : {},
            addParents: updateData.addParents,
            removeParents: updateData.removeParents
          })
          
          appliedCount++
          results.push({
            fileId: change.fileId,
            success: true,
            change: change
          })
        }
        
      } catch (error) {
        console.error(`Error applying change for file ${change.fileId}:`, error)
        results.push({
          fileId: change.fileId,
          success: false,
          error: error.message,
          change: change
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      applied: appliedCount,
      total: changes.length,
      results: results
    })
    
  } catch (error) {
    console.error('Apply Changes Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to apply changes'
    }, { status: 500 })
  }
}
