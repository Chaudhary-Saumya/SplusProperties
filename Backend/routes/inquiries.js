const express = require('express');
const { createInquiry, getInquiries, updateInquiryStatus } = require('../controllers/inquiryController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getInquiries)
    .post(createInquiry);

router.patch('/:id/status', updateInquiryStatus);

module.exports = router;
