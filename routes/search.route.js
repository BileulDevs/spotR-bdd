const express = require('express');
const searchController = require('../controllers/search.controller');
const router = express.Router();

router.get('/tag/:tag', searchController.searchByTag);

module.exports = router;