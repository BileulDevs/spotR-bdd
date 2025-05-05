const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post('/checkUser', authController.checkUserForLogin);


module.exports = router;