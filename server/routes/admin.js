const express = require('express')
const crypto = require('crypto')
const Session = require('../models/Session')
const User = require('../models/User')
const Order = require('../models/Order')
const Message = require('../models/Message')
const Product = require('../models/Product')

const router = express.Router()

const ORDER_STATUSES = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const { isAllowedOrigin } = require('../lib/origins')

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
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20),
    )
    const status = typeof req.query.status === 'string' ? req.query.status : ''
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    const filter = {}

    if (ORDER_STATUSES.includes(status)) {
      filter.orderStatus = status
    }

    if (search) {
      // Escape regex characters so a stray "(" cannot break the query.
      const safe = search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp(safe, 'i')

      filter.$or = [
        { 'customer.fullName': rx },
        { 'customer.phone': rx },
        { 'customer.email': rx },
        { 'customer.city': rx },
        { 'items.name': rx },
      ]

      if (/^[a-f\d]{24}$/i.test(search)) {
        filter.$or.push({ _id: search })
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ])

    res.set('Cache-Control', 'private, no-store')
    return res.json({
      success: true,
      orders,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error('Admin orders failed:', error.message)
    return res.status(500).json({ message: 'Orders could not be loaded.' })
  }
})

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  const { status } = req.body || {}

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID.' })
  }

  try {
    const previous = await Order.findById(req.params.id).lean()

    if (!previous) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { orderStatus: status } },
      { returnDocument: 'after', runValidators: true },
    )

    // Cancelling an order gives the reserved stock back to the catalog.
    if (status === 'cancelled' && previous.orderStatus !== 'cancelled') {
      for (const item of previous.items || []) {
        try {
          await Product.updateOne(
            { productId: item.productId },
            { $inc: { stock: item.quantity } },
          )
        } catch (err) {
          console.error(
            'Stock restore failed for',
            item.productId,
            err.message,
          )
        }
      }
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, order })
  } catch (error) {
    console.error('Order status update failed:', error.message)
    return res.status(500).json({ message: 'Order status could not be updated.' })
  }
})

router.delete('/orders/:id', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID.' })
  }

  try {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'This order was already deleted.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, message: 'Order deleted.' })
  } catch (error) {
    console.error('Order deletion failed:', error.message)
    return res.status(500).json({ message: 'Order could not be deleted.' })
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
    return res.status(500).json({ message: 'Messages could not be loaded.' })
  }
})

router.patch('/messages/:id/read', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
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
    return res.status(500).json({ message: 'Status could not be updated.' })
  }
})

router.delete('/messages/:id', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid message ID.' })
  }

  try {
    const message = await Message.findByIdAndDelete(req.params.id)

    if (!message) {
      return res.status(404).json({ message: 'This message was already deleted.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, message: 'Message deleted.' })
  } catch (error) {
    console.error('Message deletion failed:', error.message)
    return res.status(500).json({ message: 'Message could not be deleted.' })
  }
})

// ---------- Products (CMS) ----------

function parseProductInput(body, isCreate) {
  const input = body && typeof body === 'object' ? body : {}
  const data = {}
  const errors = []

  function text(field, { required = false, max = 120, nullable = false } = {}) {
    const raw = input[field]

    if (raw === undefined) {
      if (isCreate && required) errors.push(`${field} is required.`)
      return
    }

    if (raw === null && nullable) {
      data[field] = null
      return
    }

    if (typeof raw !== 'string') {
      errors.push(`${field} must be text.`)
      return
    }

    const value = raw.trim()

    if (!value && required) {
      errors.push(`${field} is required.`)
      return
    }

    if (value.length > max) {
      errors.push(`${field} is too long.`)
      return
    }

    data[field] = value === '' && nullable ? null : value
  }

  function wholeNumber(
    field,
    { required = false, nullable = false, max = 10000000 } = {},
  ) {
    const raw = input[field]

    if (raw === undefined) {
      if (isCreate && required) errors.push(`${field} is required.`)
      return
    }

    if ((raw === null || raw === '') && nullable) {
      data[field] = null
      return
    }

    const value = Number(raw)

    if (
      raw === '' ||
      raw === null ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > max
    ) {
      errors.push(`${field} must be a whole number of 0 or more.`)
      return
    }

    data[field] = value
  }

  if (isCreate) text('group', { required: true, max: 30 })
  text('name', { required: true, max: 120 })
  text('category', { required: true, max: 80 })
  text('description', { max: 2000 })
  text('badge', { max: 20, nullable: true })
  wholeNumber('price', { required: true })
  wholeNumber('oldPrice', { nullable: true })
  wholeNumber('stock', { max: 100000 })
  wholeNumber('lowStockAt', { max: 100000 })

  if (input.image !== undefined) {
    const image = typeof input.image === 'string' ? input.image.trim() : null

    if (image === null || image.length > 1000) {
      errors.push('image must be a valid link.')
    } else if (image && !/^https:\/\/\S+$/i.test(image)) {
      errors.push('image must be an https link.')
    } else {
      data.image = image
    }
  }

  if (input.active !== undefined) {
    if (typeof input.active !== 'boolean') {
      errors.push('active must be true or false.')
    } else {
      data.active = input.active
    }
  }

  return { data, errors }
}

router.get('/products', requireAdmin, async (req, res) => {
  try {
    const all = await Product.find().sort({ sortOrder: 1 }).lean()

    const isLow = (p) => p.stock > 0 && p.stock <= p.lowStockAt

    const summary = {
      total: all.length,
      active: all.filter((p) => p.active).length,
      hidden: all.filter((p) => !p.active).length,
      outOfStock: all.filter((p) => p.stock === 0).length,
      lowStock: all.filter(isLow).length,
    }

    const q = String(req.query.q || '').trim().toLowerCase()
    const group = String(req.query.group || '')
    const status = String(req.query.status || '')

    const products = all.filter((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.productId.toLowerCase().includes(q)
      ) {
        return false
      }
      if (group && p.group !== group) return false
      if (status === 'active' && !p.active) return false
      if (status === 'hidden' && p.active) return false
      if (status === 'out' && p.stock !== 0) return false
      if (status === 'low' && !isLow(p)) return false
      return true
    })

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, summary, products })
  } catch (error) {
    console.error('Admin products failed:', error.message)
    return res.status(500).json({ message: 'Products could not be loaded.' })
  }
})

router.post('/products', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  const { data, errors } = parseProductInput(req.body, true)

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0] })
  }

  try {
    const groups = await Product.distinct('group')

    if (!groups.includes(data.group)) {
      return res
        .status(400)
        .json({ message: `Unknown group. Use one of: ${groups.join(', ')}` })
    }

    const last = await Product.findOne()
      .sort({ sortOrder: -1 })
      .select('sortOrder')
      .lean()

    const product = await Product.create({
      ...data,
      productId: `${data.group}-${Date.now().toString(36)}`,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    })

    res.set('Cache-Control', 'private, no-store')
    return res.status(201).json({ success: true, product })
  } catch (error) {
    console.error('Product create failed:', error.message)
    return res.status(500).json({ message: 'Product could not be created.' })
  }
})

router.patch('/products/:id', requireAdmin, async (req, res) => {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' })
  }

  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }

  const { data, errors } = parseProductInput(req.body, false)

  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0] })
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'Nothing to update.' })
  }

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { returnDocument: 'after', runValidators: true },
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.set('Cache-Control', 'private, no-store')
    return res.json({ success: true, product })
  } catch (error) {
    console.error('Product update failed:', error.message)
    return res.status(500).json({ message: 'Product could not be updated.' })
  }
})

module.exports = router