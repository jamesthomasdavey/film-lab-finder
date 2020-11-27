const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

// import middleware
const { userById } = require('../controllers/user');

// @route   get /api/secret/:userId
// @desc
// @access
router.get('/secret/:userId', requireSignin, isAuth, (req, res) => {
  res.json({ user: req.profile });
});

// makes sure that when :userId parameter is used, it sets 'req.profile' to that user
// does this mean that :userId should only be used for the current user?
router.param('userId', userById);

module.exports = router;
