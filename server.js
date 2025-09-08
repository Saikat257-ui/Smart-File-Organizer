const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = process.env.PORT || 3000
const socketPort = process.env.SOCKET_PORT || 3001

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create separate Socket.IO server
  const socketServer = createServer()
  const io = new Server(socketServer, {
    cors: {
      origin: `http://localhost:${port}`,
      methods: ["GET", "POST"]
    }
  })

  // Socket.IO connection handling
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

  // Start servers
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Next.js ready on http://${hostname}:${port}`)
  })

  socketServer.listen(socketPort, (err) => {
    if (err) throw err
    console.log(`> Socket.IO ready on http://${hostname}:${socketPort}`)
  })
})
