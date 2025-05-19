const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);
router.delete('/:id', usersController.deleteUser);
router.put('/:id', usersController.updateUser);
router.post('/:id/verify-email', usersController.verifyEmail);

module.exports = router;