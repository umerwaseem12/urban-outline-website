const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { rateLimit } = require('express-rate-limit')
const { OAuth2Client } = require('google-auth-library')
const multer = require('multer')
const sharp = require('sharp')
const nodemailer = require('nodemailer')
const User = require('../models/User')
const Session = require('../models/Session')

const router = express.Router()

const SESSION_DAYS = 30
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000
const COOKIE_NAME = 'urban_session'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
})

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    profilePicture: user.profilePicture || '',
    hasCustomPhoto: Boolean(user.hasCustomPhoto),
  }
}

async function sendVerificationEmail(user) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Email service is not configured.')
  }

  const token = crypto.randomBytes(32).toString('hex')

  user.verifyTokenHash = hashToken(token)
  user.verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save()

  const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const verifyUrl = `${frontendUrl}/?verifyToken=${token}`

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: 'Verify your Urban Outline email',
    text:
      `Welcome to Urban Outline! Use this link to verify your email:\n\n${verifyUrl}\n\n` +
      'This link expires in 24 hours. If you did not sign up, ignore this email.',
  })
}

function validOrigin(req, res, next) {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const origin = req.get('Origin')

  if (origin !== allowedOrigin) {
    return res.status(403).json({
      success: false,
      message: 'Request origin is not allowed.',
    })
  }

  next()
}

async function createSession(user, res) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_MS)

  await Session.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt,
  })

  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    expires: expiresAt,
  })
}

async function findSession(req) {
  const token = req.cookies?.[COOKIE_NAME]

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return null
  }

  return Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  })
}

router.post('/signup', validOrigin, authLimiter, async (req, res) => {
  try {
    const { fullName, phone = '', email, password } = req.body || {}
    if (
  typeof email !== 'string' ||
  email.length > 254 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
) {
  return res.status(400).json({
    success: false,
    message: 'Please enter a valid email address.',
  })
}

    if (
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100 ||
      typeof phone !== 'string' ||
      phone.length > 30 ||
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter valid details. Password must be at least 8 characters.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail })

    // Verified ya Google wale account par dobara signup nahi ho sakta.
    if (existing && existing.emailVerified !== false) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please sign in.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    let user

    if (existing) {
      // Pehle signup hua tha magar email verify nahi hui: details update karke link dobara bhejo.
      existing.fullName = fullName.trim()
      existing.phone = phone.trim()
      existing.passwordHash = passwordHash
      await existing.save()
      user = existing
    } else {
      user = await User.create({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        passwordHash,
        emailVerified: false,
      })
    }

    let emailSent = true

    try {
      await sendVerificationEmail(user)
    } catch (mailError) {
      emailSent = false
      console.error('Verification email failed:', mailError.message)
    }

    return res.status(201).json({
      success: true,
      verificationRequired: true,
      emailSent,
      message: emailSent
        ? 'Account created. Please check your email and verify it before signing in.'
        : 'Account created, but the verification email could not be sent. Please use resend.',
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please sign in.',
      })
    }

    console.error('Signup failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Signup unavailable. Please try again.',
    })
  }
})

router.post('/login', validOrigin, authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      typeof password !== 'string' ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email and password.',
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash')

    const valid =
      user?.passwordHash && (await bcrypt.compare(password, user.passwordHash))

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password.',
      })
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email first. Check your inbox.',
      })
    }

    await createSession(user, res)

    return res.json({
      success: true,
      user: publicUser(user),
    })
  } catch (error) {
    console.error('Login failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Login unavailable. Please try again.',
    })
  }
})

