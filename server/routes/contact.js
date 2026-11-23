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
    message: 'Bohot zyada messages bheje gaye hain. Thori der baad try karein.',
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
        message: 'Name, sahi email, subject aur message likhna zaroori hai.',
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
      message: 'Aap ka message mil gaya hai. Hamari team jald rabta karegi.',
    })
  } catch (error) {
    console.error('Contact message failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Message save nahi ho saka. Thori der baad try karein.',
    })
  }
})

module.exports = router