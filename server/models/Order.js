const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    customer: { type: customerSchema, required: true },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must contain at least one product.',
      },
    },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    paymentMethod: {
      type: String,
      enum: ['cod', 'easypaisa', 'jazzcash', 'nayapay'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'not_connected', 'paid', 'failed'],
      default: 'pending',
    },

    orderStatus: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Order', orderSchema)