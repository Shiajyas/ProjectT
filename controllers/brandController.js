const Brand = require("../models/brandSchema")
const Product = require("../models/productSchema")

const getBrandPage = async (req, res)=>{
    try {
        const brandData = await Brand.find({})
        res.render("brands", {data : brandData})
    } catch (error) {
        console.log(error.message);
    }
}

const addBrand = async (req, res)=>{
    try {
        const brandName = req.body.name.trim();
        const formattedBrandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

        const findBrand = await Brand.findOne({ brandName: formattedBrandName });
        if (!findBrand) {
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName: formattedBrandName,
                brandImage: image
            });

            await newBrand.save();
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Brand already exists" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
}


const getAllBrands = async (req, res)=>{
    try {
      res.redirect("/admin/brands")
        
    } catch (error) {
        console.log(error.message);
    }
}


const blockBrand = async (req, res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id : id}, {$set : {isBlocked : true}})
        console.log("brand blocked");
        res.redirect("/admin/brands")
    } catch (error) {
        console.log(error.message);
    }
}



const unBlockBrand = async (req, res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id : id}, {$set : {isBlocked : false}})
        console.log("brand unblocked");
        res.redirect("/admin/brands")
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    getBrandPage,
    addBrand,
    getAllBrands,
    blockBrand,
    unBlockBrand
}