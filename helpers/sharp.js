const sharp = require("sharp");

// Function to upscale smaller images
async function upscaleImage(inputPath, outputPath, targetWidth, targetHeight) {
    try {
        // Get image metadata
        const metadata = await sharp(inputPath).metadata();
        const { width, height } = metadata;

        // Check if image dimensions are smaller than target resolution
        if (width < targetWidth || height < targetHeight) {
            // Calculate scaling factors
            const widthScale = targetWidth / width;
            const heightScale = targetHeight / height;
            const scale = Math.max(widthScale, heightScale);

            // Upscale the image while preserving aspect ratio
            await sharp(inputPath)
                .resize(Math.round(width * scale), Math.round(height * scale))
                .toFile(outputPath);

            console.log('Image upscaled successfully:', outputPath);
        } else {
            console.log('Image is already larger than the target resolution.');
        }
    } catch (error) {
        console.error('Error upscaling image:', error);
    }
}


module.exports = upscaleImage