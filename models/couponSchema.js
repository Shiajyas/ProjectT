const Mongoose = require("mongoose")

const couponSchema = Mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
        trim: true,
    
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    createdOn : {
        type : Date,
        required : true
    },
    expireOn : {
        type : Date,
        required : true
    },
    offerPrice : {
        type : Number,
        required : true
    },
    minimumPrice : {
        type : Number,
        required : true
    },
    isList : {
        type : Boolean,
        default : true
    },
    userId : {
        type : Array
    }
})

const Coupon = Mongoose.model("coupon", couponSchema)

module.exports = Coupon