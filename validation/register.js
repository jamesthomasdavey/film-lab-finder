const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = reqBody => {
  let errors = {
    email: [],
    password: [],
    password2: [],
  };

  console.log(reqBody);
  reqBody.email = !isEmpty(reqBody.email.trim()) ? reqBody.email.trim() : '';
  reqBody.password = !isEmpty(reqBody.password) ? reqBody.password : '';
  reqBody.password2 = !isEmpty(reqBody.password2) ? reqBody.password2 : '';

  // email
  if (Validator.isEmpty(reqBody.email.trim())) {
    errors.email.push('Email is required.');
  } else if (!Validator.isEmail(reqBody.email.trim())) {
    errors.email.push('Email address is invalid.');
  } else if (!Validator.isLength(reqBody.email.trim(), { max: 100 })) {
    errors.email.push('Email may not exceed 100 characters.');
  }

  // password
  if (Validator.isEmpty(reqBody.password)) {
    errors.password.push('Password field is required.');
  } else if (!Validator.isLength(reqBody.password, { min: 6 })) {
    errors.password.push('Password must be at least 6 characters.');
  } else if (!Validator.isLength(reqBody.password, { max: 30 })) {
    errors.password.push('Password may not exceed 30 characters.');
  }

  // password2
  if (Validator.isEmpty(reqBody.password2)) {
    errors.password2.push('Password confirmation is required.');
  } else if (!Validator.equals(reqBody.password, reqBody.password2)) {
    errors.password2.push('Passwords do not match.');
  }

  return errors;
};
