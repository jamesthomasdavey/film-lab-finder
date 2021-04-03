const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

const User = require('../models/user');

// import middleware
const { userById } = require('../controllers/user');

router.get('/users', requireSignin, isAdmin, (__, res) => {
  console.log('made it this far');
  User.find().then(foundUsers => {
    return res.json({ users: foundUsers });
  });
});

router.get('/dashboard', requireSignin, (req, res) => {
  console.log(req.auth._id);
  User.findById(req.auth._id).then(foundUser => {
    if (!foundUser) return res.status(404).json({ error: 'User not found' });
    const user = {
      fullName: foundUser.fullName,
      email: foundUser.email,
    };
    return res.json({ user: user });
  });
});

router.get('/users/:userId/dashboard', (req, res) => {
  User.findById(req.params.userId).then(foundUser => {
    return res.json({ user: foundUser });
  });
});

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
