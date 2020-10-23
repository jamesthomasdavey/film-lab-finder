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

// @router  post /api/services/find-one
// @desc    show available services based on the parameters given
// @access  public
router.get('/services/find-one', (req, res) => {
  const requestQuery = {};
  if (req.body.serviceType) requestQuery.serviceType = req.body.serviceType;
  if (req.body.filmType) requestQuery.filmType = req.body.filmType;
  if (req.body.filmSize) requestQuery.filmSize = req.body.filmSize;
  Service.find(requestQuery)
    .then(foundServices => {
      return res.json(foundServices);
    })
    .catch(() => res.json([]));
});

module.exports = router;
