const nodemailer = require("nodemailer")
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const User = require("../models/userSchema");
const Brand = require("../models/brandSchema")
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Banner = require("../models/bannerSchema")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const twilio = require("twilio")


const Coupon = require("../models/couponSchema")
const { application } = require("express");



const pageNotFound = async (req, res) => {
    try {
        res.render("page-404")
    } catch (error) {
        console.log(error.message);
    }
}

//Generate Hashed Password

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

//Loading the Home page
const getHomePage = async (req, res) => {
    try {
        const today = new Date().toISOString();
        const user = req.session.user;

        console.log("User session:", user); // Check if user session is set

        const findBanner = await Banner.find({
            startDate: { $lt: new Date(today) },
            endDate: { $gt: new Date(today) }
        });
      
        const userData = await User.findOne({});
        const brandData = await Brand.find({ isBlocked: false });
        const productData = await Product.find({ isBlocked: false }).sort({ id: -1 }).limit(4);

        if (user) { 
            console.log("User is logged in:", userData); // Check user data if logged in
            res.render("home", { user: userData, data: brandData, products: productData, banner: findBanner });
        } else {
            console.log("User is not logged in"); // Check if user is not logged in
            res.render("home", { data: brandData, products: productData, banner: findBanner });
        }
    } catch (error) {
        console.log("Error:", error.message); // Log any errors that occur
    }
}

//Loading the Login Page

const getLoginPage = async (req, res) => {
    try {
        if (!req.session.user) {
            res.render("login")
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.log(error.message);
    }
}


//Load signup page

const getSignupPage = async (req, res) => {
    try {
        if (!req.session.user) {
            let success = req.flash("edit");
            res.render("signup",{success})
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.log(error.message);
    }
}

//Generate OTP

function generateOtp() {
    const digits = "1234567890"
    var otp = ""
    for (i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp
}

//User Registration
const signupUser = async (req, res) => {
    try {
        const { email, phone, name, referralCode, password, cPassword } = req.body;
        req.session.referralCode = referralCode;
        req.session.phone = phone;

        // Validate input
        if (!name || name.trim() === "") {
            return res.render("signup", { message: "Please provide a valid username." });
        }
        if (!email || email.trim() === "") {
            return res.render("signup", { message: "Please provide a valid email." });
        }
        if (!phone || phone.trim() === "") {
            return res.render("signup", { message: "Please provide a valid phone number." });
        }
        if (!password || password.trim() === "") {
            return res.render("signup", { message: "Please provide a valid password." });
        }
        if (password !== cPassword) {
            return res.render("signup", { message: "Passwords do not match." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User already exists");
            return res.render("signup", { message: "User with this email already exists." });
        }

        // Initialize Twilio client
        // const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

        // Generate OTP
        const otp = generateOtp();
        console.log(`Generated OTP: ${otp}`);

        // Ensure 'from' number is a valid Twilio number
        // const fromNumber = process.env.TWILIO_NUMBER; // Replace with your Twilio number from environment variables
        // const toNumber = phone.startsWith('+') ? phone : `+91${phone}`; // Ensure correct format

        // try {
        //     // Send OTP via SMS
        //     const message = await twilioClient.messages.create({
        //         body: `Your OTP is ${otp}`,
        //         to: toNumber,
        //         from: fromNumber,
        //     });
        //     console.log(`Twilio message sent: ${message.sid}`);
        // } catch (twilioError) {
        //     console.error('Twilio Error:', twilioError);
        //     return res.status(500).render("signup", { message: "Failed to send OTP via SMS." });
        // }

        // Initialize Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        try {
            // Send OTP via email
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verify Your Account ✔",
                text: `Your OTP is ${otp}`,
                html: `<b><h4>Your OTP is ${otp}</h4><br><a href="">Click here</a></b>`,
            });
            console.log("Email sent", info.messageId);

            // Store OTP and user data in session
            req.session.userOtp = otp;
            req.session.userData = req.body;
            res.render("verify-otp", { email });
        } catch (emailError) {
            console.error('Email Error:', emailError);
            return res.status(500).render("signup", { message: "Failed to send OTP via email." });
        }
    } catch (error) {
        console.log('Internal Server Error:', error.message);
        res.status(500).send("Internal Server Error");
    }
};


// render the OTP verification page

const getOtpPage = async (req, res) => {
    try {
        res.render("verify-otp")
    } catch (error) {
        console.log(error.message);
    }
}


// Resend Otp

const resendOtp = async (req, res) => {
    try {
        const email = req.session.userData.email;
        const phone = req.session.phone;

        var newOtp = generateOtp();
        console.log(`Resending OTP to ${email}. New OTP: ${newOtp}`);

        // const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        
        // // Ensure 'from' number is a valid Twilio number
        // const fromNumber = +14178072463; // Replace with your Twilio number
        // const toNumber = phone.startsWith('+') ? phone : `+91${phone}`; // Ensure correct format

        // try {
        //     const message = await twilioClient.messages.create({
        //         body: `Your OTP is ${newOtp}`,
        //         to: toNumber,
        //         from: fromNumber,
        //     });
        //     console.log(`Twilio message sent: ${message.sid}`);
        // } catch (twilioError) {
        //     console.error('Twilio Error:', twilioError);
        //     return res.json({ success: false, message: 'Failed to resend OTP via SMS' });
        // }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Resend OTP ✔",
                text: `Your new OTP is ${newOtp}`,
                html: `<b><h4>Your new OTP is ${newOtp}</h4><br><a href="">Click here</a></b>`,
            });
            console.log("Email resent", info.messageId);

            req.session.userOtp = newOtp;
            res.json({ success: true, message: 'OTP resent successfully' });
        } catch (emailError) {
            console.error('Email Error:', emailError);
            res.json({ success: false, message: 'Failed to resend OTP via email' });
        }
    } catch (error) {
        console.log('Internal Server Error:', error.message);
        res.json({ success: false, message: 'Error in resending OTP' });
    }
};


