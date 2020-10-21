const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check

// validation
const validateRegisterInput = require('../validation/register');
const validateSigninInput = require('../validation/signin');
const isEmpty = require('../validation/is-empty');

const { validate } = require('uuid');

const cookieName = 'flf-token';

exports.register = (req, res) => {
  let errors = {};
  User.findOne({ email: req.body.email }).then(foundUser => {
    if (foundUser) errors.email = 'This email has already been registered.';
    errors = { ...errors, ...validateRegisterInput(req.body) };
    if (!isEmpty(errors)) return res.status(400).json({ errors: errors });
    const newUser = new User(req.body);
    newUser.save().then(createdUser => {
      // prevent sending this data to user
      createdUser.salt = undefined;
      createdUser.hashed_password = undefined;
      return res.json({
        user: createdUser,
      });
    });
  });
};

exports.signin = (req, res) => {
  if (!isEmpty(validateSigninInput(req.body)))
    return res.status(400).json({ errors: validateSigninInput(req.body) });
  User.findOne({ email: req.body.email }).then(foundUser => {
    if (!foundUser || !foundUser.authenticate(req.body.password))
      return res
        .status(401)
        .json({ errors: { password: 'Email and password do not match' } });
    const token = jwt.sign({ _id: foundUser._id }, process.env.JWT_SECRET);
    // persist the token with expiry date
    res.cookie(cookieName, token, { expire: new Date() + 604800 });
    // return response with user and token to frontend client
    return res.json({
      token: token,
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      },
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie(cookieName);
  res.json({ message: 'Signout success' });
};

///////////////
//// MIDDLEWARE
///////////////

// makes sure that the user is signed in at all
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
});

// makes sure that the signed in user is the same as the requested user
exports.isAuth = (req, res, next) => {
  let authorized = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!authorized) {
    return res.status(403).json({
      errors: { general: 'Requested user does not match logged in user' },
    });
  }
  next();
};

// makes sure that the requested user is an admin
// so basically, if there's no requested user, this won't work
exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: 'Admin resource! Access denied',
    });
  }
  next();
};
