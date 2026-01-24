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
          // Create new folder with strictly preserved case
          const folderMetadata = {
            name: String(action.name).valueOf(), // Force exact string representation to preserve case
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
        let targetFolderId = createdFolders.get(action.targetFolder)

        // Get current file metadata first to know the parent
        const file = await drive.files.get({
          fileId: action.fileId,
          fields: 'parents, name'
        })
        const currentParentId = file.data.parents ? file.data.parents[0] : 'root'
        const previousParents = file.data.parents ? file.data.parents.join(',') : ''

        // If folder not in cache, look for it in the current parent or create it
        if (!targetFolderId) {
          // Check if folder exists in current parent
          const existingFolders = await drive.files.list({
            q: `name='${action.targetFolder}' and '${currentParentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id)'
          })

          if (existingFolders.data.files.length > 0) {
            targetFolderId = existingFolders.data.files[0].id
            createdFolders.set(action.targetFolder, targetFolderId)
          } else {
            // Create it
            console.log(`Auto-creating folder '${action.targetFolder}' for file move`)
            const newFolder = await drive.files.create({
              resource: {
                name: action.targetFolder,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [currentParentId]
              },
              fields: 'id'
            })
            targetFolderId = newFolder.data.id
            createdFolders.set(action.targetFolder, targetFolderId)
          }
        }

        // Move file to new folder
        console.log(`[Move Debug] Moving file ${action.fileId} (${action.fileName})`)
        console.log(`[Move Debug] Target Folder ID: ${targetFolderId}, Previous Parents: ${previousParents}`)

        const updateParams = {
          fileId: action.fileId,
          addParents: targetFolderId,
          removeParents: previousParents,
          fields: 'id,parents'
        }
        console.log(`[Move Debug] Update Params:`, JSON.stringify(updateParams))

        const moveResult = await drive.files.update(updateParams)
        console.log(`[Move Debug] Move result:`, JSON.stringify(moveResult.data))

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

    // Rename files
    const renameActions = actions.filter(action => action.type === 'rename_file')
    for (const action of renameActions) {
      try {
        await drive.files.update({
          fileId: action.fileId,
          resource: {
            name: action.newName
          },
          fields: 'id,name'
        })

        results.push({
          action: 'rename_file',
          fileName: action.fileName,
          newName: action.newName,
          success: true,
          message: 'File renamed successfully'
        })
      } catch (error) {
        console.error(`Error renaming file ${action.fileName}:`, error)
        results.push({
          action: 'rename_file',
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
