const User = require('../models/user');

exports.register = (req, res) => {
  console.log(`Request body: ${req.body}`);
  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({ err });
    }
    res.json({ user });
  });
};
