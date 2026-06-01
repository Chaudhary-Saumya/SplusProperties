const express = require('express');
const { createInquiry, getInquiries, updateInquiryStatus } = require('../controllers/inquiryController');
const { protect, authorize, requireCompleteProfile } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getInquiries)
    .post(requireCompleteProfile, createInquiry);

router.patch('/:id/status', authorize('Seller', 'Broker', 'Admin'), updateInquiryStatus);

module.exports = router;
