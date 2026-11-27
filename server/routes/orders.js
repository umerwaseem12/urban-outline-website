const express = require('express')
const Order = require('../models/Order')
const Product = require('../models/Product')

const router = express.Router()

router.post('/', async (req, res) => {
  // Jo stock kam kar diya, wo yahan likha jata hai taake fail hone par wapas ho sake.
  const reserved = []

  const releaseStock = async () => {
    for (const r of reserved) {
      try {
        await Product.updateOne(
          { productId: r.productId },
          { $inc: { stock: r.quantity } },
        )
      } catch (err) {
        console.error('Stock wapas nahi hua:', r.productId, err.message)
      }
    }
    reserved.length = 0
  }

  try {
    const { customer, items } = req.body || {}
    const paymentMethod = req.body?.paymentMethod ?? customer?.paymentMethod

    const requiredFields = ['fullName', 'phone', 'province', 'city', 'address']

    if (
      !customer ||
      requiredFields.some(
        (field) =>
          typeof customer[field] !== 'string' || !customer[field].trim(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your delivery details.',
      })
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one product to your order.',
      })
    }

    const allowedPaymentMethods = ['cod']
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'That payment method is not available.',
      })
    }

    // Same product with the same size/colour is merged into one line.
    const wanted = new Map()
    for (const item of items) {
      const productId = String(item?.id ?? item?.productId ?? '').trim()
      const quantity = Number(item?.quantity ?? 1)
      const size = typeof item?.size === 'string' ? item.size.trim() : ''
      const color = typeof item?.color === 'string' ? item.color.trim() : ''

      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Some product details in this order are invalid.',
        })
      }

      const lineKey = `${productId}|${size}|${color}`
      const existing = wanted.get(lineKey)
      wanted.set(lineKey, {
        productId,
        size,
        color,
        quantity: (existing?.quantity ?? 0) + quantity,
        image: existing?.image ?? item.image,
      })
    }

    const orderItems = []

    for (const entry of wanted.values()) {
      if (entry.quantity > 20) {
        return res.status(400).json({
          success: false,
          message: 'You can order at most 20 pieces of one item.',
        })
      }

      // Naam aur price database se. Sirf active product, aur stock kafi ho to hi
      // stock kam hota hai. Ye ek hi atomic step hai.
      const product = await Product.findOneAndUpdate(
        {
          productId: entry.productId,
          active: true,
          stock: { $gte: entry.quantity },
        },
        { $inc: { stock: -entry.quantity } },
        { new: true },
      ).lean()

      if (!product) {
        await releaseStock()

        const current = await Product.findOne({
          productId: entry.productId,
        }).lean()

        let message = 'Some product details in this order are invalid.'
        if (current && current.active === false) {
          message = `"${current.name}" is no longer available. Please remove it from your bag.`
        } else if (current && current.stock <= 0) {
          message = `"${current.name}" is out of stock.`
        } else if (current) {
          message = `Only ${current.stock} of "${current.name}" left. Please lower the quantity.`
        }

        return res.status(409).json({ success: false, message })
      }

      reserved.push({ productId: entry.productId, quantity: entry.quantity })

      orderItems.push({
        productId: entry.productId,
        name: product.name,
        image:
          typeof entry.image === 'string'
            ? entry.image.slice(0, 500)
            : product.image || '',
        size: entry.size,
        color: entry.color,
        price: Number(product.price),
        quantity: entry.quantity,
      })
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    const shippingFee = 250

    const order = await Order.create({
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        email: customer.email || '',
        province: customer.province.trim(),
        city: customer.city.trim(),
        address: customer.address.trim(),
        postalCode: customer.postalCode || '',
      },
      items: orderItems,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      paymentMethod,
      paymentStatus: 'pending',
    })

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      orderId: order._id,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
    })
  } catch (error) {
    // Order save na ho saka to kata hua stock wapas daal do.
    await releaseStock()
    console.error('Order create failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'We could not save this order. Please try again.',
    })
  }
})

module.exports = router
