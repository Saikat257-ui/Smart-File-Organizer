'use client'

import { motion } from 'framer-motion'
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa'

export default function ProgressBar({ progress, onClose }) {
  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'running':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <FaCheck className="text-green-400" />
      case 'error':
        return <FaExclamationTriangle className="text-red-400" />
      default:
        return null
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96"
    >
      <div className="glassmorphism p-4 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-white font-medium">
              {progress.status === 'running' ? 'Processing...' : 
               progress.status === 'completed' ? 'Completed' : 
               progress.status === 'error' ? 'Error' : 'Progress'}
            </span>
          </div>
          
          {(progress.status === 'completed' || progress.status === 'error') && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>{progress.current}</span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${getStatusColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Status Text */}
        {progress.current && (
          <div className="text-sm text-gray-400">
            {progress.current}
          </div>
        )}
      </div>
    </motion.div>
  )
}
