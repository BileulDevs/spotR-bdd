const express = require('express');
const { getMetrics } = require('../controllers/metrics.controller');
const router = express.Router();

router.get('/', getMetrics);

module.exports = router;