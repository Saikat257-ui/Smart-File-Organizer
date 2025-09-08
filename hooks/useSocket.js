'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io } from 'socket.io-client'

export function useSocket() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [progress, setProgress] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user) {
      // For Vercel deployment, use the API route path
      const socketUrl = process.env.VERCEL === '1' 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
      
      const socketInstance = io(socketUrl, {
        path: process.env.VERCEL === '1' ? '/api/socket' : '/socket.io/',
        transports: ['websocket', 'polling']
      })

      socketInstance.on('connect', () => {
        setConnected(true)
        socketInstance.emit('join-session', session.user.email)
      })

      socketInstance.on('disconnect', () => {
        setConnected(false)
      })

      socketInstance.on('progress-start', (data) => {
        setProgress(data)
      })

      socketInstance.on('progress-update', (data) => {
        setProgress(data)
      })

      socketInstance.on('progress-complete', (data) => {
        setProgress(data)
        setTimeout(() => setProgress(null), 3000) // Clear after 3 seconds
      })

      socketInstance.on('progress-error', (data) => {
        setProgress(data)
      })

      socketInstance.on('status-log', (log) => {
        setLogs(prev => [...prev, {
          ...log,
          timestamp: new Date(log.timestamp).toLocaleTimeString()
        }])
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
      }
    }
  }, [session])

  const addLog = (message, type = 'info') => {
    const log = {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    setLogs(prev => [...prev, log])
  }

  const clearLogs = () => {
    setLogs([])
  }

  return {
    socket,
    connected,
    progress,
    logs,
    addLog,
    clearLogs
  }
}
