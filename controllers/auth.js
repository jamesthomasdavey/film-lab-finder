const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check
const { errorHandler } = require('../helpers/dbErrorHandler');

const cookieName = 'flf-token';

exports.register = (req, res) => {
  // console.log(`Request body: ${req.body}`);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    // prevent sending this data to user
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json({
      user,
    });
  });
};

exports.signin = (req, res) => {
  // find the user based on email
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then(user => {
      // if user is found, make sure the email and password match
      if (!user.authenticate(password)) {
        return res
          .status(401)
          .json({ error: 'Email and password do not match' });
      }
      // generate a signed token with user id and secret
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
      // persist the token as 't' in cookie with expiry date
      res.cookie(cookieName, token, { expire: new Date() + 604800 });
      // return response with user and token to frontend client
      const { _id, name, email, role } = user;
      return res.json({
        token: token,
        user: { _id, name, email, role },
      });
    })
    .catch(err =>
      res.status(400).json({ error: 'User with that email does not exist' })
    );
};

exports.signout = (req, res) => {
  res.clearCookie(cookieName);
  res.json({ message: 'Signout successful' });
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
    return res
      .status(403)
      .json({ error: 'Requested user does not match logged in user' });
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
