import { Server } from 'socket.io'

let io

export async function GET(request) {
  if (!io) {
    io = new Server({
      path: '/api/socket',
      addTrailingSlash: false,
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

  return new Response('Socket.IO server initialized', { status: 200 })
}

export { io }
