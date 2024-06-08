const express = require("express")
const Router = express.Router()

const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController,")
const userProfileController = require("../controllers/userProfileController")
const orderController = require("../controllers/orderContoller")
const walletController = require("../controllers/walletController")
const wishlistController = require("../controllers/wishlistController")
const webhookController = require("../controllers/webhookController")

const multer = require("multer")
const storage = require("../helpers/multer")
const upload = multer({ storage: storage })
Router.use("/public/uploads", express.static("/public/uploads"))


const { isLogged } = require("../Authentication/auth")

Router.get("/pageNotFound", userController.pageNotFound)

// User actions
Router.get("/", userController.getHomePage)
Router.get("/login", userController.getLoginPage)
Router.post("/login", userController.userLogin)

Router.get("/signup", userController.getSignupPage)
Router.post("/verify-otp", userController.verifyOtp)
Router.post("/resendOtp", userController.resendOtp)
Router.post("/signup", userController.signupUser)

Router.get("/logout", isLogged, userController.getLogoutUser)

Router.get("/forgotPassword", userProfileController.getForgotPassPage)
Router.post("/forgotEmailValid", userProfileController.forgotEmailValid)
Router.post("/verifyPassOtp", userProfileController.verifyForgotPassOtp)
Router.get("/resetPassword", userProfileController.getResetPassPage)
Router.post("/changePassword", userProfileController.postNewPassword)

// User profile
Router.get("/profile", isLogged, userProfileController.getUserProfile)
Router.get("/addAddress", isLogged, userProfileController.getAddressAddPage)
Router.post("/addAddress", isLogged, userProfileController.postAddress)
Router.get("/editAddress", isLogged, userProfileController.getEditAddress),
Router.post("/editAddress", isLogged, userProfileController.postEditAddress)
Router.delete("/deleteAddress", isLogged, userProfileController.getDeleteAddress)
Router.post("/editUserDetails", isLogged, upload.array("images", 2), userProfileController.editUserDetails)
Router.post("/verifyReferalCode", isLogged, userProfileController.verifyReferalCode)

// Products based routes
Router.get("/productDetails", userController.getProductDetailsPage)
Router.get("/shop", userController.getShopPage)
Router.get("/search", userController.searchProducts)
Router.get("/filter", userController.filterProduct)
Router.get("/filterPrice", userController.filterByPrice)
Router.post("/sortProducts", userController.getSortProducts)

// Cart
Router.get("/cart", isLogged, cartController.getCartPage)
Router.post("/addToCart", isLogged, cartController.addToCart)
Router.post("/changeQuantity", isLogged, cartController.changeQuantity)
Router.get("/deleteItem", isLogged, cartController.deleteProduct)



//Orders
Router.get("/checkout",isLogged, orderController.getCheckoutPage)
Router.post("/orderPlaced", isLogged, orderController.orderPlaced)
Router.post("/verifyPayment", isLogged, orderController.verifyPayment)
Router.get("/orderDetails", isLogged, orderController.getOrderDetailsPage)
Router.get("/cancelOrder", isLogged, orderController.cancelOrder)
Router.post("/cancelProduct", isLogged,upload.none(), orderController.cancelProduct)
Router.get("/return", isLogged, orderController.getReturnOrder)
// Router.get("/returnProduct", isLogged, orderController.getReturnProduct)
Router.post("/raiseReturnRequest", isLogged, orderController.returnProduct)
Router.get("/checkoutCart", isLogged, orderController.getCartCheckoutPage)
Router.post("/webhooks/razorpay", webhookController.handleWebhook);

Router.get("/invoice", orderController.getInvoice)
Router.post("/applyCoupon", isLogged, userController.applyCoupon)
Router.post("/logPaymentFailure", isLogged, orderController.logPaymentFailure)
Router.post("/savePendingOrder", isLogged, orderController.savePendingOrder)
// Router.post("/retryPayment", isLogged, orderController.retryPayment)

// Wallet
Router.post("/addMoney", isLogged, walletController.addMoneyToWallet)
Router.post("/verify-payment", isLogged, walletController.verify_payment)


// Wishlist
Router.get("/wishlist", isLogged, wishlistController.getWishlistPage)
Router.post("/addToWishlist",isLogged, wishlistController.addToWishlist)
Router.get("/deleteWishlist", isLogged, wishlistController.deleteItemWishlist)

module.exports = Router