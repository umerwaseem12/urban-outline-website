const express = require('express')
const Product = require('../models/Product')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .sort({ sortOrder: 1 })
      .lean()

    res.set('Cache-Control', 'no-store')
    return res.json({
      success: true,
      products: products.map((product) => ({
        id: product.productId,
        group: product.group,
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        badge: product.badge,
        image: product.image,
        description: product.description,
        inStock: product.stock > 0,
      })),
    })
  } catch (error) {
    console.error('Products load failed:', error.message)
    return res.status(500).json({ message: 'Products load nahi hue.' })
  }
})

module.exports = router