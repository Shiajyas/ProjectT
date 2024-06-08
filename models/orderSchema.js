const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    product: {
        type: Array,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    address: {
        type: Array,
        required: true
    },
    payment: {
        type: String,
        default: 'pending',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending',
        required: true
    },
    createdOn: {
         type: Date,
    default: Date.now,
    required: true
    },
    date: {
        type: String
    },
    cancel: {
        type: Array
    },
    return: {
        type: Array
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    razorpayOrderId: { type: String },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
