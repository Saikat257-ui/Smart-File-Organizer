'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaFolder, FaFile, FaSpinner, FaEye, FaRobot, FaX } from 'react-icons/fa'

export default function AIAnalysisModal({ analysisData, onExecuteActions, loading, isOpen, onClose }) {
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
    onClose()
  }

  const folderActions = actions.filter(action => action.type === 'create_folder')
  const moveActions = actions.filter(action => action.type === 'move_file')
  const renameActions = actions.filter(action => action.type === 'rename_file')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                <FaRobot className="text-green-400 text-3xl" />
                <span>AI Proposed Actions</span>
              </h3>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-gray-300 hover:text-white flex items-center space-x-2 transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <FaEye />
                  <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                </button>

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg"
              >
                <h4 className="font-medium text-blue-200 mb-2">Analysis Summary</h4>
                <p className="text-sm text-gray-200">{summary}</p>
              </motion.div>

              {/* Detailed Analysis */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
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
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white/5 p-3 rounded-md"
                            >
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
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions Preview */}
              {actions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-white text-lg">Proposed Actions</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAll}
                        className="text-xs px-3 py-2 bg-green-600/30 text-green-200 rounded-lg hover:bg-green-600/40 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAll}
                        className="text-xs px-3 py-2 bg-red-600/30 text-red-200 rounded-lg hover:bg-red-600/40 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Rename Actions */}
                    {renameActions.map((action, index) => {
                      const actionIndex = actions.indexOf(action)
                      return (
                        <motion.div
                          key={`rename-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedActions.has(actionIndex)
                              ? 'bg-purple-500/20 border-purple-400/50 shadow-lg'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          onClick={() => toggleAction(actionIndex)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedActions.has(actionIndex)
                                ? 'bg-purple-500 border-purple-500 scale-110'
                                : 'border-gray-400'
                              }`}>
                              {selectedActions.has(actionIndex) && <FaCheck className="text-xs text-white" />}
                            </div>
                            <FaFile className="text-purple-400 text-lg" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                Rename "{action.fileName}" → {action.newName}
                              </div>
                              {action.reasoning && (
                                <div className="text-xs text-gray-300 mt-1">{action.reasoning}</div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Folder Creation Actions */}
                    {folderActions.map((action, index) => {
                      const actionIndex = actions.indexOf(action)
                      return (
                        <motion.div
                          key={`folder-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedActions.has(actionIndex)
                            ? 'bg-green-500/20 border-green-400/50 shadow-lg'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          onClick={() => toggleAction(actionIndex)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedActions.has(actionIndex)
                              ? 'bg-green-500 border-green-500 scale-110'
                              : 'border-gray-400'
                              }`}>
                              {selectedActions.has(actionIndex) && <FaCheck className="text-xs text-white" />}
                            </div>
                            <FaFolder className="text-yellow-400 text-lg" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">Create Folder: {action.name}</div>
                              {action.reasoning && (
                                <div className="text-xs text-gray-300 mt-1">{action.reasoning}</div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* File Move Actions */}
                    {moveActions.map((action, index) => {
                      const actionIndex = actions.indexOf(action)
                      return (
                        <motion.div
                          key={`move-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + (folderActions.length + index) * 0.05 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedActions.has(actionIndex)
                            ? 'bg-blue-500/20 border-blue-400/50 shadow-lg'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          onClick={() => toggleAction(actionIndex)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedActions.has(actionIndex)
                              ? 'bg-blue-500 border-blue-500 scale-110'
                              : 'border-gray-400'
                              }`}>
                              {selectedActions.has(actionIndex) && <FaCheck className="text-xs text-white" />}
                            </div>
                            <FaFile className="text-gray-400 text-lg" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                Move "{action.fileName}" → {action.targetFolder}
                              </div>
                              {action.reasoning && (
                                <div className="text-xs text-gray-300 mt-1">{action.reasoning}</div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {actions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-400"
                >
                  <FaRobot className="text-6xl mx-auto mb-4 opacity-40" />
                  <p className="text-lg">No actions were generated from the analysis</p>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            {selectedActions.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-t border-white/10"
              >
                <button
                  onClick={executeSelectedActions}
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      <span>Executing Actions...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="text-xl" />
                      <span>Execute {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
