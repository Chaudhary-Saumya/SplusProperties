const express = require('express');
const { saveMap, getMap, getMyMaps, deleteMap } = require('../controllers/mapController');
const { protect, optionalProtect } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
    .post(optionalProtect, saveMap);

router.get('/my-maps', protect, getMyMaps);

router.route('/:shareId')
    .get(getMap)
    .delete(protect, deleteMap);

module.exports = router;
