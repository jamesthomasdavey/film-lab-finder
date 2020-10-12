const express = require('express');
const router = express.Router();

const { register, signin } = require('../controllers/user');
const { userRegisterValidator } = require('../validator');

router.post('/register', userRegisterValidator, register);
router.post('/signin', signin);

module.exports = router;
