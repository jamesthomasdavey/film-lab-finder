const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

const { userById } = require('../controllers/user');

router.get('/secret/:userId', requireSignin, isAuth, (req, res) => {
  res.json({ user: req.profile });
});

router.get('/greetings', requireSignin, isAdmin, (req, res) => {
  res.json({ message: 'it worked!' });
});

// middlewhere so that when :userId parameter is used, it calls on userById to set req.profile
router.param('userId', userById);

module.exports = router;
