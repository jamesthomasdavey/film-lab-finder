const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

const User = require('../models/user');

// import middleware
const { userById } = require('../controllers/user');

// @route   get /api/users
// @desc    shows a list of all users
// @access
router.get('/users', requireSignin, isAdmin, (__, res) => {
  User.find().then(foundUsers => {
    return res.json({ users: foundUsers });
  });
});

router.get('/dashboard', requireSignin, (req, res) => {
  User.findById(req.auth._id)
    .populate('lab')
    .then(foundUser => {
      if (!foundUser) return res.status(404).json({ error: 'User not found' });
      const user = {
        fullName: foundUser.fullName,
        email: foundUser.email,
      };
      if (foundUser.lab) {
        user.lab = {
          name: foundUser.lab.name,
          _id: foundUser.lab._id.toString(),
        };
      } else {
        user.lab = {
          name: '',
          _id: '',
        };
      }
      return res.json({ user: user });
    });
});

router.get('/dashboard/edit', requireSignin, (req, res) => {
  User.findById(req.auth._id).then(foundUser => {
    if (!foundUser) return res.status(404).json({ error: 'User not found' });
    const user = {
      fullName: foundUser.fullName,
      email: foundUser.email,
    };
    return res.json({ user: user });
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
