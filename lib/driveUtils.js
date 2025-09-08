import { google } from 'googleapis'

export class DriveUtils {
  constructor(accessToken) {
    this.auth = new google.auth.OAuth2()
    this.auth.setCredentials({ access_token: accessToken })
    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  async createFolder(name, parentId = null) {
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder'
      }
      
      if (parentId) {
        fileMetadata.parents = [parentId]
      }
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      })
      
      return {
        success: true,
        folder: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async moveFile(fileId, newParentId, oldParentId = null) {
    try {
      // Get current parents if not provided
      if (!oldParentId) {
        const file = await this.drive.files.get({
          fileId: fileId,
          fields: 'parents'
        })
        oldParentId = file.data.parents ? file.data.parents.join(',') : ''
      }
      
      const response = await this.drive.files.update({
        fileId: fileId,
        addParents: newParentId,
        removeParents: oldParentId,
        fields: 'id,parents'
      })
      
      return {
        success: true,
        file: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async renameFile(fileId, newName) {
    try {
      const response = await this.drive.files.update({
        fileId: fileId,
        resource: { name: newName },
        fields: 'id,name'
      })
      
      return {
        success: true,
        file: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      })
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getFileMetadata(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,modifiedTime,parents,description,webViewLink'
      })
      
      return {
        success: true,
        file: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async searchFiles(query, maxResults = 100) {
    try {
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
        pageSize: maxResults,
        orderBy: 'modifiedTime desc'
      })
      
      return {
        success: true,
        files: response.data.files || []
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  static buildFileHierarchy(files) {
    const fileMap = new Map()
    const rootFiles = []
    
    // Create file objects with children arrays
    files.forEach(file => {
      fileMap.set(file.id, {
        ...file,
        children: []
      })
    })
    
    // Build parent-child relationships
    files.forEach(file => {
      const fileObj = fileMap.get(file.id)
      
      if (file.parents && file.parents.length > 0) {
        const parent = fileMap.get(file.parents[0])
        if (parent) {
          parent.children.push(fileObj)
        } else {
          // Parent not in current file set, add to root
          rootFiles.push(fileObj)
        }
      } else {
        rootFiles.push(fileObj)
      }
    })
    
    return rootFiles
  }

  static generateFolderStructure(files, suggestions) {
    const folderStructure = new Map()
    
    suggestions.forEach(suggestion => {
      if (suggestion.suggestedPath) {
        const pathParts = suggestion.suggestedPath.split('/')
        let currentPath = ''
        
        pathParts.forEach(part => {
          if (part.trim()) {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            if (!folderStructure.has(currentPath)) {
              folderStructure.set(currentPath, {
                name: part,
                path: currentPath,
                files: []
              })
            }
          }
        })
        
        if (currentPath) {
          folderStructure.get(currentPath).files.push(suggestion.fileId)
        }
      }
    })
    
    return Array.from(folderStructure.values())
  }
}
