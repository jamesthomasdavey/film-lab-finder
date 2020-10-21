const express = require('express');
const router = express.Router();

const {
  register,
  signin,
  signout,
  requireSignin,
} = require('../controllers/auth');
const { userRegisterValidator, userSigninValidator } = require('../validator');

// @route   post /api/register
// @desc    registers and signs in user
// @access  signed out user
router.post('/register', userRegisterValidator, register);

// @route   post /api/signin
// @desc    signs in user
// @access  signed out user
router.post('/signin', userSigninValidator, signin);

// @route   get /api/signout
// @desc    signs out user
// @access  signed in user
router.get('/signout', signout);

module.exports = router;
