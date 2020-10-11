const express = require('express');
const router = express.Router();

const { register } = require('../controllers/user');
const { userRegisterValidator } = require('../validator');

router.post('/register', userRegisterValidator, register);

module.exports = router;
