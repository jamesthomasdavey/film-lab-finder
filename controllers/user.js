const User = require('../models/user');

// takes the :userid parameter, finds the corresponding user, and sets 'req.profile' to this user
exports.userById = (req, res, next, userId) => {
  // User.findById(id).exec((err, user) => {
  //   if (err || !user) {
  //     return res.status(400).json({
  //       error: 'User not found',
  //     });
  //   }
  //   req.profile = user;
  //   next();
  // });
  User.findById(userId)
    .then(foundUser => {
      req.profile = foundUser;
      next();
    })
    .catch(err => res.status(400).json({ error: 'User not found' }));
};
