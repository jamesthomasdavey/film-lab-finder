const express = require('express');
const router = express.Router();

const { create } = require('../controllers/serviceType');

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

// @route   post /api/service-types/create
// @desc    create a new service type; won't be using this
// @access
router.post('/service-types/create', create);

module.exports = router;
