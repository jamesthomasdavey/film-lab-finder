const express = require('express');
const router = express.Router();

const sortServices = require('../helpers/sortServices');

const Lab = require('../models/lab');
const Service = require('../models/service');
const ServiceType = require('../models/serviceType');

// @route   get /api/labs/find
// @desc    returns all available labs, based on an array of services
// @access  public
router.get('/labs/find', (req, res) => {
  const compiledLabs = [];
  const findFromService = services => {
    if (services.length === 0) {
      // return the compiled labs array with duplicates removed
      return res.json([...new Set(compiledLabs)]);
    }
    // find all the labs that have this service enabled
    Lab.find({
      'services.service': services[0]._id,
      'services.isEnabled': true,
    }).then(foundLabs => {
      // find that specific service within the lab
      foundLabs.forEach(foundLab => {
        foundLab.services.forEach(service => {
          // push the necessary info into the
          if (service.service.toString() === services[0]._id.toString()) {
            compiledLabs.push({
              labId: foundLab._id,
              labName: foundLab.name,
              price: service.price,
            });
          }
        });
      });
      // recursively call this function
      const newServices = [...services];
      newServices.shift();
      findFromService(newServices);
    });
  };
  findFromService(req.body.services);
});

// @route   get /api/labs/:labId/edit-services
// @desc    returns all available services, noting which ones the lab offers
// @access  private
router.get('/labs/:labId/services/edit', (req, res) => {
  ///
});

// @route   post /api/labs/new
// @desc    creates a new lab based on parameters
// @access  admin
router.post('/labs/new', (req, res) => {
  Service.find({})
    .populate('serviceType')
    .then(foundServices => {
      res.json(foundServices[0]);
    });
});

// @route   get /api/labs/:labId/settings/ship
// @desc    find the lab and retrieve its ship settings
// @access  private
router.get('/labs/:labId/settings/ship', (req, res) => {
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.shipSettings);
  });
});

// @route   get /api/labs/:labId/settings/dev
// @desc    find the lab and retrieve its dev settings
// @access  private
router.get('/labs/:labId/settings/dev', (req, res) => {
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.serviceSettings.dev);
  });
});

// @route   get /api/labs/:labId/settings/scan
// @desc    find the lab and retrieve its scan settings
// @access  private
router.get('/labs/:labId/settings/scan', (req, res) => {
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.serviceSettings.scan);
  });
});

// @route   get /api/labs/:labId/settings/scan
// @desc    find the lab and retrieve its scan settings
// @access  private
router.get('/labs/:labId/settings/scan', (req, res) => {
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.serviceSettings.scan);
  });
});

// @route   get /api/labs/:labId/settings/print
// @desc    find the lab and retrieve its print settings
// @access  private
router.get('/labs/:labId/settings/print', (req, res) => {
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.serviceSettings.print);
  });
});

// @route   get /api/labs/:labId/settings/service-pricing
// @desc    find the lab and retrieve its service pricing settings
// @access  private
router.get('/labs/:labId/settings/service-pricing', (req, res) => {
  Lab.findById(req.params.labId)
    .populate({ path: 'services.service', populate: { path: 'serviceType' } })
    .populate({ path: 'services.service', populate: { path: 'filmType' } })
    .populate({ path: 'services.service', populate: { path: 'filmSize' } })
    .then(foundLab => {
      const supportedServices = [];
      foundLab.services.forEach(foundLabService => {
        let labCanSupport = true;
        if (foundLabService.service.includedServiceTypes.dev) {
          if (!foundLab.serviceSettings.dev.isEnabled) {
            labCanSupport = false;
          }
        }
        if (foundLabService.service.includedServiceTypes.scan) {
          if (!foundLab.serviceSettings.scan.isEnabled) {
            labCanSupport = false;
          }
        }
        if (foundLabService.service.includedServiceTypes.print) {
          if (!foundLab.serviceSettings.print.isEnabled) {
            labCanSupport = false;
          }
        }
        if (labCanSupport) {
          supportedServices.push(foundLabService);
        }
      });
      res.json(supportedServices);
    });
});

module.exports = router;
