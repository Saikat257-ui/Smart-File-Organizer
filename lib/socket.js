import { Server } from 'socket.io'
import { createServer } from 'http'

let io

export function initSocket(server) {
  if (!io) {
    // For Vercel deployment, we need to handle Socket.IO differently
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // On Vercel, use the API route for Socket.IO
      return null
    }

    io = new Server(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join-session', (sessionId) => {
        socket.join(sessionId)
        console.log(`Socket ${socket.id} joined session ${sessionId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  return io
}

export function getSocketInstance() {
  return io
}

export class ProgressTracker {
  constructor(sessionId, socketInstance = null) {
    this.sessionId = sessionId
    this.io = socketInstance || getSocketInstance()
    this.progress = {
      total: 0,
      completed: 0,
      current: null,
      status: 'idle'
    }
  }

  start(total, message = 'Starting process...') {
    this.progress = {
      total,
      completed: 0,
      current: message,
      status: 'running'
    }
    this.emit('progress-start', this.progress)
  }

  update(completed, message = null) {
    this.progress.completed = completed
    if (message) {
      this.progress.current = message
    }
    this.emit('progress-update', this.progress)
  }

  complete(message = 'Process completed') {
    this.progress.status = 'completed'
    this.progress.current = message
    this.progress.completed = this.progress.total
    this.emit('progress-complete', this.progress)
  }

  error(message = 'An error occurred') {
    this.progress.status = 'error'
    this.progress.current = message
    this.emit('progress-error', this.progress)
  }

  log(message, type = 'info') {
    this.emit('status-log', {
      message,
      type,
      timestamp: new Date().toISOString()
    })
  }

  emit(event, data) {
    if (this.io && this.sessionId) {
      this.io.to(this.sessionId).emit(event, data)
    }
  }
}
