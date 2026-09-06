const express = require('express');
const {
    getWallet,
    claimInstall,
    claimLoginReward,
    claimTask,
    submitWithdrawal,
    getWithdrawals,
    getReferrals,
    applyReferralCode
} = require('../controllers/rewardsController');

const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/claim-install', claimInstall);
router.get('/wallet', protect, getWallet);
router.post('/claim-login', protect, claimLoginReward);
router.post('/claim-task', protect, claimTask);
router.post('/apply-referral', protect, applyReferralCode);
router.post('/withdraw', protect, submitWithdrawal);
router.get('/withdrawals', protect, getWithdrawals);
router.get('/referrals', protect, getReferrals);

module.exports = router;
