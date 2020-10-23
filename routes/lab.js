const express = require('express');
const router = express.Router();

const Lab = require('../models/lab');
const Service = require('../models/service');

// @route   get /api/labs/:labId/edit-services
// @desc    returns all available services, noting which ones the lab offers
// @access  private
router.get('/labs/:labId/edit-services', (req, res) => {
  Service.find({})
    .populate('serviceType', 'name')
    .populate('filmType', 'name')
    .populate('filmSize', 'name')
    .then(foundServices => {
      Lab.findById(req.params.labId).then(foundLab => {
        const labServices = [...foundLab.servicesOffered];
        res.json(
          foundServices.map(foundService => {
            // if foundservice is in labservices, return the labservice
            let matchedService;
            labServices.forEach(labService => {
              if (
                labService.service._id.toString() ===
                foundService._id.toString()
              ) {
                matchedService = {
                  baseCost: labService.baseCost,
                  offeredByLab: true,
                  includedServiceTypes: foundService.includedServiceTypes,
                  serviceType: foundService.serviceType,
                  filmType: foundService.filmType,
                  filmSize: foundService.filmSize,
                };
              }
            });
            // otherwise, return the foundservice
            return matchedService ? matchedService : foundService;
          })
        );
      });
    });
});

// @route   post /api/labs/new
// @desc    creates a new lab based on parameters
// @access  private
// router.post('/labs/new-dummy-lab', (req, res) => {
//   const newLab = new Lab({
//     // hardcode this info for now
//     name: 'Dummy Lab',
//     ownedBy: '5f90955a2d099157b72fed1e',
//     servicesOffered: [{ service: '5f9085a54b98514e1b5c45b1', baseCost: 15 }],
//   });
//   newLab.save().then(createdLab => {
//     res.json(createdLab);
//   });
// });

module.exports = router;
