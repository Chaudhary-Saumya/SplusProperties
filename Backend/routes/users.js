const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, getBrokers, resetUserPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { requireAdminSecurityPin } = require('../middlewares/adminSecurity');

const router = express.Router();

// Public route for brokers list
router.get('/brokers', getBrokers);

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

router.put('/:id/reset-password', requireAdminSecurityPin, resetUserPassword);

module.exports = router;


