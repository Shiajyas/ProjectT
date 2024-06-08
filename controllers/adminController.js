const User = require("../models/userSchema");
const Coupon = require("../models/couponSchema")
const Category = require("../models/categorySchema")
const Product = require("../models/productSchema")
const Order = require("../models/orderSchema")
const moment = require('moment');
const ExcelJS = require("exceljs")
const PDFDocument = require('pdfkit')
const bcrypt = require("bcryptjs");
const Return = require("../models/returnSchema")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Brand = require("../models/brandSchema")

// const getDashboard = async (req, res) => {
//     try {
//         res.render("index")
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const getLoginPage = async (req, res) => {
    try {
        res.render("admin-login")
    } catch (error) {
        console.log(error.message);
    }
}


const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        console.log(email)

        const findAdmin = await User.findOne({ email, isAdmin: "1" })
        // console.log("admin data : ", findAdmin);

        if (findAdmin) {
            const passwordMatch = await bcrypt.compare(password, findAdmin.password)
            if (passwordMatch) {
                req.session.admin = true
                console.log("Admin Logged In");
                res.redirect("/admin")
            } else {
                console.log("Password is not correct");
                res.redirect("/admin/login")
            }
        } else {
            console.log("He's not an admin");
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getCouponPageAdmin = async (req, res) => {
    try {
        const findCoupons = await Coupon.find({})
        res.render("coupon", { coupons: findCoupons })
    } catch (error) {
        console.log(error.message);
    }
}

const createCoupon = async (req, res) => {
    try {
        const { couponName, startDate, endDate, offerPrice, minimumPrice } = req.body;

        console.log(req.body)

        // Ensure all required fields are present
        if (!couponName || !startDate || !endDate || !offerPrice || !minimumPrice) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const formattedCouponName = couponName.trim().charAt(0).toUpperCase() + couponName.trim().slice(1);

        const findCoupon = await Coupon.findOne({ name: formattedCouponName });
        if (!findCoupon) {
            const data = {
                couponName: formattedCouponName,
                startDate: new Date(startDate + 'T00:00:00'),
                endDate: new Date(endDate + 'T00:00:00'),
                offerPrice: parseInt(offerPrice),
                minimumPrice: parseInt(minimumPrice)
            };

            const newCoupon = new Coupon({
                name: data.couponName,
                createdOn: data.startDate,
                expireOn: data.endDate,
                offerPrice: data.offerPrice,
                minimumPrice: data.minimumPrice
            });

            await newCoupon.save();
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Coupon already exists" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
}

const deletCoupon = async(req,res)=>{
    const { id } = req.body;

    try {
      const result = await Coupon.findByIdAndDelete(id);
      if (result) {
        res.json({ success: true, message: 'Coupon deleted successfully' });
      } else {
        res.json({ success: false, message: 'Coupon not found' });
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
}





const getLogout = async (req, res) => {
    try {
        req.session.admin = null
        res.redirect("/admin/login")
    } catch (error) {
        console.log(error.message);
    }
}


const getSalesReportPage = async (req, res) => {
    try {
        // const orders = await Order.find({ status: "Delivered" }).sort({ createdOn: -1 })
        // console.log(orders);

        // res.render("salesReport", { data: currentOrder, totalPages, currentPage })

        // console.log(req.query.day);
        let filterBy = req.query.day
        if (filterBy) {
            res.redirect(`/admin/${req.query.day}`)
        } else {
            res.redirect(`/admin/salesMonthly`)
        }
    } catch (error) {
        console.log(error.message);
    }
}

const salesToday = async (req, res) => {
    try {
        let today = new Date()
        const startOfTheDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0,
            0,
            0,
            0
        )

        const endOfTheDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
            999
        )

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startOfTheDay,
                        $lt: endOfTheDay
                    },
                    status: "Delivered"
                }
            }
        ]).sort({ createdOn: -1 })


        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        console.log(currentOrder, "currOrder");

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesToday: true })

    } catch (error) {
        console.log(error.message);
    }
}


const salesWeekly = async (req, res) => {
    try {
        let currentDate = new Date()
        const startOfTheWeek = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - currentDate.getDay()
        )

        const endOfTheWeek = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + (6 - currentDate.getDay()),
            23,
            59,
            59,
            999
        )

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startOfTheWeek,
                        $lt: endOfTheWeek
                    },
                    status: "Delivered"
                }
            }
        ]).sort({ createdOn: -1 })

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesWeekly: true })

    } catch (error) {
        console.log(error.message);
    }
}