router.post('/google', validOrigin, authLimiter, async (req, res) => {
  const { credential } = req.body || {}

  if (typeof credential !== 'string' || credential.length > 10000) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Google credential.',
    })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'Google sign-in is not configured.',
    })
  }

  let payload

  try {
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })
    payload = ticket.getPayload()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Google sign-in could not be verified.',
    })
  }

  if (
    !payload?.sub ||
    !payload.email_verified ||
    typeof payload.email !== 'string'
  ) {
    return res.status(401).json({
      success: false,
      message: 'A verified Google email is required.',
    })
  }

  try {
    let user = await User.findOne({ googleId: payload.sub })

    if (!user) {
      const email = payload.email.trim().toLowerCase()
      const existing = await User.findOne({ email })

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This email already has an account. Please sign in with your existing method.',
        })
      }

      user = await User.create({
        fullName: (payload.name || email.split('@')[0]).slice(0, 100),
        email,
        googleId: payload.sub,
        profilePicture: payload.picture || '',
        emailVerified: true,
      })
    }

    if (typeof payload.picture === 'string' && payload.picture !== user.profilePicture) {
      user.profilePicture = payload.picture
      await user.save()
    }

    await createSession(user, res)

    return res.json({
      success: true,
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Account already exists. Please try signing in again.',
      })
    }

    console.error('Google sign-in failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Google sign-in unavailable. Please try again.',
    })
  }
})

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
})

router.post('/photo', validOrigin, authLimiter, async (req, res) => {
  try {
    // Pehle login check, phir file parse. Bina login wale ki file memory mein nahi aati.
    const session = await findSession(req)

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in first.',
      })
    }

    photoUpload.single('photo')(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({
          success: false,
          message:
            uploadError.code === 'LIMIT_FILE_SIZE'
              ? 'Photo 5 MB se chhoti honi chahiye.'
              : 'Photo upload nahi hui. Dobara try karein.',
        })
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Please select a photo.',
          })
        }

        const image = sharp(req.file.buffer, {
          limitInputPixels: 20000000,
          failOn: 'error',
        })

        const metadata = await image.metadata()

        if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
          return res.status(400).json({
            success: false,
            message: 'Please select a JPG, PNG or WebP image.',
          })
        }

        const photo = await image
          .rotate()
          .resize(400, 400, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer()

        const user = await User.findByIdAndUpdate(
          session.userId,
          { customPhoto: photo, hasCustomPhoto: true },
          { new: true },
        )

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Please sign in again.',
          })
        }

        return res.json({ success: true, user: publicUser(user) })
      } catch (error) {
        console.error('Photo upload failed:', error.message)
        return res.status(400).json({
          success: false,
          message: 'Photo upload nahi hui. Valid image try karein.',
        })
      }
    })
  } catch (error) {
    console.error('Photo auth check failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Photo upload abhi available nahi hai.',
    })
  }
})

router.get('/photo', async (req, res) => {
  try {
    const session = await findSession(req)
    if (!session) return res.sendStatus(401)

    const user = await User.findById(session.userId).select('+customPhoto')
    if (!user?.customPhoto) return res.sendStatus(404)

    res.set('Cache-Control', 'private, no-store')
    res.type('image/webp')
    return res.send(user.customPhoto)
  } catch (error) {
    console.error('Photo load failed:', error.message)
    return res.sendStatus(500)
  }
})

router.patch('/profile', validOrigin, authLimiter, async (req, res) => {
  try {
    const session = await findSession(req)

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in first.',
      })
    }

    const { fullName, phone } = req.body || {}

    if (
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      fullName.trim().length > 100 ||
      typeof phone !== 'string' ||
      phone.trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid name and phone number.',
      })
    }

    const user = await User.findByIdAndUpdate(
      session.userId,
      {
        $set: {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
      },
      { new: true, runValidators: true },
    )

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in again.',
      })
    }

    return res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    console.error('Profile update failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Profile update nahi hui. Please try again.',
    })
  }
})

router.get('/me', async (req, res) => {
  try {
    const session = await findSession(req)

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Not signed in.',
      })
    }

    const user = await User.findById(session.userId)

    if (!user) {
      await Session.deleteOne({ _id: session._id })
      res.clearCookie(COOKIE_NAME, cookieOptions)
      return res.status(401).json({ success: false, message: 'Not signed in.' })
    }

    // Active sessions are extended when less than 15 days remain.
    if (session.expiresAt.getTime() - Date.now() < SESSION_MS / 2) {
      session.expiresAt = new Date(Date.now() + SESSION_MS)
      await session.save()

      res.cookie(COOKIE_NAME, req.cookies[COOKIE_NAME], {
        ...cookieOptions,
        expires: session.expiresAt,
      })
    }

    return res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    console.error('Session check failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Session check unavailable.',
    })
  }
})

