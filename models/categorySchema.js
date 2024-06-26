const Mongoose = require("mongoose")
const categorySchema =  Mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true,
        trim: true,
    
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    description : {
        type : String,
        required : true
    },
    isListed : {
        type : Boolean,
        default : true
    },
    categoryOffer : {
        type : Number,
        default : 0
    }
})

const Category = Mongoose.model("Category", categorySchema)

module.exports = Category