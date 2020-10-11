const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.register = (req, res) => {
  // console.log(`Request body: ${req.body}`);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: errorHandler(err),
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
