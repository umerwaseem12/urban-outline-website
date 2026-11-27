const express = require('express')
const Product = require('../models/Product')

const router = express.Router()

// The catalog changes only when an admin edits it, so both the function
// instance and Vercel's edge cache keep it briefly. This takes the Mongo
// round trip (and most of the cold-start wait) off normal storefront visits.
const CACHE_TTL_MS = 60 * 1000
const CACHE_CONTROL =
  'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
const PRODUCT_FIELDS = [
  'productId',
  'group',
  'name',
  'category',
  'price',
  'oldPrice',
  'badge',
  'image',
  'description',
  'stock',
  'sortOrder',
].join(' ')

let cached = { at: 0, body: null }

async function loadProducts() {
  const now = Date.now()

  if (cached.body && now - cached.at < CACHE_TTL_MS) {
    return cached.body
  }

  const products = await Product.find({ active: true })
    .select(PRODUCT_FIELDS)
    .sort({ sortOrder: 1 })
    .lean()

  const body = {
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
  }

  cached = { at: now, body }

  return body
}

router.get('/', async (req, res) => {
  try {
    const body = await loadProducts()

    res.set('Cache-Control', CACHE_CONTROL)
    return res.json(body)
  } catch (error) {
    console.error('Products load failed:', error.message)
    return res.status(500).json({ message: 'Products load nahi hue.' })
  }
})

module.exports = router
