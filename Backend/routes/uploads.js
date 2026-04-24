const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Multer config: Use memory storage so we don't save to the 'uploads' folder
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|pdf|mp4|avi|mov|wmv|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images, PDFs, and Videos only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'property_platform',
                resource_type: 'auto'
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        stream.end(buffer);
    });
};

router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        res.json({
            success: true,
            data: result.secure_url
        });
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({
            success: false,
            error: 'File upload failed'
        });
    }
});

module.exports = router;
