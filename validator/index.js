exports.userRegisterValidator = (req, res, next) => {
  req.check('name', 'Name is required').notEmpty();
  req.check('email', 'Email is required').notEmpty();
  req
    .check('email')
    .matches(/.+\@.+\..+/)
    .withMessage('Email address is not valid');
  req
    .check('email')
    .isLength({ min: 4, max: 32 })
    .withMessage('Email must be between 4 and 32 characters');
  req.check('password', 'Password is required').notEmpty();
  req
    .check('password')
    .isLength({ min: 6, max: 32 })
    .withMessage('Password must be between 6 and 32 characters');
  req
    .check('password')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');
  const errors = req.validationErrors();
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  next();
};

exports.userSigninValidator = (req, res, next) => {
  req.check('email', 'Email is required').notEmpty();
  req
    .check('email')
    .matches(/.+\@.+\..+/)
    .withMessage('Email address is not valid');
  req.check('password', 'Password is required').notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError });
  }
  next();
};
