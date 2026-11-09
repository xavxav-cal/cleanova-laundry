const express = require('express');
const router = express.Router();
const { login, getAllUsers, createUser, updateUserRole } = require('../controllers/authController');
const { db } = require('../config/database');

router.post('/login', login);
router.get('/users', getAllUsers);
router.get('/logs', authController.getActivityLogs);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);

module.exports = router;

