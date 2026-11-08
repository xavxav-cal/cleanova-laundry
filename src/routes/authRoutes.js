const express = require('express');
const router = express.Router();
const { login, getAllUsers, createUser, updateUserRole } = require('../controllers/authController');

router.post('/login', login);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);

module.exports = router;