const salesMonthly = async (req, res) => {
    try {
        let currentMonth = new Date().getMonth() + 1
        const startOfTheMonth = new Date(
            new Date().getFullYear(),
            currentMonth - 1, 
            1, 0, 0, 0, 0
        )
        const endOfTheMonth = new Date(
            new Date().getFullYear(),
            currentMonth,
            0, 23, 59, 59, 999
        )
        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startOfTheMonth,
                        $lt: endOfTheMonth
                    },
                    status: "Delivered"
                }
            }
        ]).sort({ createdOn: -1 })  
        // .then(data=>console.log(data))
        console.log("ethi");
        console.log(orders);

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true })


    } catch (error) {
        console.log(error.message);
    }
}


const salesYearly = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear()
        const startofYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
        const endofYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startofYear,
                        $lt: endofYear
                    },
                    status: "Delivered"
                }
            }
        ])


        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesYearly: true })

    } catch (error) {
        console.log(error.message);
    }
}

const generatePdf = async (req, res) => {
    try {
        const doc = new PDFDocument({ margin: 20 });
        const filename = 'sales-report.pdf';
        const orders = req.body;

        const logoPath = "./public/user-assets/imgs/theme/ThinkThankz-logo/cover.png"; // Replace with the actual path to your company logo

        // Add company logo at the top left side of the heading
        doc.image(logoPath, {
            fit: [150, 150], // Adjust size
            align: 'left',
            valign: 'top'
        }).moveDown(2);

        // Initialize totals
        let totalOrders = 0;
        let totalAmount = 0;
        let totalProductDiscount = 0;
        let totalCouponDiscount = 0;
        let totalFinalPrice = 0;

        // Calculate totals and log every field
        orders.forEach((order, index) => {
            // Calculate totals
            totalOrders += 1;
            totalAmount += order.totalAmount || 0;
            totalProductDiscount += order.productCutoff || 0;
            totalCouponDiscount += order.couponCutoff || 0;
            totalFinalPrice += order.finalPrice || 0;
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // Set up document
        doc.fontSize(20).text('Sales Report', { align: 'center' }).moveDown(1.5);

        // Add headers
        const headers = [
            'Order ID', 'Name', 'Date', 'Payment', 'Status',
            'Total', 'Product Discount', 'Coupon Discount', 'Final Price'
        ];
        const headerWidths = [90, 60, 60, 60, 50, 50, 50, 50, 50]; // Adjusted widths
        let headerX = 20;
        let headerY = doc.y; // Adjusted header Y position
        const headerPadding = 30; // Padding between header and data

        headers.forEach((header, index) => {
            doc.fontSize(10).text(header, headerX, headerY, { width: headerWidths[index], align: 'center' });
            headerX += headerWidths[index];
        });

        doc.moveTo(20, headerY + headerPadding)
            .lineTo(doc.page.width - 20, headerY + headerPadding)
            .stroke();

        let dataY = headerY + headerPadding + 10; // Adjusted data Y position with additional padding

        // Add order data
        orders.forEach(order => {
            const cleanedDataId = order.dataId || '';
            const cleanedName = order.name || '';
            const cleanedDate = order.date || '';
            const cleanedPayment = order.payment || '';
            const cleanedStatus = order.status || '';
            const cleanedTotal = order.totalAmount ? order.totalAmount.toFixed(2) : '0.00';
            const cleanedProductDiscount = order.productCutoff ? order.productCutoff.toFixed(2) : '0.00';
            const cleanedCouponDiscount = order.couponCutoff ? order.couponCutoff.toFixed(2) : '0.00';
            const cleanedFinalPrice = order.finalPrice ? order.finalPrice.toFixed(2) : '0.00';

            const data = [
                cleanedDataId, cleanedName, cleanedDate, cleanedPayment, cleanedStatus,
                `₹${cleanedTotal}`, `₹${cleanedProductDiscount}`, `₹${cleanedCouponDiscount}`, `₹${cleanedFinalPrice}`
            ];

            let dataX = 20;
            data.forEach((item, index) => {
                doc.fontSize(10).text(item, dataX, dataY, { width: headerWidths[index], align: 'center' });
                dataX += headerWidths[index];
            });

            dataY += 20;

            if (dataY > doc.page.height - 50) {
                doc.addPage();
                dataY = 50;
            }
        });

        // Add totals summary
        doc.addPage();
        doc.fontSize(14).text('Summary', { align: 'center' }).moveDown(1.5);

        const summaryY = doc.y;
        doc.fontSize(12)
            .text(`Overall Sales Count: ${totalOrders}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Overall Order Amount: ₹${totalAmount.toFixed(2)}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Overall Product Discount: ₹${totalProductDiscount.toFixed(2)}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Overall Coupon Discount: ₹${totalCouponDiscount.toFixed(2)}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Overall credited Amount: ₹${totalFinalPrice.toFixed(2)}`, { align: 'left' });

        doc.end();
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error generating PDF report');
    }
};


const downloadExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Set column headers
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 30 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Product', key: 'product', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Payment', key: 'payment', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Product Cutoff', key: 'productCutoff', width: 15 },
            { header: 'Coupon Cutoff', key: 'couponCutoff', width: 15 },
            { header: 'Final Price', key: 'finalPrice', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        const orders = req.body;

        let overallFinalPrice = 0;
        let overallProductCutoff = 0;
        let overallCouponCutoff = 0;
        let overallOrderAmount = 0;
        let salesCount = orders.length;

        // Add individual orders to the worksheet
        orders.forEach(order => {
            const finalPrice = order.finalPrice;
            const couponCutoff = order.couponCutoff;
            const productCutoff = order.productCutoff;
            const totalAmount = order.totalAmount;

            overallFinalPrice += finalPrice;
            overallCouponCutoff += couponCutoff;
            overallProductCutoff += productCutoff;
            overallOrderAmount += totalAmount;

            worksheet.addRow({
                orderId: order.dataId,
                customer: order.name,
                product: order.product,
                date: order.date,
                payment: order.payment,
                totalAmount: totalAmount,
                productCutoff: productCutoff,
                couponCutoff: couponCutoff,
                finalPrice: finalPrice,
                status: order.status,
            });
        });

        // Add overall summary section
        worksheet.addRow({ orderId: '' });
        worksheet.addRow({ orderId: 'Overall Summary' });
        worksheet.addRow({ orderId: 'Sales Count:', customer: salesCount });
        worksheet.addRow({ orderId: 'Overall Order Amount:', customer: overallOrderAmount });
        worksheet.addRow({ orderId: 'Overall product discount:', customer: overallProductCutoff });
        worksheet.addRow({ orderId: 'Overall coupon discount:', customer: overallCouponCutoff });
        worksheet.addRow({ orderId: 'Overall Discount:', customer: overallProductCutoff + overallCouponCutoff });
        worksheet.addRow({ orderId: 'Overall credited Amount: ', customer: overallFinalPrice });

        // Add styling to the overall summary section
        const overallSummaryRow = worksheet.lastRow;
        overallSummaryRow.font = { bold: true };
        overallSummaryRow.alignment = { vertical: 'middle' };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=salesReport.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const generateLedgerPdf = async (req, res) => {
    try {
        const doc = new PDFDocument({ margin: 20 });
        const filename = 'ledger-report.pdf';
        const orders = req.body;
     
        const logoPath = "./public/user-assets/imgs/theme/ThinkThankz-logo/cover.png"; // Replace with the actual path to your company logo

        // Add company logo at the top left side of the heading
        doc.image(logoPath, {
            fit: [150, 150], // Adjust size
            align: 'left',
            valign: 'top'
        });

        // Set up document
        doc.fontSize(20).text('Ledger Report', { align: 'center' }).moveDown(1.5);

        // Initialize totals
        let totalDebit = 0;
        let totalCredit = 0;
        let totalGST = 0;

        // Calculate totals
        orders.forEach((order) => {
            const debitAmount = order.totalAmount || 0;
            const creditAmount = order.finalPrice || 0;
            const gst = creditAmount * 0.09; // GST is 9% of the credit
            totalDebit += debitAmount;
            totalCredit += creditAmount + gst; // Add GST to credit
            totalGST += gst; // Accumulate total GST
        });
 
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        doc.pipe(res);

        // Add headers
        const headers = ['Date', 'Description', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'];
        const headerWidths = [100, 200, 100, 100, 100]; // Adjusted widths
        let headerX = 20;
        let headerY = doc.y;
        const headerPadding = 30;

        headers.forEach((header, index) => {
            doc.fontSize(10).text(header, headerX, headerY, { width: headerWidths[index], align: 'center' });
            headerX += headerWidths[index];
        });

        doc.moveTo(20, headerY + headerPadding)
            .lineTo(doc.page.width - 20, headerY + headerPadding)
            .stroke();

        let dataY = headerY + headerPadding + 10;
        let balance = 0;

        // Add order data to ledger
        orders.forEach(order => {
            const date = order.date || '';
            const description = `Order ID: ${order.dataId} - ${order.name}` || '';
            const debit = order.totalAmount ? order.totalAmount.toFixed(2) : '0.00';
            const creditAmount = order.finalPrice || 0;
            const gst = creditAmount * 0.09; // GST is 9% of the credit
            const credit = (creditAmount + gst).toFixed(2); // Credit after adding GST

            balance += creditAmount + gst - order.totalAmount;

            const data = [date, description, `₹${debit}`, `₹${credit}`, `₹${balance.toFixed(2)}`];

            let dataX = 20;
            data.forEach((item, index) => {
                doc.fontSize(10).text(item, dataX, dataY, { width: headerWidths[index], align: 'center' });
                dataX += headerWidths[index];
            });

            dataY += 20;

            if (dataY > doc.page.height - 50) {
                doc.addPage();
                dataY = 50; 
            }
        });

        // Add totals summary
        doc.addPage(); 
        doc.fontSize(14).text('Summary', { align: 'center' }).moveDown(1.5);

        const summaryY = doc.y;
        doc.fontSize(12)
            .text(`Total Debit: ₹${totalDebit.toFixed(2)}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Total Credit (including GST): ₹${totalCredit.toFixed(2)}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Total GST: ₹${totalGST.toFixed(2)}`, { align: 'left' }) // Show total GST
            .moveDown(0.5)
            .text(`Final Balance: ₹${balance.toFixed(2)}`, { align: 'left' });

        doc.end();
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error generating Ledger PDF report');
    }
};


const adminDashboard = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        let { year = currentYear, month } = req.query;

        // Convert year to a number     
        year = Number(year);

        // Validate the year
        if (isNaN(year) || year < 2000 || year > currentYear) {
            return res.status(400).send("Invalid year");
        }

        // If month is provided, validate and convert it to a number
        if (month !== undefined) {
            month = Number(month);
            // Validate the month
            if (isNaN(month) || month < 1 || month > 12) {
                console.log("Invalid month:", month);
                return res.status(400).send("Invalid month");
            }
        } else {
            // If month is not provided, set it to the current month
            const currentDate = new Date();
            month = currentDate.getMonth() + 1; // Months are zero-indexed, so add 1
            console.log("Current month:", month);
        }

        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year + 1, 0, 1);
        let startOfMonth, endOfMonth;

        if (month !== undefined) {
            startOfMonth = new Date(year, month - 1, 1);
            endOfMonth = new Date(year, month, 0);
        }

        const [
            categories,
            deliveredOrders,
            products,
            users,
            monthlySales,
            latestOrders,
            bestSellingProducts,
            bestSellingCategories,
            bestSellingBrands
        ] = await Promise.all([
            Category.find({ isListed: true }),
            Order.find({ status: "Delivered", createdOn: { $gte: startOfYear, $lt: endOfYear } }),
            Product.find({}),
            User.find({}),
            Order.aggregate([
                { $match: { status: "Delivered", createdOn: { $gte: startOfYear, $lt: endOfYear } } },
                {
                    $group: {
                        _id: { year: { $year: "$createdOn" }, month: { $month: "$createdOn" } },
                        count: { $sum: 1 },
                        totalRevenue: { $sum: "$totalPrice" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            Order.find().sort({ createdOn: -1 }).limit(5),
            Order.aggregate([
                { $match: { status: "Delivered", createdOn: { $gte: startOfYear, $lt: endOfYear } } },
                { $unwind: "$product" },
                {
                    $group: {
                        _id: "$product.name",
                        totalSold: { $sum: "$product.quantity" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]),
            Order.aggregate([
                { $match: { status: "Delivered", createdOn: { $gte: startOfYear, $lt: endOfYear } } },
                { $unwind: "$product" },
                {
                    $group: {
                        _id: "$product.category",
                        totalSold: { $sum: "$product.quantity" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]),
            Order.aggregate([
                { $match: { status: "Delivered", createdOn: { $gte: startOfYear, $lt: endOfYear } } },
                { $unwind: "$product" },
                {
                    $group: {
                        _id: "$product.brand",
                        totalSold: { $sum: "$product.quantity" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ])
        ]);

        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0);

        const productPerMonth = Array(12).fill(0);
        products.forEach(p => {
            const createdMonth = new Date(p.createdOn).getMonth();
            productPerMonth[createdMonth]++;
        });

        const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
            const monthData = monthlySales.find(item => item._id.month === index + 1 && item._id.year === year);
            return monthData ? monthData.count : 0;
        });

        res.render("index", {
            orderCount: deliveredOrders.length,
            productCount: products.length,
            categoryCount: categories.length,
            totalRevenue,
            monthlyRevenue: totalRevenue, // Using totalRevenue as placeholder for monthlyRevenue
            monthlySalesArray,
            productPerMonth,
            latestOrders,
            bestSellingProducts,
            bestSellingCategories,
            bestSellingBrands,
            year,
            month // Pass the month to the template
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const dateWiseFilter = async (req, res)=>{
    try {
        console.log(req.query);
        const date = moment(req.query.date).startOf('day').toDate();

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: moment(date).startOf('day').toDate(),
                        $lt: moment(date).endOf('day').toDate(),
                    },
                    status: "Delivered"
                }
            }
        ]);

        console.log(orders);

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true , date})
       

    } catch (error) {
        console.log(error.message);
    }
}

const returnRequest = async (req, res) => {
    try {
        // Fetch and sort return requests by creation date in descending order
        const returnRequests = await Return.find({})
            .populate('userId')
            .populate('productId')
            .sort({ createdAt: -1 });

        // Render the results to the view
        res.render('adminReturnRequests', { returnRequests });
    } catch (error) {
        res.status(500).send('Error fetching return requests');
    }
};

const approveReturnRequest = async (req, res) => {
    const { returnId } = req.params;

    try {
        const returnRequest = await Return.findById(returnId);
        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        // Update the return request status to approved
        returnRequest.status = 'Approved';
        await returnRequest.save();

        // Update the order and product stock as necessary
        const order = await Order.findById(returnRequest.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user = await User.findById(returnRequest.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the product in the order
        const productIndex = order.product.findIndex(p => p._id.toString() === returnRequest.productId.toString());
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        const product = order.product[productIndex];
        console.log('Product before update:', product); // Debugging log

        // Calculate the return amount
        const returnAmount = product.price * returnRequest.quantity;

        // Update the product quantity in the order or remove if all returned
        if (returnRequest.quantity < product.quantity) {
            order.product[productIndex].quantity -= returnRequest.quantity;
            console.log('Product quantity after decrement:', order.product[productIndex].quantity); // Debugging log
        } else {
            order.product.splice(productIndex, 1);
            console.log('Product removed from order'); // Debugging log
        }

        // Adjust the order's total price
        order.totalPrice -= returnAmount;
        console.log('Order total price after adjustment:', order.totalPrice); // Debugging log

        // Mark the nested product array as modified
        order.markModified('product');

        // Update the order status to "Returned" if all products are returned
        if (order.product.length === 0) {
            order.status = "Returned";
            console.log('Order status set to Returned'); // Debugging log
        }

        // Save the updated order
        await order.save();

        // Update the product stock by incrementing the returned quantity
        await Product.findByIdAndUpdate(returnRequest.productId, {
            $inc: { quantity: returnRequest.quantity }
        });

        // Add money to user's wallet if payment method is wallet or online
        if (order.payment === "wallet" || order.payment === "online") {
            user.wallet += returnAmount;

            const newHistory = {
                amount: returnAmount,
                status: "credit",
                date: Date.now()
            };
            user.history.push(newHistory);

            await user.save();
        }

        res.status(200).json({ message: 'Return request approved successfully' });
    } catch (error) {
        console.error('Error approving return request:', error);
        res.status(500).json({ message: 'Error approving return request' });
    }
};



// Decline return request
const declineReturnRequest = async (req, res) => {
    const { returnId } = req.params;
 
    try {
        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        // Update the return request status to declined
        returnRequest.status = 'Declined';
        await returnRequest.save();

        res.status(200).json({ message: 'Return request declined successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error declining return request' });
    }
};

const dateRangeFilter = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).send("Start date and end date are required");
        }

        const start = moment(startDate).startOf('day').toDate();
        const end = moment(endDate).endOf('day').toDate();

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: start,
                        $lt: end,
                    },
                    status: "Delivered"
                }
            }
        ]);

        let itemsPerPage = 5;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(orders.length / itemsPerPage);
        const currentOrder = orders.slice(startIndex, endIndex);

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, startDate, endDate });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {
    adminDashboard,
    getLoginPage,
    verifyLogin,
    getCouponPageAdmin,
    createCoupon,
    deletCoupon,
    getLogout,
    getSalesReportPage,
    salesToday,
    salesWeekly,
    salesMonthly,
    salesYearly,
    dateWiseFilter,
    generatePdf,
    downloadExcel,
    approveReturnRequest,
    declineReturnRequest,
    returnRequest,
    dateRangeFilter,
    generateLedgerPdf 
}