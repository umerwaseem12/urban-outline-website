const express = require('express')
const rateLimit = require('express-rate-limit')
const Message = require('../models/Message')

const router = express.Router()

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages. Please try again shortly.',
  },
})

const isText = (value, max) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {}

    if (
      !isText(name, 100) ||
      !isText(email, 200) ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      !isText(subject, 200) ||
      !isText(message, 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, a valid email, subject and message are required.',
      })
    }

    await Message.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    })

    return res.status(201).json({
      success: true,
      message: 'Thanks for reaching out. Our team will reply soon.',
    })
  } catch (error) {
    console.error('Contact message failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'We could not save your message. Please try again shortly.',
    })
  }
})

module.exports = router