const express = require('express');
const { createInquiry, getInquiries, updateInquiryStatus, trackLead, getSellerLeads } = require('../controllers/inquiryController');
const { protect, authorize, requireCompleteProfile, optionalProtect } = require('../middlewares/auth');

const router = express.Router();

// Track lead is optional protect (can track anonymous visitor clicks too)
router.post('/track-lead', optionalProtect, trackLead);

router.use(protect);

router.get('/mine', getInquiries);
router.get('/seller-leads', getSellerLeads);

router.route('/')
    .get(getInquiries)
    .post(requireCompleteProfile, createInquiry);

router.patch('/:id/status', authorize('User', 'Broker', 'Admin'), updateInquiryStatus);

module.exports = router;

