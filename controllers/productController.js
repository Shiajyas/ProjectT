const Product = require("../models/productSchema")
const Category = require("../models/categorySchema")
const Brand = require("../models/brandSchema")
const fs = require("fs")
const path = require("path")


const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true })
        const brand = await Brand.find({ isBlocked: false })
        res.render("product-add", { cat: category, brand: brand })
    } catch (error) {
        console.log(error.message);
    }
}


const addProducts = async (req, res) => {
    try {
        console.log("working newwww");

        const products = req.body;
        console.log(products);

        const productExists = await Product.findOne({ productName: products.productName });
        if (productExists) {
            return res.json({ success: false, message: 'Product already exists' });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        const newProduct = new Product({
            id: Date.now(),
            productName: products.productName,
            description: products.description,
            brand: products.brand,
            category: products.category,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice || products.regularPrice,
            createdOn: new Date(),
            quantity: products.quantity,
            pixel: products.pixel,
            model: products.model,
            feature: products.feature,
            productImage: images
        });

        await newProduct.save();

        res.json({ success: true });

    } catch (error) {
        console.error("Error adding product:", error.message);
        res.status(500).json({ success: false, message: "Failed to add product. Please try again later." });
    }
};


const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id
        const findProduct = await Product.findOne({ _id: id })

        const category = await Category.find({})
        const findBrand = await Brand.find({})
        res.render("edit-product", { product: findProduct, cat: category, brand: findBrand })
    } catch (error) {
        console.log(error.message);
    }
}


const deleteSingleImage = async (req, res) => {
    try {
        console.log("hi");
        const id = req.body.productId
        const image = req.body.filename
        console.log(id, image);
        const product = await Product.findByIdAndUpdate(id, {
            $pull: { productImage: image }
        })
        // console.log(image);
        const imagePath = path.join('public', 'uploads', 'product-images', image);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${image} deleted successfully`);
            res.json({ success: true })
        } else {
            console.log(`Image ${image} not found`);
        }

        // res.redirect(`/admin/editProduct?id=${product._id}`)

    } catch (error) {
        console.log(error.message);
    }
}


const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const images = [];

        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        console.log(req.files);

        // Fetch the existing product
        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // If there are new images, add them to the existing images array
        let updatedImages = existingProduct.productImage || [];
        if (images.length > 0) {
            updatedImages = updatedImages.concat(images);
            console.log("Yes image is there");
        } else {
            console.log("No images there");
        }

        const updatedProductData = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: data.category,
            regularPrice: data.regularPrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
            processor: data.processor,
            createdOn: new Date(),
        };

        // Add updatedImages only if there are new images
        if (images.length > 0) {
            updatedProductData.productImage = updatedImages;
        }

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(id, updatedProductData, { new: true });
        console.log("Product updated:", updatedProduct);

        res.redirect("/admin/products");
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || ""
        const page = req.query.page || 1
        const limit = 4
        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ],
        })
            .sort({ createdOn: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ],
        }).countDocuments()



        res.render("products", {
            data: productData,
            currentPage: page,
            totalPages: Math.ceil(count / limit)

        });

    } catch (error) {
        console.log(error.message);
    }
}


const getBlockProduct = async (req, res) => {
    try {
        let id = req.query.id
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } })
        console.log("product blocked")
        res.redirect("/admin/products")
    } catch (error) {
        console.log(error.message);
    }
}


const getUnblockProduct = async (req, res) => {
    try {
        let id = req.query.id
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } })
        console.log("product unblocked")
        res.redirect("/admin/products")
    } catch (error) {
        console.log(error.message);
    }
}



const addProductOffer = async (req, res) => {
    try {
        // console.log(req.body);
        const { productId, percentage } = req.body
        const findProduct = await Product.findOne({ _id: productId })
        // console.log(findProduct);

        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage / 100))
        findProduct.productOffer = parseInt(percentage)
        await findProduct.save()

        res.json({ status: true })

    } catch (error) {
        console.log(error.message);
    }
}



const removeProductOffer = async (req, res) => {
    try {
        // console.log(req.body);
        const {productId} = req.body
        const findProduct = await Product.findOne({_id : productId})
        // console.log(findProduct);
        const percentage = findProduct.productOffer
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100))
        findProduct.productOffer = 0
        await findProduct.save()
        res.json({status : true})
    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    getBlockProduct,
    getUnblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    addProductOffer,
    removeProductOffer
}