router.post('/logout', validOrigin, async (req, res) => {
  try {
    const session = await findSession(req)
    if (session) await Session.deleteOne({ _id: session._id })

    res.clearCookie(COOKIE_NAME, cookieOptions)
    return res.json({ success: true, message: 'Signed out.' })
  } catch (error) {
    console.error('Logout failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Logout unavailable. Please try again.',
    })
  }
})

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

const resetCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many link checks. Please try again later.' },
})

const resetSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
})

router.post('/forgot-password', validOrigin, resetRequestLimiter, async (req, res) => {
  const { email } = req.body || {}

  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    })
  }

  const genericMessage =
    'If an eligible account exists, a reset link will be sent to your email.'

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash')

    // Google-only accounts do not have a local password to reset.
    if (user?.passwordHash) {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('Email service is not configured.')
      }

      const token = crypto.randomBytes(32).toString('hex')

      user.resetTokenHash = hashToken(token)
      user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
      await user.save()

      const frontendUrl =
        process.env.CLIENT_ORIGIN || 'http://localhost:5173'

      const resetUrl = `${frontendUrl}/?resetToken=${token}`

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Urban Outline password reset',
        text:
          `Use this link to reset your password:\n\n${resetUrl}\n\n` +
          'This link expires in 15 minutes. If you did not request it, ignore this email.',
      })
    }

    res.set('Cache-Control', 'no-store')
    return res.json({ success: true, message: genericMessage })
  } catch (error) {
    // Don't expose account existence or email-provider details.
    console.error('Password reset request failed:', error.message)
    return res.json({ success: true, message: genericMessage })
  }
})

router.post('/reset-password', validOrigin, resetSubmitLimiter, async (req, res) => {
  const { token, password } = req.body || {}

  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/.test(token) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid link or password. Password must be at least 8 characters.',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    // Atomically consume the token, so it cannot be used twice.
    const user = await User.findOneAndUpdate(
      {
        resetTokenHash: hashToken(token),
        resetTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: { passwordHash },
        $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
      },
      { returnDocument: 'after' },
    )

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link invalid or expired. Please request a new one.',
      })
    }

    await Session.deleteMany({ userId: user._id })
    res.clearCookie(COOKIE_NAME, cookieOptions)
    res.set('Cache-Control', 'no-store')

    return res.json({
      success: true,
      message: 'Password reset successfully. Please sign in.',
    })
  } catch (error) {
    console.error('Password reset failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Password reset unavailable. Please try again.',
    })
  }
})

router.post('/check-reset-link', validOrigin, resetCheckLimiter, async (req, res) => {
  const { token } = req.body || {}

  res.set('Cache-Control', 'no-store')

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ message: 'Reset link invalid or expired.' })
  }

  try {
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select('_id')

    if (!user) {
      return res.status(400).json({ message: 'Reset link invalid or expired.' })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Reset link check failed:', error.message)
    return res.status(500).json({ message: 'Link check nahi ho saka. Dobara try karein.' })
  }
})

router.post('/verify-email', validOrigin, resetCheckLimiter, async (req, res) => {
  const { token } = req.body || {}

  res.set('Cache-Control', 'no-store')

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message: 'Verification link invalid or expired.',
    })
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        verifyTokenHash: hashToken(token),
        verifyTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: { emailVerified: true },
        $unset: { verifyTokenHash: 1, verifyTokenExpiresAt: 1 },
      },
      { returnDocument: 'after' },
    )

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification link invalid or expired. Please request a new one.',
      })
    }

    return res.json({
      success: true,
      message: 'Email verified. Please sign in.',
    })
  } catch (error) {
    console.error('Email verification failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Verification unavailable. Please try again.',
    })
  }
})

router.post('/resend-verification', validOrigin, resetRequestLimiter, async (req, res) => {
  const { email } = req.body || {}

  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    })
  }

  const genericMessage =
    'If this account needs verification, a new link has been sent to your email.'

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() })

    if (user && user.emailVerified === false) {
      await sendVerificationEmail(user)
    }
  } catch (error) {
    console.error('Resend verification failed:', error.message)
  }

  res.set('Cache-Control', 'no-store')
  return res.json({ success: true, message: genericMessage })
})

module.exports = router
