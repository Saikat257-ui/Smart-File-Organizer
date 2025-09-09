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

    const { actions } = await request.json()

    if (!actions || actions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No actions to execute' 
      }, { status: 400 })
    }

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: session.accessToken })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const results = []
    const createdFolders = new Map() // Track created folders to avoid duplicates

    // Execute actions in order: create folders first, then move files
    const folderActions = actions.filter(action => action.type === 'create_folder')
    const moveActions = actions.filter(action => action.type === 'move_file')

    // Create folders
    for (const action of folderActions) {
      try {
        // Check if folder already exists in the same parent folder
        const parentQuery = action.parentFolderId ? ` and '${action.parentFolderId}' in parents` : ''
        const existingFolders = await drive.files.list({
          q: `name='${action.name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentQuery}`,
          fields: 'files(id,name,parents)'
        })

        let folderId
        if (existingFolders.data.files.length > 0) {
          folderId = existingFolders.data.files[0].id
          results.push({
            action: 'create_folder',
            name: action.name,
            success: true,
            message: 'Folder already exists',
            folderId: folderId
          })
        } else {
          // Create new folder
          const folderMetadata = {
            name: action.name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: action.parentFolderId ? [action.parentFolderId] : undefined
          }

          const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id,name,parents'
          })

          folderId = folder.data.id
          results.push({
            action: 'create_folder',
            name: action.name,
            success: true,
            message: 'Folder created successfully',
            folderId: folderId
          })
        }

        createdFolders.set(action.name, folderId)
      } catch (error) {
        console.error(`Error creating folder ${action.name}:`, error)
        results.push({
          action: 'create_folder',
          name: action.name,
          success: false,
          error: error.message
        })
      }
    }

    // Move files to folders
    for (const action of moveActions) {
      try {
        const targetFolderId = createdFolders.get(action.targetFolder)
        if (!targetFolderId) {
          results.push({
            action: 'move_file',
            fileName: action.fileName,
            success: false,
            error: `Target folder '${action.targetFolder}' not found`
          })
          continue
        }

        // Get current file metadata to find current parents
        const file = await drive.files.get({
          fileId: action.fileId,
          fields: 'parents'
        })

        const previousParents = file.data.parents ? file.data.parents.join(',') : ''

        // Move file to new folder
        await drive.files.update({
          fileId: action.fileId,
          addParents: targetFolderId,
          removeParents: previousParents,
          fields: 'id,parents'
        })

        results.push({
          action: 'move_file',
          fileName: action.fileName,
          targetFolder: action.targetFolder,
          success: true,
          message: 'File moved successfully'
        })
      } catch (error) {
        console.error(`Error moving file ${action.fileName}:`, error)
        results.push({
          action: 'move_file',
          fileName: action.fileName,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    })

  } catch (error) {
    console.error('Execute actions API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
