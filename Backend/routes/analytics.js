const express = require('express');
const { recordHit } = require('../controllers/analyticsController');
const router = express.Router();

router.post('/hit', recordHit);

module.exports = router;
