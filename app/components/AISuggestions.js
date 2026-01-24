'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaArrowRight, FaBrain, FaSpinner, FaFolder } from 'react-icons/fa'

const SuggestionCard = ({ suggestion, onApprove, onReject, onFolderApprove, onFolderReject, approved, rejected, folderApproved, folderRejected }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 border-l-4 mb-3 hover:bg-gray-50 transition-all duration-300 ${approved ? 'border-green-500 bg-green-50' :
        rejected ? 'border-red-500 bg-red-50' :
          'border-blue-500'
        }`}
    >
      <div className="space-y-4">
        {/* File Info */}
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">File Rename</span> • <span className="break-all text-gray-700">{suggestion.originalName}</span>
        </div>

        {/* Rename Suggestion */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Original Name</div>
          <div className="text-sm text-gray-700 break-all bg-gray-100 p-3 rounded-md border border-gray-200">{suggestion.originalName}</div>

          <div className="flex justify-center">
            <FaArrowRight className="text-gray-500 text-sm" />
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Suggested Name</div>
          <div className="text-sm text-gray-800 font-medium break-all bg-blue-100 p-3 rounded-md border border-blue-200">{suggestion.suggestedName}</div>
        </div>

        {/* Rename Reasoning */}
        {suggestion.renameReasoning && (
          <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md border border-gray-200">
            <span className="font-medium">Rename Reason: </span>{suggestion.renameReasoning}
          </div>
        )}

        {/* Folder Suggestion */}
        {suggestion.suggestedFolder && (
          <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FaFolder className="text-purple-600" />
                <span className="text-sm font-medium text-gray-800">Folder Organization</span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => onFolderApprove(suggestion.id)}
                  className={`p-1 rounded transition-colors ${folderApproved ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-green-200 text-gray-600'
                    }`}
                  title="Approve folder creation"
                >
                  <FaCheck className="text-xs" />
                </button>
                <button
                  onClick={() => onFolderReject(suggestion.id)}
                  className={`p-1 rounded transition-colors ${folderRejected ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-red-200 text-gray-600'
                    }`}
                  title="Reject folder creation"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>
            <div className="text-sm text-purple-700 font-mono break-all mb-2">{suggestion.suggestedFolder}</div>
            {suggestion.folderReasoning && (
              <div className="text-xs text-gray-600">{suggestion.folderReasoning}</div>
            )}
          </div>
        )}

        {/* Main Actions */}
        {!approved && !rejected && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onApprove(suggestion.id)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-medium"
            >
              <FaCheck className="text-sm" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => onReject(suggestion.id)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-medium"
            >
              <FaTimes className="text-sm" />
              <span>Reject</span>
            </button>
          </div>
        )}

        {/* Status */}
        {approved && (
          <div className="text-green-700 text-sm flex items-center space-x-2 bg-green-100 p-2 rounded-md border border-green-200">
            <FaCheck />
            <span className="font-medium">Approved for application</span>
          </div>
        )}

        {rejected && (
          <div className="text-red-700 text-sm flex items-center space-x-2 bg-red-100 p-2 rounded-md border border-red-200">
            <FaTimes />
            <span className="font-medium">Rejected</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AISuggestions({ suggestions, onApplyChanges, loading }) {
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])
  const [folderApproved, setFolderApproved] = useState([])
  const [folderRejected, setFolderRejected] = useState([])
  const [currentPage, setCurrentPage] = useState(0)

  const handleApprove = (suggestionId) => {
    setApproved([...approved, suggestionId])
    setRejected(rejected.filter(id => id !== suggestionId))

    // Auto-approve folder if generic approve is clicked and folder suggestion exists
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion && suggestion.suggestedFolder) {
      setFolderApproved(prev => [...prev.filter(id => id !== suggestionId), suggestionId])
      setFolderRejected(prev => prev.filter(id => id !== suggestionId))
    }
  }

  const handleReject = (suggestionId) => {
    setRejected([...rejected, suggestionId])
    setApproved(approved.filter(id => id !== suggestionId))
  }

  const handleFolderApprove = (suggestionId) => {
    setFolderApproved([...folderApproved, suggestionId])
    setFolderRejected(folderRejected.filter(id => id !== suggestionId))
  }

  const handleFolderReject = (suggestionId) => {
    setFolderRejected([...folderRejected, suggestionId])
    setFolderApproved(folderApproved.filter(id => id !== suggestionId))
  }

  const handleApproveAll = () => {
    setApproved(suggestions.map(s => s.id))
    setRejected([])
  }

  const handleRejectAll = () => {
    setRejected(suggestions.map(s => s.id))
    setApproved([])
  }

  const handleApplyChanges = () => {
    const approvedSuggestions = suggestions.filter(s => approved.includes(s.id)).map(s => ({
      ...s,
      includeFolderCreation: folderApproved.includes(s.id)
    }))
    onApplyChanges(approvedSuggestions)
  }

  const handleNextSuggestion = () => {
    setCurrentPage(prev => Math.min(prev + 1, suggestions.length - 1))
  }

  const handlePrevSuggestion = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }

  return (
    <div className="h-full flex flex-col">
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <FaSpinner className="text-2xl text-blue-600 animate-spin" />
        </div>
      ) : suggestions.length > 0 ? (
        <>
          {/* Controls */}
          <div className="flex justify-between gap-4 mb-4">
            <button
              onClick={handleApproveAll}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg flex items-center justify-center gap-2 py-2 transition-colors"
            >
              <FaCheck className="text-green-600" />
              <span>Approve All</span>
            </button>

            <button
              onClick={handleRejectAll}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg flex items-center justify-center gap-2 py-2 transition-colors"
            >
              <FaTimes className="text-red-600" />
              <span>Reject All</span>
            </button>
          </div>

          {/* Current Suggestion Display */}
          <div className="flex-1 overflow-y-auto px-1">
            <AnimatePresence mode="wait">
              <SuggestionCard
                key={suggestions[currentPage].id}
                suggestion={suggestions[currentPage]}
                onApprove={handleApprove}
                onReject={handleReject}
                onFolderApprove={handleFolderApprove}
                onFolderReject={handleFolderReject}
                approved={approved.includes(suggestions[currentPage].id)}
                rejected={rejected.includes(suggestions[currentPage].id)}
                folderApproved={folderApproved.includes(suggestions[currentPage].id)}
                folderRejected={folderRejected.includes(suggestions[currentPage].id)}
              />
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          {suggestions.length > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <button
                onClick={handlePrevSuggestion}
                disabled={currentPage === 0}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span>{currentPage + 1} of {suggestions.length}</span>
              <button
                onClick={handleNextSuggestion}
                disabled={currentPage === suggestions.length - 1}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-3 py-1 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Apply Changes Button */}
          {approved.length > 0 && (
            <button
              onClick={handleApplyChanges}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 w-full flex items-center justify-center gap-2 transition-colors"
            >
              <FaCheck />
              <span>Apply {approved.length} Changes</span>
            </button>
          )}
        </>
      ) : (
        // <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
        //   <FaBrain className="text-4xl" />
        //   <p className="text-sm">No suggestions yet</p>
        // </div>
        <div className="flex items-center justify-center w-full min-h-[300px]">
          <div className="flex flex-col items-center text-gray-400 space-y-2">
            <FaBrain className="text-4xl" />
            <p className="text-sm">No suggestions yet</p>
          </div>
        </div>



      )}
    </div>
  )
}
