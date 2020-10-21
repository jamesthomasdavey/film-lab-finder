const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

// import middleware
const { userById } = require('../controllers/user');

// @route   get /api/secret/userId
// @desc
// @access
router.get('/secret/:userId', requireSignin, isAuth, (req, res) => {
  res.json({ user: req.profile });
});

// middlewhere so that when :userId parameter is used, it calls on userById to set req.profile
router.param('userId', userById);

module.exports = router;
