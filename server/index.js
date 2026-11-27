require('dotenv').config({
  path: require('path').join(__dirname, '.env'),
})
require('dns').setDefaultResultOrder('ipv4first')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')

const app = express()
console.log('Google Client ID loaded:', Boolean(process.env.GOOGLE_CLIENT_ID))


const PORT = process.env.PORT || 5000

const { allowedOrigins } = require('./lib/origins')

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', require('./routes/auth'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/products', require('./routes/products'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/chat', require('./routes/chat'))

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Urban Outline API is running',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI server/.env mein nahi mila')
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB connected to: ${mongoose.connection.name}`)

    app.listen(PORT, () => {
      console.log(`Urban Outline API running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()