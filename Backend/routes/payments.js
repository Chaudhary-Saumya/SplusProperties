const express = require('express');
const { createTokenOrder, verifyPayment, getTransactions } = require('../controllers/paymentController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getTransactions);
router.post('/create-order', protect, createTokenOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
