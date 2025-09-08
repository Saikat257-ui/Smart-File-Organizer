'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaFolder, FaFile, FaSpinner, FaEye, FaRobot } from 'react-icons/fa'

export default function AIAnalysisResults({ analysisData, onExecuteActions, loading }) {
  const [selectedActions, setSelectedActions] = useState(new Set())
  const [showDetails, setShowDetails] = useState(false)

  if (!analysisData) return null

  const { aiResponse, analysis } = analysisData
  const { actions = [], contentGroups = [], summary = '', reasoning = '' } = aiResponse

  const toggleAction = (actionIndex) => {
    const newSelected = new Set(selectedActions)
    if (newSelected.has(actionIndex)) {
      newSelected.delete(actionIndex)
    } else {
      newSelected.add(actionIndex)
    }
    setSelectedActions(newSelected)
  }

  const selectAll = () => {
    setSelectedActions(new Set(actions.map((_, index) => index)))
  }

  const deselectAll = () => {
    setSelectedActions(new Set())
  }

  const executeSelectedActions = () => {
    const selectedActionsList = actions.filter((_, index) => selectedActions.has(index))
    onExecuteActions(selectedActionsList)
  }

  const folderActions = actions.filter(action => action.type === 'create_folder')
  const moveActions = actions.filter(action => action.type === 'move_file')

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center space-x-3">
          <FaRobot className="text-green-400 text-2xl" />
          <span>AI Analysis Results</span>
        </h3>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-300 hover:text-white flex items-center space-x-2 transition-colors"
        >
          <FaEye />
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
        <h4 className="font-medium text-blue-200 mb-2">Analysis Summary</h4>
        <p className="text-sm text-gray-200">{summary}</p>
      </div>

      {/* Detailed Analysis */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 space-y-4"
          >
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="font-medium text-white mb-2">AI Reasoning</h4>
              <p className="text-sm text-gray-300">{reasoning}</p>
            </div>

            {contentGroups.length > 0 && (
              <div className="p-4 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                <h4 className="font-medium text-purple-200 mb-3">Content Groups Identified</h4>
                <div className="space-y-3">
                  {contentGroups.map((group, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{group.suggestedFolder}</span>
                        <span className="text-xs text-gray-400">{group.files.length} files</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{group.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.commonThemes.map((theme, themeIndex) => (
                          <span
                            key={themeIndex}
                            className="text-xs px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Preview */}
      {actions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">Proposed Actions</h4>
            <div className="flex space-x-2">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1 bg-green-600/30 text-green-200 rounded-full hover:bg-green-600/40 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-xs px-3 py-1 bg-red-600/30 text-red-200 rounded-full hover:bg-red-600/40 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Folder Creation Actions */}
            {folderActions.map((action, index) => {
              const actionIndex = actions.indexOf(action)
              return (
                <div
                  key={`folder-${index}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedActions.has(actionIndex)
                      ? 'bg-green-500/20 border-green-400/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => toggleAction(actionIndex)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedActions.has(actionIndex)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedActions.has(actionIndex) && <FaCheck className="text-xs text-white" />}
                    </div>
                    <FaFolder className="text-yellow-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Create Folder: {action.name}</div>
                      {action.reasoning && (
                        <div className="text-xs text-gray-300 mt-1">{action.reasoning}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* File Move Actions */}
            {moveActions.map((action, index) => {
              const actionIndex = actions.indexOf(action)
              return (
                <div
                  key={`move-${index}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedActions.has(actionIndex)
                      ? 'bg-blue-500/20 border-blue-400/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => toggleAction(actionIndex)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedActions.has(actionIndex)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedActions.has(actionIndex) && <FaCheck className="text-xs text-white" />}
                    </div>
                    <FaFile className="text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        Move "{action.fileName}" → {action.targetFolder}
                      </div>
                      {action.reasoning && (
                        <div className="text-xs text-gray-300 mt-1">{action.reasoning}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Execute Actions Button */}
      {selectedActions.size > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={executeSelectedActions}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Executing Actions...</span>
            </>
          ) : (
            <>
              <FaCheck />
              <span>Execute {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}</span>
            </>
          )}
        </motion.button>
      )}

      {actions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <FaRobot className="text-4xl mx-auto mb-3 opacity-40" />
          <p className="text-sm">No actions were generated from the analysis</p>
        </div>
      )}
    </div>
  )
}
