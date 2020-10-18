const express = require('express');
const router = express.Router();

const { create } = require('../controllers/serviceType');

router.post('/service-type/create', create);

module.exports = router;
