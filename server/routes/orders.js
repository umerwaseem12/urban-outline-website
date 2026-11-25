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

    // Ek hi product do baar aaye to quantity jama kar lo.
    const wanted = new Map()
    for (const item of items) {
      const productId = String(item?.id ?? item?.productId ?? '').trim()
      const quantity = Number(item?.quantity ?? 1)

      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Order mein product details valid nahi hain.',
        })
      }

      const existing = wanted.get(productId)
      wanted.set(productId, {
        productId,
        quantity: (existing?.quantity ?? 0) + quantity,
        image: existing?.image ?? item.image,
      })
    }

    const orderItems = []

    for (const entry of wanted.values()) {
      if (entry.quantity > 20) {
        return res.status(400).json({
          success: false,
          message: 'Order mein product details valid nahi hain.',
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

        let message = 'Order mein product details valid nahi hain.'
        if (current && current.active === false) {
          message = `"${current.name}" ab available nahi hai. Cart se hata dein.`
        } else if (current && current.stock <= 0) {
          message = `"${current.name}" out of stock hai.`
        } else if (current) {
          message = `"${current.name}" ke sirf ${current.stock} bache hain. Quantity kam karein.`
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
      message: 'Order database mein save ho gaya.',
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
      message: 'Order save nahi ho saka.',
    })
  }
})

module.exports = router
