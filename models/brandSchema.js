const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({
    brandName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    brandImage: {
        type : Array,
        required : true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
})

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand