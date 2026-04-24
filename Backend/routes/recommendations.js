const express = require('express');
const { getPersonalized, getSimilar, getTrending } = require('../controllers/recommendationController');

const router = express.Router();

router.get('/personalized', getPersonalized);
router.get('/similar/:id', getSimilar);
router.get('/trending', getTrending);

module.exports = router;
