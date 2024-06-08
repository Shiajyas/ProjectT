const crypto = require('crypto');
const { Order } = require('../models/orderSchema');
const { User } = require('../models/userSchema'); // Assuming you have a User model

const handleWebhook = async (req, res) => {
    const secret = 'mazkingtap'; // Replace with your actual webhook secret

    consol.log("here....")
    // Validate webhook signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    try {
        if (event === 'payment.authorized') {
            const order = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (order) {
                order.status = "Confirmed";
                await order.save();
                if (order.product.length > 1) {
                    await User.updateOne({ _id: order.userId }, { $set: { cart: [] } });
                }
            }
        } else if (event === 'payment.failed') {
            const order = await Order.findOne({ razorpayOrderId: payment.order_id });
            if (order) {
                order.status = "Failed";
                await order.save();
            }
        }
        // Handle other events as necessary
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    handleWebhook,
};
