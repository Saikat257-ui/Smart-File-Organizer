import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '../../auth/[...nextauth]/route'

// Helper function to create folder structure
async function createFolderStructure(drive, folderPath, parentId = 'root') {
  if (!folderPath || folderPath === '/') {
    return parentId
  }

  // Remove leading/trailing slashes and split path
  const pathParts = folderPath.replace(/^\/+|\/+$/g, '').split('/')
  let currentParentId = parentId

  for (const folderName of pathParts) {
    if (!folderName) continue

    // Check if folder already exists
    const existingFolders = await drive.files.list({
      q: `name='${folderName}' and parents in '${currentParentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    })

    if (existingFolders.data.files.length > 0) {
      currentParentId = existingFolders.data.files[0].id
    } else {
      // Create new folder
      const newFolder = await drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentParentId]
        },
        fields: 'id'
      })
      currentParentId = newFolder.data.id
    }
  }

  return currentParentId
}

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
        let targetFolderId = null

        // Handle folder moving - only if folder creation was approved
        if (change.suggestedFolder && change.includeFolderCreation) {
          try {
            targetFolderId = await createFolderStructure(drive, change.suggestedFolder)

            // Get current parents
            const file = await drive.files.get({
              fileId: change.fileId,
              fields: 'parents'
            })

            const previousParents = file.data.parents ? file.data.parents.join(',') : ''

            updateData.addParents = targetFolderId
            updateData.removeParents = previousParents
          } catch (folderError) {
            console.error(`Error creating folder structure for ${change.suggestedFolder}:`, folderError)
            results.push({
              fileId: change.fileId,
              success: false,
              error: `Failed to create folder structure: ${folderError.message}`,
              change: change
            })
            continue
          }
        }

        // Handle file renaming
        if (change.suggestedName && change.suggestedName !== change.originalName) {
          updateData.name = change.suggestedName
        }

        if (Object.keys(updateData).length > 0) {
          const updateParams = {
            fileId: change.fileId,
            fields: 'id, name, parents'
          }

          // Prepare request body for metadata updates
          const requestBody = {}
          if (updateData.name) {
            requestBody.name = updateData.name
          }

          // Add requestBody if there are metadata updates
          if (Object.keys(requestBody).length > 0) {
            updateParams.requestBody = requestBody
          }

          // Add query parameters for parents
          if (updateData.addParents) {
            updateParams.addParents = updateData.addParents
          }
          if (updateData.removeParents) {
            updateParams.removeParents = updateData.removeParents
          }

          console.log(`[Drive Update] Applying changes to ${change.fileId}:`, JSON.stringify(updateParams, null, 2))

          const updatedFile = await drive.files.update(updateParams)

          appliedCount++
          results.push({
            fileId: change.fileId,
            success: true,
            change: change,
            updatedFile: updatedFile.data
          })
        } else {
          results.push({
            fileId: change.fileId,
            success: false,
            error: 'No changes to apply',
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
