const express = require('express')
const Order = require('../models/Order')

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { customer, items } = req.body || {}
    const paymentMethod =
      req.body?.paymentMethod ?? customer?.paymentMethod

    const requiredFields = ['fullName', 'phone', 'province', 'city', 'address']

    if (
      !customer ||
      requiredFields.some(
        (field) =>
          typeof customer[field] !== 'string' ||
          !customer[field].trim(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Delivery details complete karein.',
      })
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Order mein valid products add karein.',
      })
    }

    const allowedPaymentMethods = ['cod']

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method valid nahi hai.',
      })
    }

    // Naam aur price browser se nahi, server ke catalog se liye jate hain.
    const { products } = await import('../../shared/catalog.mjs')
    const catalog = new Map(products.map((p) => [String(p.id), p]))

    const orderItems = []

    for (const item of items) {
      const productId = String(item?.id ?? item?.productId ?? '').trim()
      const quantity = Number(item?.quantity ?? 1)
      const product = catalog.get(productId)

      if (
        !product ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return res.status(400).json({
          success: false,
          message: 'Order mein product details valid nahi hain.',
        })
      }

      orderItems.push({
        productId,
        name: product.name,
        image: typeof item.image === 'string' ? item.image.slice(0, 500) : '',
        price: Number(product.price),
        quantity,
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
      message: 'Order database mein save ho gaya.',
      orderId: order._id,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
    })
  } catch (error) {
    console.error('Order create failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Order save nahi ho saka.',
    })
  }
})

module.exports = router