const express = require('express');
const {
    getWalletProperties,
    getWalletProperty,
    addWalletProperty,
    updateWalletProperty,
    deleteWalletProperty,
    generateShareLink,
    revokeShareLink,
    viewSharedProperty,
    getWalletStats
} = require('../controllers/walletController');

const { protect, authorize, requireCompleteProfile } = require('../middlewares/auth');
const { check } = require('express-validator');
const validate = require('../middlewares/validator');

const router = express.Router();

// ── Public Route (token-authenticated share view) ──
router.get('/shared/:token', viewSharedProperty);

// ── Protected Routes (Broker only) ──
router.use(protect);
router.use(requireCompleteProfile);
router.use(authorize('Broker', 'Admin'));

// Stats
router.get('/stats', getWalletStats);

// CRUD
router.route('/')
    .get(getWalletProperties)
    .post([
        check('title', 'Title is required').not().isEmpty(),
        validate
    ], addWalletProperty);

router.route('/:id')
    .get(getWalletProperty)
    .put(updateWalletProperty)
    .delete(deleteWalletProperty);

// Share link management
router.post('/:id/share', generateShareLink);
router.delete('/:id/share/:tokenId', revokeShareLink);

module.exports = router;
