const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = reqBody => {
  let errors = {
    email: [],
    password: [],
  };

  reqBody.email = !isEmpty(reqBody.email) ? reqBody.email : '';
  reqBody.password = !isEmpty(reqBody.password) ? reqBody.password : '';

  // email
  if (Validator.isEmpty(reqBody.email)) {
    errors.email.push('Email field is required.');
  } else if (!Validator.isEmail(reqBody.email)) {
    errors.email.push('Invalid email address');
  }

  // password
  if (Validator.isEmpty(reqBody.password)) {
    errors.password.push('Password field is required.');
  }

  return errors;
};
