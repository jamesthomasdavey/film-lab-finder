const express = require('express');
const router = express.Router();

const { create } = require('../controllers/serviceType');

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

router.post('/service-type/create', create);

module.exports = router;
