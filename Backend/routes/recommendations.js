const express = require('express');
const { 
    getPersonalized, 
    getSimilar, 
    getTrending, 
    getPeopleAlsoViewed, 
    getBecauseYouViewed, 
    getNewMatches 
} = require('../controllers/recommendationController');

const router = express.Router();

router.get('/personalized', getPersonalized);
router.get('/similar/:id', getSimilar);
router.get('/trending', getTrending);
router.get('/also-viewed/:id', getPeopleAlsoViewed);
router.get('/because-you-viewed', getBecauseYouViewed);
router.get('/new-matches', getNewMatches);

module.exports = router;
