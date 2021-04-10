const express = require('express');
const router = express.Router();

const {
  register,
  signin,
  signout,
  savePassword,
  requireSignin,
  saveDashboard,
} = require('../controllers/auth');

// @route   post /api/register
// @desc    registers and signs in user
// @access  signed out user
router.post('/register', register);

// @route   post /api/signin
// @desc    signs in user
// @access  signed out user
router.post('/signin', signin);

// @route   get /api/signout
// @desc    signs out user
// @access  signed in user
router.get('/signout', signout);

router.put('/password', requireSignin, savePassword);

router.put('/dashboard', requireSignin, saveDashboard);

module.exports = router;
