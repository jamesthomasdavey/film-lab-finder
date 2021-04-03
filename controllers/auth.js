const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check

// models
const User = require('../models/user');
const Lab = require('../models/lab');

// validation
const validateRegisterInput = require('../validation/register');
const validateSigninInput = require('../validation/signin');
const isEmpty = require('../validation/is-empty');

const { validate } = require('uuid');

const cookieName = 'flf-token';

exports.register = (req, res) => {
  let error = '';
  let errors = {};
  User.findOne({ email: req.body.email.toLowerCase() }).then(foundUser => {
    if (foundUser) error = 'This email has already been registered.';
    errors = { ...errors, ...validateRegisterInput(req.body) };
    if (!isEmpty(errors) || error)
      return res.status(400).json({ errors: errors, error: error });
    const newUser = new User({
      ...req.body,
      email: req.body.email.toLowerCase().trim(),
    });
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
        .json({ errors: { password: ['Email and password do not match.'] } });
    const token = jwt.sign({ _id: foundUser._id }, process.env.JWT_SECRET);
    // persist the token with expiry date
    res.cookie(cookieName, token, { expire: new Date() + 604800 });
    // return response with user and token to frontend client
    return res.json({
      token: token,
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        fullName: foundUser.fullName,
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

// makes sure that the user is signed in at all. sets the "auth" variable
exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
});

// makes sure that the signed in user is the same as the requested user (when :userId is used)
// i can probably just make this part of the route itself
// exports.isAuth = (req, res, next) => {
//   let authorized = req.profile && req.auth && req.profile._id == req.auth._id;
//   if (!authorized) {
//     return res.status(403).json({
//       errors: { general: 'Requested user does not match logged in user' },
//     });
//   }
//   next();
// };

// rewrite of above function, but doesn't use req.profile
// makes sure that logged in user is the same as the :userId user, or that the logged in user is an admin
exports.isAuth = (req, res, next) => {
  const signedInUserId = req.auth._id.toString();
  const requestedUserId = req.params.userId;
  let isAuthorized = false;
  User.findById(requestedUserId).then(foundUser => {
    if (!foundUser) return res.status(404).json({ error: 'User not found.' });
    if (foundUser._id.toString() === signedInUserId) isAuthorized = true;
    if (isAuthorized) return next();
    User.findById(signedInUserId).then(foundSignedInUser => {
      if (!foundSignedInUser)
        return res.status(404).json({ error: 'User not found.' });
      if (foundSignedInUser.role === 1) isAuthorized = true;
      if (isAuthorized) return next();
      return res.status(403).json({ error: 'Unauthorized.' });
    });
  });
};

// makes sure that the requested user is an admin, i don't know why
// i can probably just make this part of the route itself
// exports.isAdmin = (req, res, next) => {
//   if (req.profile.role === 0) {
//     return res.status(403).json({
//       error: 'Admin resource! Access denied',
//     });
//   }
//   next();
// };

// rewrite of above function, but doesn't use req.profile
// makes sure that the logged in user is an admin
exports.isAdmin = (req, res, next) => {
  let isAdministrator = false;
  User.findById(req.auth._id.toString()).then(foundUser => {
    if (!foundUser) return res.status(404).json({ error: 'User not found' });
    if (foundUser.role === 1) {
      isAdministrator = true;
    }
    if (!isAdministrator) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    next();
  });
};

// makes sure that the logged in user owns the :labId lab, or that the logged in user is an admin
exports.isLabOwner = (req, res, next) => {
  const signedInUserId = req.auth._id.toString();
  const labId = req.params.labId;
  let isAuthorized = false;
  Lab.findById(labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found.' });
    foundLab.ownedBy.forEach(labOwnerId => {
      if (labOwnerId.toString() === signedInUserId) isAuthorized = true;
      if (isAuthorized) return next();
      User.findById(signedInUserId).then(foundSignedInUser => {
        if (!foundSignedInUser)
          return res.status(404).json({ error: 'User not found.' });
        if (foundSignedInUser.role === 1) isAuthorized = true;
        if (isAuthorized) return next();
        return res.status(403).json({ error: 'Unauthorized.' });
      });
    });
  });
};
