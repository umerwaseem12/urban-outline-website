const express = require('express')
const crypto = require('crypto')
const Session = require('../models/Session')
const User = require('../models/User')
const Order = require('../models/Order')
const Message = require('../models/Message')

const router = express.Router()

async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.urban_session

    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(401).json({ message: 'Please sign in.' })
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const session = await Session.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    })

    if (!session) {
      return res.status(401).json({ message: 'Please sign in again.' })
    }

    const user = await User.findById(session.userId)

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' })
    }

    next()
  } catch (error) {
    console.error('Admin authorization failed:', error.message)
    return res.status(500).json({ message: 'Authorization unavailable.' })
  }
}

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, orders })
  } catch (error) {
    console.error('Admin orders failed:', error.message)
    return res.status(500).json({ message: 'Orders load nahi hue.' })
  }
})

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

  if (req.get('Origin') !== allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  const allowedStatuses = [
    'placed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]

  const { status } = req.body || {}

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID.' })
  }

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { orderStatus: status } },
      { returnDocument: 'after', runValidators: true },
    )

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, order })
  } catch (error) {
    console.error('Order status update failed:', error.message)
    return res.status(500).json({ message: 'Status update nahi hua.' })
  }
})

router.delete('/orders/:id', requireAdmin, async (req, res) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

  if (req.get('Origin') !== allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID.' })
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order pehle hi delete ho chuka hai.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, message: 'Order deleted.' })
  } catch (error) {
    console.error('Order deletion failed:', error.message)
    return res.status(500).json({ message: 'Order delete nahi hua.' })
  }
})

router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, messages })
  } catch (error) {
    console.error('Admin messages failed:', error.message)
    return res.status(500).json({ message: 'Messages load nahi hue.' })
  }
})

router.patch('/messages/:id/read', requireAdmin, async (req, res) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

  if (req.get('Origin') !== allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid message ID.' })
  }

  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { returnDocument: 'after' },
    )

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, message })
  } catch (error) {
    console.error('Message update failed:', error.message)
    return res.status(500).json({ message: 'Status update nahi hua.' })
  }
})

router.delete('/messages/:id', requireAdmin, async (req, res) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

  if (req.get('Origin') !== allowedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid message ID.' })
  }

  try {
    const message = await Message.findByIdAndDelete(req.params.id)

    if (!message) {
      return res.status(404).json({ message: 'Message pehle hi delete ho chuka hai.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, message: 'Message deleted.' })
  } catch (error) {
    console.error('Message deletion failed:', error.message)
    return res.status(500).json({ message: 'Message delete nahi hua.' })
  }
})

module.exports = router