const mongoose = require('mongoose');

const ReturnRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    reason: String,
    quantity: Number,
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' }
}, { timestamps: true }); // Enabling timestamps

const ReturnRequest = mongoose.model('ReturnRequest', ReturnRequestSchema);

module.exports = ReturnRequest;
