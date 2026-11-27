const path = require('path')
const { pathToFileURL } = require('url')

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch {
  // dotenv optional hai; neeche wali MONGODB_URI check bata degi
}

const mongoose = require('mongoose')
const Product = require('./models/Product')

// Shuru mein har product ka stock. Baad mein admin se badal lena.
const STARTING_STOCK = 50

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      'MONGODB_URI nahi mili. Aise chalao: node --env-file=.env seed-products.js',
    )
    process.exit(1)
  }

  const { products } = await import(
    pathToFileURL(path.join(__dirname, '..', 'shared', 'catalog.mjs')).href
  )

  await mongoose.connect(process.env.MONGODB_URI)

  let created = 0
  let skipped = 0

  for (const [index, product] of products.entries()) {
    const result = await Product.updateOne(
      { productId: String(product.id) },
      {
        $setOnInsert: {
          group: product.group,
          name: product.name,
          category: product.category,
          price: product.price,
          oldPrice: product.oldPrice,
          badge: product.badge,
          image: product.image,
          stock: STARTING_STOCK,
          sortOrder: index,
        },
      },
      { upsert: true },
    )

    if (result.upsertedCount) created += 1
    else skipped += 1
  }

  console.log(
    `Done. Naye: ${created}, pehle se maujood: ${skipped}, catalog mein total: ${products.length}`,
  )

  await mongoose.disconnect()
}

main().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})