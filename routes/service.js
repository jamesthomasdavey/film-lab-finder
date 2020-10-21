const express = require('express');
const router = express.Router();

const Service = require('../models/service');

// @route   get /api/services
// @desc    shows all available services
// @access  nonexistant
router.get('/services', (req, res) => {
  Service.find()
    .populate('serviceType', 'name')
    .populate('filmType', 'name')
    .populate('filmSize', 'name')
    .then(services =>
      res.json(
        services.map(service => {
          return {
            serviceType: service.serviceType.name,
            filmType: service.filmType.name,
            filmSize: service.filmSize.name,
          };
        })
      )
    );
});

module.exports = router;
