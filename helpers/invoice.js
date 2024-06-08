const Order = require('../models/orderSchema');
const Coupon = require("../models/couponSchema");
const Product = require("../models/productSchema");
const easyinvoice = require('easyinvoice');
const { Readable } = require("stream");
const User = require('../models/userSchema');

module.exports = {
    invoice: async (req, res) => {
        try {
            const id = req.query.id;
            const findOrder = await Order.findOne({ _id: id });
            if (!findOrder) {
                return res.status(404).json({ error: "Order not found" });
            }

            const userData = await User.findOne({ _id: findOrder.userId });
            if (!userData) {
                return res.status(404).json({ error: "User not found" });
            }

            const products = findOrder.product;
            const ToTal = findOrder.totalPrice
            const productDetailsList = [];

            if (Array.isArray(products)) {
                const userId = findOrder.userId;
                const coupons = await Coupon.find({ userId: userId });

                for (const product of products) {
                    if (product._id) {
                        try {
                            const productDetails = await Product.findById(product._id).lean();
                            if (productDetails) {
                                let originalPrice = productDetails.salePrice;

                                if (originalPrice === undefined) {
                                    console.error(`Product with ID ${product._id} does not have a salePrice field`);
                                    continue;
                                }

                                let salePrice = productDetails.salePrice;
                                let offerPrice = 0; // Initialize offerPrice to 0

                                const applicableCoupon = coupons.find(coupon => coupon.userId.includes(userId));
                                if (applicableCoupon) {
                                    offerPrice += applicableCoupon.offerPrice;
                                }

                                productDetailsList.push({
                                    ...productDetails,
                                    quantity: product.quantity,
                                    totalPrice: salePrice * product.quantity,
                                    offerPrice: parseFloat(offerPrice)
                                });

                                // console.log("Product ID:", product._id);
                                // console.log("Original sale price:", productDetails.salePrice);
                                // console.log("Coupon offer price:", applicableCoupon ? applicableCoupon.offerPrice : 0);
                                // console.log("Total offer price:", offerPrice);
                                // console.log("Final sale price:", salePrice);
                            } else {
                                console.error(`No product found with _id: ${product._id}`);
                            }
                        } catch (error) {
                            console.error(`Failed to find product with _id: ${product._id}`, error);
                        }
                    } else {
                        console.error(`Product does not have an _id field`);
                    }
                }
            } else {
                console.error("products is not an array");
            }

            let grandTotal = 0;
            let totalOfferPrice = 0;
            let productT = 0;

            productDetailsList.forEach(product => {
                const totalPrice = parseFloat(product.totalPrice);
                const salePrice = parseFloat(product.salePrice);
                const offerPrice = parseFloat(product.offerPrice || 0); // Ensure offerPrice is properly initialized
                const quantity = parseInt(product.quantity);
                const productTotal = salePrice * quantity;

                productT += productTotal;
                grandTotal += totalPrice; 
                totalOfferPrice += offerPrice * quantity;

                console.log("Product total:", productTotal);
                console.log("Grand total so far:", grandTotal);
                console.log("Total offer price so far:", totalOfferPrice);
            });

            const maxTotal = grandTotal + totalOfferPrice;

            console.log("Subtotal:", grandTotal);
            console.log("Total Offer Price:", totalOfferPrice);
            console.log("Total after discount:", maxTotal);

            const address = findOrder.address[0];
            const isoDateString = findOrder.createdOn;
            const isoDate = new Date(isoDateString);
            const options = { year: "numeric", month: "long", day: "numeric" };
            const formattedDate = isoDate.toLocaleDateString("en-US", options);

            const productsForInvoice = productDetailsList.map((product) => ({
                description: product.productName,
                quantity: parseInt(product.quantity),
                price: product.salePrice,
                "tax-rate": 0,
            }));

            productsForInvoice.push(
                { description: "All applied Discount",  price: -( grandTotal - ToTal), "tax-rate": 0 }
            );

            const data = {
                customize: {},
                images: {
                   
                    background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
                },
                sender: {
                    company: "Think Thankz",
                    address: "WhiteField, Silk Board Road",
                    city: "Bangalore",
                    country: "India",
                },
                client: {
                    company: "Customer Address",
                    address: address.state,
                    city: address.landMark,
                    zip: address.pincode,
                },
                information: {
                    number: findOrder._id,
                    date: formattedDate,
                },
                products: productsForInvoice,
                bottomNotice: "Happy shopping and visit Think Thankz again",
                settings: {
                    currency: "INR",
                },
                translate: {
                    invoice: "INVOICE",
                }
            };

            const pdfResult = await easyinvoice.createInvoice(data);

            const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");
            res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
            res.setHeader("Content-Type", "application/pdf");
            const pdfStream = new Readable();
            pdfStream.push(pdfBuffer);
            pdfStream.push(null);

            pdfStream.pipe(res);
            return true;
        } catch (error) {
            res.status(500).json({ error: error.message });
            return;
        }
    },
};
