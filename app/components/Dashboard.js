'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import FileTree from './FileTree'
import GooglePicker from './GooglePicker'
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
  const [pickerStatus, setPickerStatus] = useState(null)
  const [showPickerMessage, setShowPickerMessage] = useState(true)
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Navbar */}
      <div className="flex-shrink-0">
        <Navbar user={session?.user} onSignOut={signOut} />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex w-full h-full"
        >
          {/* Fixed Left Sidebar - AI Assistant */}
          <div className="w-96 bg-white border-r border-gray-200 p-6 flex flex-col h-full flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <FaBrain className="text-blue-600" />
              <span>AI Assistant</span>
            </h3>
            
            <div className="mb-6">
              <AIPromptSection 
                selectedFiles={selectedFiles}
                onExecutePrompt={executeCustomPrompt}
                loading={loading}
              />
            </div>
            
            <div className="flex-1 min-h-0">
              <StatusLog logs={logs} />
            </div>
          </div>

          {/* Scrollable Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Drive Files Section */}
            {pickerStatus && showPickerMessage && (
              <div className="mb-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-blue-700">Google Picker status:</p>
                      <p className="text-sm text-gray-800">
                        {pickerStatus.missing && pickerStatus.missing.length > 0
                          ? pickerStatus.missing.join('; ')
                          : 'Picker ready and configured.'}
                      </p>
                    </div>
                    <div>
                      <button onClick={() => setShowPickerMessage(false)} className="text-sm text-gray-500 hover:text-gray-800">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6" style={{minHeight: '60vh'}}>
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
                  <GooglePicker
                    oauthToken={session?.accessToken}
                    developerKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}
                    appId={process.env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID}
                    onStatus={(status) => setPickerStatus(status)}
                    onPick={(docs) => {
                      // Docs is an array of picked files from the Picker
                      const pickedIds = docs.map(d => d.id)
                      // Merge into selectedFiles (dedupe)
                      setSelectedFiles(prev => Array.from(new Set([...prev, ...pickedIds])))
                      // Optionally fetch content for the picked files if you want immediate analysis
                      // e.g. fetch('/api/drive/content', { method: 'POST', body: JSON.stringify({ fileId: pickedIds[0] }) })
                    }} />
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
              
              <div style={{height: 'calc(70vh - 120px)'}}>
                <FileTree
                  files={files}
                  selectedFiles={selectedFiles}
                  onSelectionChange={setSelectedFiles}
                  loading={loading}
                />
              </div>
            </div>

            {/* AI Suggestions Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-4" style={{minHeight: '320px'}}>
              <AISuggestions
                suggestions={suggestions}
                onApplyChanges={applyChanges}
                loading={loading}
              />
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

