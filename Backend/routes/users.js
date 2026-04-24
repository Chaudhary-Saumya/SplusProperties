const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, getBrokers } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

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

module.exports = router;
