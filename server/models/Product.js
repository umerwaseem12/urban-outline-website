const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, trim: true },
    group: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: null, min: 0 },
    badge: { type: String, default: null, trim: true },
    image: { type: String, default: '' },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number.',
      },
    },
    lowStockAt: { type: Number, default: 5, min: 0 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// Matches the storefront query (active products in display order).
productSchema.index({ active: 1, sortOrder: 1 })

module.exports = mongoose.model('Product', productSchema)