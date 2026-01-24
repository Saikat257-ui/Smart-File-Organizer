'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaRobot, FaPaperPlane, FaSpinner, FaLightbulb, FaFolderPlus } from 'react-icons/fa'

export default function AIPromptSection({ selectedFiles, onExecutePrompt, loading }) {
  const [prompt, setPrompt] = useState('')
  const [promptHistory, setPromptHistory] = useState([])

  const predefinedPrompts = [
    {
      id: 'organize-content',
      title: 'Organize by Content Similarity',
      icon: '🧠',
      prompt: 'Analyze the content of the selected files thoroughly and organize them into folders based on content similarity. Create folders with justified names and put files with similar content in the same folder, while placing files with different content in distinct folders.'
    },
    {
      id: 'organize-type',
      title: 'Organize by File Type & Purpose',
      icon: '📁',
      prompt: 'Organize the selected files by analyzing their type and purpose. Create appropriate folder structures and move files into categories that make sense for their intended use.'
    },
    {
      id: 'organize-date',
      title: 'Organize by Date & Project',
      icon: '📅',
      prompt: 'Analyze the selected files and organize them by creation date and project relevance. Create a logical folder hierarchy that groups files by time periods and related projects.'
    }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim() || selectedFiles.length === 0) return

    const newPrompt = {
      id: Date.now(),
      text: prompt,
      timestamp: new Date().toLocaleString(),
      fileCount: selectedFiles.length
    }

    setPromptHistory(prev => [newPrompt, ...prev.slice(0, 4)]) // Keep last 5 prompts
    onExecutePrompt(prompt, selectedFiles)
    setPrompt('')
  }

  const usePredefinedPrompt = (predefinedPrompt) => {
    setPrompt(predefinedPrompt.prompt)
  }

  const useHistoryPrompt = (historyPrompt) => {
    setPrompt(historyPrompt.text)
  }

  return (
    <div className="flex flex-col">
      {/* Quick Actions Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          {predefinedPrompts.map((predefined) => (
            <button
              key={predefined.id}
              onClick={() => usePredefinedPrompt(predefined)}
              disabled={selectedFiles.length === 0}
              className="w-full text-left p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span className="text-sm">{predefined.icon}</span>
              <span className="font-medium text-gray-800 text-xs">{predefined.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom AI Command Section */}
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Custom AI Command</h3>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="relative" style={{height: '160px'}}>
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 p-[1px]">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  // placeholder={selectedFiles.length === 0 
                  //   ? "Select files from 'Your Drive Files' section first, then describe what you want the AI to do...\n\nExample: 'Analyze these documents and create folders based on their topics.'"
                  //   : "Describe what you want the AI to do with your selected files...\n\nExample: 'Analyze these documents and create folders based on their topics.'"}
                  className="w-full h-full px-3 py-2 bg-white rounded-[7px] text-gray-800 placeholder-gray-500 focus:outline-none resize-none text-sm"
                  disabled={loading}
                />
              </div>
            </div>
            {selectedFiles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <FaFolderPlus className="text-2xl mx-auto mb-2" />
                  <p className="text-sm">Select files to enable AI commands</p>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim() || selectedFiles.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-3 transition-colors"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaPaperPlane />
                <span>Execute AI Command</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
