'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaFolder, 
  FaFolderOpen, 
  FaFile, 
  FaFileWord, 
  FaFilePdf, 
  FaFileImage, 
  FaFileVideo,
  FaFileAudio,
  FaChevronRight,
  FaChevronDown
} from 'react-icons/fa'

const getFileIcon = (mimeType, name) => {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return FaFolder
  }
  
  if (mimeType?.includes('document') || name?.endsWith('.docx') || name?.endsWith('.doc')) {
    return FaFileWord
  }
  
  if (mimeType?.includes('pdf') || name?.endsWith('.pdf')) {
    return FaFilePdf
  }
  
  if (mimeType?.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name)) {
    return FaFileImage
  }
  
  if (mimeType?.includes('video') || /\.(mp4|avi|mov|wmv|flv)$/i.test(name)) {
    return FaFileVideo
  }
  
  if (mimeType?.includes('audio') || /\.(mp3|wav|flac|aac)$/i.test(name)) {
    return FaFileAudio
  }
  
  return FaFile
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return null
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  if (i === 0) return `${bytes} B`
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const FileItem = ({ file, level = 0, selectedFiles, onSelectionChange, expandedFolders, onToggleFolder }) => {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
  const isExpanded = expandedFolders.has(file.id)
  const isSelected = selectedFiles.includes(file.id)
  const Icon = getFileIcon(file.mimeType, file.name)
  
  const handleSelect = (e) => {
    e.stopPropagation()
    if (isSelected) {
      onSelectionChange(selectedFiles.filter(id => id !== file.id))
    } else {
      onSelectionChange([...selectedFiles, file.id])
    }
  }
  
  const handleToggle = () => {
    if (isFolder) {
      onToggleFolder(file.id)
    }
  }
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`file-tree-item ${isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'} p-2 rounded-md cursor-pointer`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        <div className="flex items-center space-x-2 min-w-0" onClick={handleToggle}>
          {isFolder && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <FaChevronRight className="text-gray-600 text-xs" />
            </motion.div>
          )}
          
          <Icon className={`text-lg flex-shrink-0 ${
            isFolder ? (isExpanded ? 'text-yellow-600' : 'text-blue-600') : 'text-gray-600'
          }`} />
          
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span 
              className="text-gray-800 text-sm truncate pr-2" 
              title={file.name}
            >
              {file.name}
            </span>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {formatFileSize(file.size) && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatFileSize(file.size)}
                </span>
              )}
              
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelect}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isFolder && isExpanded && file.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {file.children.map(child => (
              <FileItem
                key={child.id}
                file={child}
                level={level + 1}
                selectedFiles={selectedFiles}
                onSelectionChange={onSelectionChange}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FileTree({ files, selectedFiles, onSelectionChange, loading }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  
  const handleToggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }
  
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const selectAll = () => {
    const allFileIds = files.map(file => file.id)
    onSelectionChange(allFileIds)
  }
  
  const deselectAll = () => {
    onSelectionChange([])
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Search and Controls - Fixed */}
      <div className="flex items-center space-x-4 mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-white/50 backdrop-blur-sm border-[1.5px] border-gray-200/50 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all duration-200 hover:border-gray-300/50"
          // className="flex-1 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 shadow-sm transition duration-200 hover:border-gray-400"
          // className="flex-1 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-md px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
        />
        
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm px-3 py-1 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm px-3 py-1 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* File Tree - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-[#ecece6] border border-gray-600 shadow-inner rounded-xl p-4">
        <div className="space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {searchTerm ? 'No files match your search' : 'No files found'}
            </div>
          ) : (
            filteredFiles.map(file => (
              <FileItem
                key={file.id}
                file={file}
                selectedFiles={selectedFiles}
                onSelectionChange={onSelectionChange}
                expandedFolders={expandedFolders}
                onToggleFolder={handleToggleFolder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
