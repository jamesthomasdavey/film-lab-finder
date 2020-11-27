const User = require('../models/user');

// takes the :userid parameter, finds the corresponding user, and sets 'req.profile' to this user
// i can probably rewrite this
exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }
    req.profile = user;
    next();
  });
};
