'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa'

const getLogIcon = (type) => {
  switch (type) {
    case 'success':
      return FaCheckCircle
    case 'error':
      return FaTimesCircle
    case 'warning':
      return FaExclamationTriangle
    default:
      return FaInfoCircle
  }
}

const getLogColor = (type) => {
  switch (type) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    default:
      return 'text-blue-600'
  }
}

export default function StatusLog({ logs }) {
  const logEndRef = useRef(null)
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])
  
  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-800">Status Log</h3>
        <div className="text-xs text-gray-600 bg-gray-200 rounded-full px-2 py-0.5">
          {logs.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs">
            No activity yet
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {logs.map((log, index) => {
                const Icon = getLogIcon(log.type)
                const colorClass = getLogColor(log.type)
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-start gap-2 p-2 rounded-md bg-gray-50 border border-gray-200"
                  >
                    <Icon className={`${colorClass} mt-0.5 flex-shrink-0 text-xs`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-800 text-xs break-words">{log.message}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {log.timestamp}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
