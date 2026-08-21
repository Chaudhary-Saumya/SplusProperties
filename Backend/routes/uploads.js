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

const fs = require('fs');

// Helper function to upload to Cloudinary with local disk fallback
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return reject(new Error('Cloudinary environment variables not configured'));
        }
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

const saveToLocalStorage = (file) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${filename}`;
};

router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }

        let fileUrl;
        try {
            const result = await uploadToCloudinary(req.file.buffer);
            fileUrl = result.secure_url;
        } catch (cloudErr) {
            console.warn('Cloudinary upload fallback to local storage:', cloudErr.message);
            fileUrl = saveToLocalStorage(req.file);
        }

        res.json({
            success: true,
            data: fileUrl
        });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({
            success: false,
            error: 'File upload failed'
        });
    }
});

module.exports = router;
