const express = require('express');
const router = express.Router();

const Service = require('../models/service');

// @route   get /api/services
// @desc    shows service type, film type, and film size of all available services
// @access  for reference only
router.get('/services', (req, res) => {
  Service.find()
    .populate('serviceType', 'name')
    .populate('filmType', 'name')
    .populate('filmSize', 'name')
    .then(foundServices =>
      res.json(
        foundServices.map(foundService => {
          return {
            _id: foundService._id,
            serviceType: foundService.serviceType.name,
            filmType: foundService.filmType.name,
            filmSize: foundService.filmSize.name,
          };
        })
      )
    );
});

module.exports = router;
