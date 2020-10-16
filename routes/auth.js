const express = require('express');
const router = express.Router();

const {
  register,
  signin,
  signout,
  requireSignin,
} = require('../controllers/auth');
const { userRegisterValidator, userSigninValidator } = require('../validator');

router.post('/register', userRegisterValidator, register);
router.post('/signin', userSigninValidator, signin);
router.get('/signout', signout);

module.exports = router;
