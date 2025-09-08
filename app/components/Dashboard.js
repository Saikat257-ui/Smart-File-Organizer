'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import FileTree from './FileTree'
import AISuggestions from './AISuggestions'
import AIPromptSection from './AIPromptSection'
import AIAnalysisModal from './AIAnalysisModal'
import StatusLog from './StatusLog'
import ProgressBar from './ProgressBar'
import { useSocket } from '../../hooks/useSocket'
import { FaSync, FaBrain, FaSpinner } from 'react-icons/fa'

export default function Dashboard() {
  const { data: session } = useSession()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [lastFetchTime, setLastFetchTime] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const { socket, connected, progress, logs, addLog, clearLogs } = useSocket()

  const addStatusLog = (message, type = 'info') => {
    addLog(message, type)
  }

  const fetchFiles = async (forceRefresh = false) => {
    // Check if we have recent data (within 5 minutes) and not forcing refresh
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    if (!forceRefresh && lastFetchTime && (now - lastFetchTime) < fiveMinutes && files.length > 0) {
      addStatusLog('Using cached file data', 'info')
      return
    }

    setLoading(true)
    addStatusLog('Fetching files from Google Drive...', 'info')
    
    try {
      const response = await fetch('/api/drive/files')
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
        setLastFetchTime(now)
        addStatusLog(`Successfully loaded ${data.files.length} files`, 'success')
      } else {
        addStatusLog('Failed to fetch files: ' + data.error, 'error')
      }
    } catch (error) {
      addStatusLog('Error fetching files: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateAISuggestions = async () => {
    if (selectedFiles.length === 0) {
      addStatusLog('Please select files to get AI suggestions', 'warning')
      return
    }

    setLoading(true)
    addStatusLog(`Generating AI suggestions for ${selectedFiles.length} files...`, 'info')

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: selectedFiles })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.suggestions)
        addStatusLog(`Generated ${data.suggestions.length} AI suggestions`, 'success')
      } else {
        addStatusLog('Failed to generate suggestions: ' + data.error, 'error')
      }
    } catch (error) {
      addStatusLog('Error generating suggestions: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyChanges = async (approvedSuggestions) => {
    setLoading(true)
    addStatusLog(`Applying ${approvedSuggestions.length} changes...`, 'info')

    try {
      const response = await fetch('/api/drive/apply-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: approvedSuggestions })
      })
      
      const data = await response.json()
      
      if (data.success) {
        addStatusLog(`Successfully applied ${data.applied} changes`, 'success')
        fetchFiles(true) // Force refresh the file list after changes
        setSuggestions([])
        setSelectedFiles([])
      } else {
        addStatusLog('Failed to apply changes: ' + data.error, 'error')
      }
    } catch (error) {
      addStatusLog('Error applying changes: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const executeCustomPrompt = async (prompt, selectedFileIds) => {
    // Convert file IDs to full file objects
    const selectedFileObjects = getAllFiles(files).filter(file => selectedFileIds.includes(file.id))
    
    setLoading(true)
    addStatusLog(`Executing AI command on ${selectedFileObjects.length} files...`, 'info')

    try {
      const response = await fetch('/api/ai/custom-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, files: selectedFileObjects })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalysisData(data)
        setShowAnalysisModal(true)
        addStatusLog(`AI analysis completed with ${data.aiResponse.actions.length} proposed actions`, 'success')
      } else {
        addStatusLog('Failed to execute AI command: ' + data.error, 'error')
      }
    } catch (error) {
      addStatusLog('Error executing AI command: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to flatten nested file structure
  const getAllFiles = (fileList) => {
    const allFiles = []
    
    const traverse = (files) => {
      for (const file of files) {
        allFiles.push(file)
        if (file.children && file.children.length > 0) {
          traverse(file.children)
        }
      }
    }
    
    traverse(fileList)
    return allFiles
  }

  const executeActions = async (actions) => {
    setLoading(true)
    addStatusLog(`Executing ${actions.length} actions...`, 'info')

    try {
      const response = await fetch('/api/ai/execute-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const { summary } = data
        addStatusLog(`Actions completed: ${summary.successful}/${summary.total} successful`, 'success')
        fetchFiles(true) // Force refresh the file list after changes
        setAnalysisData(null)
        setShowAnalysisModal(false)
        setSelectedFiles([])
      } else {
        addStatusLog('Failed to execute actions: ' + data.error, 'error')
      }
    } catch (error) {
      addStatusLog('Error executing actions: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session && files.length === 0) {
      fetchFiles()
    }
  }, [session, files.length])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar user={session?.user} onSignOut={signOut} />
      
      <div className="flex-1 container mx-auto px-4 py-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-6 h-full"
        >
          {/* Left Panel - Files and AI Suggestions */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            {/* File Tree Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col min-h-0" style={{height: '500px', maxHeight: '500px'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">Your Drive Files</h2>
                  {selectedFiles.length > 0 && (
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                      {selectedFiles.length} selected
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchFiles(true)}
                    disabled={loading}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-3 py-2 flex items-center space-x-2 text-sm transition-colors disabled:opacity-50"
                  >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={generateAISuggestions}
                    disabled={loading || selectedFiles.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center space-x-2 text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaBrain />}
                    <span>Get AI Suggestions</span>
                  </button>
                </div>
              </div>
              {/* File list with fixed height and scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <FileTree
                  files={files}
                  selectedFiles={selectedFiles}
                  onSelectionChange={setSelectedFiles}
                  loading={loading}
                />
              </div>
            </div>

            {/* AI Suggestions - Bottom Left */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] p-4 h-[400px] flex flex-col">
              <AISuggestions
                suggestions={suggestions}
                onApplyChanges={applyChanges}
                loading={loading}
              />
            </div>
          </div>

          {/* Right Panel - AI Assistant */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-3">
                <FaBrain className="text-blue-600 text-xl" />
                <span>AI Assistant</span>
              </h2>
              
              {/* Selected Files Badge */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* AI Prompt Section */}
              <div className="flex-1 min-h-0">
                <AIPromptSection
                  selectedFiles={selectedFiles}
                  onExecutePrompt={executeCustomPrompt}
                  loading={loading}
                />
              </div>
              
              
              {/* Status Log */}
              <div className="h-40 min-h-0">
                <StatusLog logs={logs} />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Progress Bar Overlay */}
        {progress && (
          <ProgressBar 
            progress={progress} 
            onClose={() => setProgress(null)} 
          />
        )}
        
        {/* AI Analysis Modal */}
        <AIAnalysisModal
          analysisData={analysisData}
          onExecuteActions={executeActions}
          loading={loading}
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
        />
      </div>
    </div>
  )
}
