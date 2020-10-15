const express = require('express');
const router = express.Router();

const { register, signin, signout } = require('../controllers/user');
const { userRegisterValidator, userSigninValidator } = require('../validator');

router.post('/register', userRegisterValidator, register);
router.post('/signin', userSigninValidator, signin);
router.get('/signout', signout);

module.exports = router;