// Verify otp from email with generated otp and save the user data to db

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const referralCode = uuidv4();
            console.log("the referralCode  =>" + referralCode);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
                referalCode: referralCode
            });

            await saveUserData.save();

            req.session.user = saveUserData._id;

            if (req.session.referalCode) {
                const referalCode1 = req.session.referalCode;
                const currentUser = await User.findOne({ _id: req.session.user });
                const codeOwner = await User.findOne({ referalCode: referalCode1 });

                await User.updateOne(
                    { _id: req.session.user },
                    {
                        $inc: { wallet: 100 },
                        $push: {
                            history: {
                                amount: 100,
                                status: "credit",
                                date: Date.now()
                            }
                        },
                        $set: { redeemed: true }
                    }
                );

                await User.updateOne(
                    { _id: codeOwner._id },
                    {
                        $inc: { wallet: 200 },
                        $push: {
                            history: {
                                amount: 200,
                                status: "credit",
                                date: Date.now(),
                                redeemedUsers: currentUser._id
                            },
                            $set: { referalCode: "" }
                        }
                    }
                );

                console.log("Referral code redeemed successfully!");
                return res.json({ status: true, message: "Referral code and OTP verified successfully!" });
            }

            return res.json({ status: true, message: "OTP verified successfully!" });
        } else {
            console.log("otp not matching");
            return res.json({ status: false, message: "Entered OTP is incorrect" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, message: "An error occurred" });
    }
};


const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const findUser = await User.findOne({ isAdmin: "0", email: email })

        console.log("working");

        if (findUser) {
            const isUserNotBlocked = findUser.isBlocked === false;

            if (isUserNotBlocked) {
                const passwordMatch = await bcrypt.compare(password, findUser.password)
                if (passwordMatch) {
                    req.session.user = findUser._id
                    console.log("Logged in");
                    res.redirect("/")
                } else {
                    console.log("Password is not matching");
                    res.render("login", { message: "Password is not matching" })
                }
            } else {
                console.log("User is blocked by admin");
                res.render("login", { message: "User is blocked by admin" })
            }
        } else {
            console.log("User is not found");
            res.render("login", { message: "User is not found" })
        }

    } catch (error) {
        console.log(error.message);
        res.render("login", { message: "Login failed" })
    }
}






const getLogoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
            }
            console.log("Logged out");
            res.redirect("/login")
        })
    } catch (error) {
        console.log(error.message);
    }
}


const getProductDetailsPage = async (req, res) => {
    try {
        const user = req.session.user
        console.log("wrking");
        const id = req.query.id
        console.log(id);
        const findProduct = await Product.findOne({ id: id });
        const findCategory = await Category.findOne({name : findProduct.category})
        // console.log(findCategory);
        let totalOffer
        if(findCategory.categoryOffer || findProduct.productOffer){
            totalOffer = findCategory.categoryOffer + findProduct.productOffer
        }
        console.log(findProduct.id, "Hello world");
        if (user) {
            res.render("product-details", { data: findProduct, totalOffer, user: user })
        } else {
            res.render("product-details", { data: findProduct, totalOffer })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const getShopPage = async (req, res) => {
    try {
        const user = req.session.id;
        const products = await Product.find({ isBlocked: false });
        const count = await Product.find({ isBlocked: false }).count();
        const brands = await Brand.find({});
        const categories = await Category.find({ isListed: true });

        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(products.length / itemsPerPage);
        const currentProduct = products.slice(startIndex, endIndex);

        // Function to generate pagination links with query parameters
        const getPaginationLink = (page) => {
            const urlParams = new URLSearchParams(req.query);
            urlParams.set('page', page);
            return `/shop?${urlParams.toString()}`;
        };

        res.render("shop", {
            user: user,
            product: currentProduct,
            category: categories,
            brand: brands,
            count: count,
            totalPages: totalPages,
            currentPage: currentPage,
            getPaginationLink: getPaginationLink,
            selectedCategory: req.query.category || null,
            selectedBrand: req.query.brand || null
        });
    } catch (error) {
        console.log(error.message);
    }
};

const filterByPrice = async (req, res) => {
    try {
        const user = req.session.user;
        const brands = await Brand.find({});
        const categories = await Category.find({ isListed: true });
        const findProducts = await Product.find({
            $and: [
                { salePrice: { $gt: req.query.gt } },
                { salePrice: { $lt: req.query.lt } },
                { isBlocked: false }
            ]
        });

        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProduct = findProducts.slice(startIndex, endIndex);

        // Function to generate pagination links with query parameters
        const getPaginationLink = (page) => {
            const urlParams = new URLSearchParams(req.query);
            urlParams.set('page', page);
            return `/shop?${urlParams.toString()}`;
        };

        res.render("shop", {
            user: user,
            product: currentProduct,
            category: categories,
            brand: brands,
            totalPages: totalPages,
            currentPage: currentPage,
            getPaginationLink: getPaginationLink,
            selectedCategory: req.query.category || null,
            selectedBrand: req.query.brand || null
        });
    } catch (error) {
        console.log(error.message);
    }
};


const searchProducts = async (req, res) => {
    try {
        const user = req.session.user;
        let search = req.query.search || "";
        const brands = await Brand.find({});
        const categories = await Category.find({ isListed: true });
        const selectedCategory = req.query.category || null; // Fetch selected category from query parameters
        const selectedBrand = req.query.brand || null; // Fetch selected brand from query parameters

        const searchResultCount = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
            isBlocked: false,
        }).count();

        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        const searchResult = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: "i" },
            isBlocked: false,
        }).skip(startIndex).limit(itemsPerPage).lean();

        const totalPages = Math.ceil(searchResultCount / itemsPerPage);

        res.render("shop", {
            user: user,
            product: searchResult,
            category: categories,
            brand: brands,
            totalPages: totalPages,
            currentPage: currentPage,
            selectedCategory: selectedCategory, // Pass selectedCategory to the template
            selectedBrand: selectedBrand // Pass selectedBrand to the template
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const filterProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const category = req.query.category;
        const brand = req.query.brand;
        const sortOption = req.query.sort;
        const brands = await Brand.find({});
        const findCategory = category ? await Category.findOne({ _id: category }) : null;
        const findBrand = brand ? await Brand.findOne({ _id: brand }) : null;

        const query = { isBlocked: false };

        if (findCategory) {
            query.category = findCategory.name;
        }

        if (findBrand) {
            query.brand = findBrand.brandName;
        }

        let sortCriteria = {};

        if (sortOption === "lowToHigh") {
            sortCriteria = { salePrice: 1 };
        } else if (sortOption === "highToLow") {
            sortCriteria = { salePrice: -1 };
        } else if (sortOption === "releaseDate") {
            sortCriteria = { createdOn: 1 };
        }

        // Check if price range filters are provided in the query
        if (req.query.gt && req.query.lt) {
            query.salePrice = { $gt: req.query.gt, $lt: req.query.lt };
        }

        const findProducts = await Product.find(query).sort(sortCriteria);
        const categories = await Category.find({ isListed: true });

        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProduct = findProducts.slice(startIndex, endIndex);

        // Function to generate pagination links with query parameters
        const getPaginationLink = (page) => {
            const urlParams = new URLSearchParams(req.query);
            urlParams.set('page', page);
            return `/filter?${urlParams.toString()}`;
        };

        res.render("shop", {
            user: user,
            product: currentProduct,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
            getPaginationLink: getPaginationLink,
            selectedCategory: category || null,
            selectedBrand: brand || null
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user;
        const couponName = req.body.coupon; // Expecting a single coupon name
        const totalAmount = parseInt(req.body.total);

        const selectedCoupon = await Coupon.findOne({ name: couponName });

        if (!selectedCoupon) {
            console.log("no coupon");
            return res.json({ noCoupon: true });
        }

        if (selectedCoupon.userId.includes(userId)) {
            console.log("already used");
            return res.json({ used: true });
        }

        console.log("coupon exists");

        // Add the discount of the new coupon to the existing discount in the session
        const currentDiscount = req.session.coupon ? req.session.coupon : 0;
        const newDiscount = currentDiscount + parseInt(selectedCoupon.offerPrice);

        await Coupon.updateOne(
            { name: couponName },
            { $addToSet: { userId: userId } }
        );

        req.session.coupon = newDiscount;
        const newTotal = totalAmount - newDiscount;

        console.log(newTotal, "----");
        res.json({ gt: newTotal, offerPrice: newDiscount });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};


const getSortProducts = async (req, res) => {
    try {
        const { option, category, brand } = req.body;
        let itemsPerPage = 6;
        let currentPage = parseInt(req.body.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;

        let filterCriteria = { isBlocked: false };

        if (category) {
            filterCriteria.category = category;
        }

        if (brand) {
            filterCriteria.brand = brand;
        }

        let sortCriteria = {};
        if (option === "highToLow") {
            sortCriteria.salePrice = -1;
        } else if (option === "lowToHigh") {
            sortCriteria.salePrice = 1;
        } else if (option === "releaseDate") {
            sortCriteria.createdOn = 1;
        }

        const data = await Product.find(filterCriteria).sort(sortCriteria);

        res.json({
            status: true,
            data: {
                currentProduct: data.slice(startIndex, endIndex),
                count: data.length,
                totalPages: Math.ceil(data.length / itemsPerPage),
                currentPage
            }
        });
    } catch (error) {
        console.log(error.message);
        res.json({ status: false, error: error.message });
    }
};





module.exports = {
    getHomePage,
    getLoginPage,
    getSignupPage,
    signupUser,
    getOtpPage,
    verifyOtp,
    resendOtp,
    userLogin,
    getLogoutUser,
    getProductDetailsPage,
    getShopPage,
    pageNotFound,
    searchProducts,
    filterProduct,
    filterByPrice,
    applyCoupon,
    getSortProducts
}