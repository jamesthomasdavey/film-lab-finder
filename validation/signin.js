const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = reqBody => {
  let errors = {};

  reqBody.email = !isEmpty(reqBody.email) ? reqBody.email : '';
  reqBody.password = !isEmpty(reqBody.password) ? reqBody.password : '';

  // email
  if (Validator.isEmpty(reqBody.email)) {
    errors.email = 'Email field is required';
  } else if (!Validator.isEmail(reqBody.email)) {
    errors.email = 'Invalid email address';
  }

  // password
  if (Validator.isEmpty(reqBody.password)) {
    errors.password = 'Password field is required';
  }

  return errors;
};
