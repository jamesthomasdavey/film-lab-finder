const express = require('express');
const router = express.Router();

// import models
const Lab = require('../models/lab');
const Service = require('../models/service');
const User = require('../models/user');

// import helper functions
const isNumber = require('../validation/is-number');

// @route   ***** CHANGE THIS ***** get /api/labs/find
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

// @route   post /api/labs/new
// @desc    creates a new lab based on parameters
// @access  admin
router.post('/labs/new', (req, res) => {
  // todo: make sure that user is admin
  Lab.findOne({ name: req.body.name }).then(labWithMatchingName => {
    if (labWithMatchingName)
      return res
        .status(400)
        .json({ errors: { name: 'This name has already been registered.' } });
    Service.find({})
      .populate('serviceType')
      .populate('filmType')
      .populate('filmSize')
      .then(foundServices => {
        const labServices = foundServices.map(foundService => {
          const labService = {
            addOns: {
              hasScanAndSansDev: {},
              hasE6AndHasScanAndSansDev: {},
              hasScanOrHasDev: {},
              hasE6: {},
              hasDev: {},
              hasScan: {},
            },
          };
          labService.service = foundService._id;
          // set the allowed and dissallowed addon
          {
            if (
              foundService.serviceType.includedServiceTypes.scan &&
              !foundService.serviceType.includedServiceTypes.dev
            ) {
              labService.addOns.hasScanAndSansDev.isAllowed = true;
            }
            if (
              foundService.filmType.includedFilmTypes.e6 &&
              foundService.serviceType.includedServiceTypes.scan &&
              !foundService.serviceType.includedServiceTypes.dev
            ) {
              labService.addOns.hasE6AndHasScanAndSansDev.isAllowed = true;
            }
            if (
              foundService.serviceType.includedServiceTypes.dev ||
              foundService.serviceType.includedServiceTypes.scan
            ) {
              labService.addOns.hasScanOrHasDev.isAllowed = true;
            }
            if (foundService.filmType.includedFilmTypes.e6) {
              labService.addOns.hasE6.isAllowed = true;
            }

            if (foundService.serviceType.includedServiceTypes.dev) {
              labService.addOns.hasDev.isAllowed = true;
            }
            if (foundService.serviceType.includedServiceTypes.scan) {
              labService.addOns.hasScan.isAllowed = true;
            }
          }
          return labService;
        });
        const newLab = new Lab({
          name: req.body.name,
          ownedBy: [req.body.ownedBy],
          labServices: labServices,
        });
        if (req.body._id) newLab._id = req.body._id;
        User.findById(req.body.ownedBy).then(foundUser => {
          if (!foundUser)
            return res.status(404).json({ error: 'User not found.' });
          if (foundUser.lab)
            return res
              .status(400)
              .json({ error: 'User is already a lab owner.' });
          newLab.save().then(savedLab => {
            if (!savedLab)
              return res.status(400).json({ error: 'Unable to save lab.' });
            foundUser.lab = savedLab._id;
            foundUser.save().then(savedUser => {
              if (!savedUser)
                return res
                  .status(400)
                  .json({ error: 'Unable to save lab to user.' });
              return res.json(savedLab);
            });
          });
        });
      });
  });
});

///////////////////
// MAIN SETTINGS //
///////////////////

// @route   get /api/labs/:labId/settings
// @desc    find the lab and retrieve its name and description settings
// @access  private
router.get('/labs/:labId/settings', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json({
      name: foundLab.name,
      description: foundLab.description,
    });
  });
});

// @route   get /api/labs/:labId/settings/edit
// @desc    find the lab and retrieve its name and description settings
// @access  private
router.get('/labs/:labId/settings/edit', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json({
      name: foundLab.name,
      description: foundLab.description,
    });
  });
});

// @route   put /api/labs/:labId/settings
// @desc    find the lab and retrieve its name and description settings
// @access  private
router.put('/labs/:labId/settings', (req, res) => {
  // todo: make sure that user is lab owner
  const errors = {
    name: [],
    description: [],
  };
  if (!req.body.name.trim()) {
    errors.name.push('Name is required.');
  } else if (req.body.name.trim().length > 100) {
    errors.name.push('Name must not exceed 100 characters.');
  }
  if (req.body.description.trim().length > 300) {
    errors.description.push('Description must not exceed 300 characters.');
  }
  if (errors.name.length > 0 || errors.description.length > 0) {
    return res.status(400).json({ errors: errors });
  }
  Lab.findById(req.params.labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found.' });
    foundLab.name = req.body.name;
    foundLab.description = req.body.description;
    foundLab.save().then(savedLab => {
      if (!savedLab)
        return res.status(400).json({ error: 'Unable to save lab.' });
      return res.json({ success: true });
    });
  });
});

///////////////////
// SHIP SETTINGS //
///////////////////

// @route   get /api/labs/:labId/settings/ship
// @desc    find the lab and retrieve its ship settings
// @access  private
router.get('/labs/:labId/settings/ship', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.shipSettings);
  });
});

// @route   get /api/labs/:labId/settings/ship/edit
// @desc    find the lab and retrieve its ship settings
// @access  private
router.get('/labs/:labId/settings/ship/edit', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.shipSettings);
  });
});

// @route   put /api/labs/:labId/settings/ship
// @desc    find the lab and retrieve its ship settings
// @access  private
router.put('/labs/:labId/settings/ship', (req, res) => {
  // todo: make sure that user is lab owner
  const errors = {
    shippingPrice: [],
  };
  if (!isNumber(req.body.shippingPrice)) {
    errors.shippingPrice.push('Shipping price is required.');
  }
  if (req.body.shippingPrice < 0 || req.body.shippingPrice > 100) {
    errors.shippingPrice.push('Shipping price must be between $0 and $100');
  }
  if (errors.shippingPrice.length > 0) {
    return res.status(400).json({ errors: errors });
  }
  Lab.findById(req.params.labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found.' });
    foundLab.settings.shipSettings = {
      allowDropoff: req.body.allowDropoff,
      allowPickup: req.body.allowPickup,
      shippingPrice: req.body.shippingPrice,
    };
    foundLab.save().then(savedLab => {
      if (!savedLab)
        return res.status(404).json({ error: 'Unable to save lab.' });
      return res.json({ success: true });
    });
  });
});

////////////////////
/// DEV SETTINGS ///
////////////////////

// @route   get /api/labs/:labId/settings/dev
// @desc    find the lab and retrieve its dev settings
// @access  private
router.get('/labs/:labId/settings/dev', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.devSettings);
  });
});

// @route   get /api/labs/:labId/settings/dev/edit
// @desc    find the lab and retrieve its full dev settings
// @access  private
router.get('/labs/:labId/settings/dev/edit', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.devSettings);
  });
});

// @route   put /api/labs/:labId/settings/dev
// @desc    find the lab and update its dev settings
// @access  private
router.put('/labs/:labId/settings/dev', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    foundLab.settings.devSettings.isEnabled = req.body.devIsEnabled;
    foundLab.save().then(savedLab => {
      if (!savedLab)
        return res.status(400).json({ error: 'Unable to save lab' });
      return res.json({ success: true });
    });
  });
});

/////////////////////
/// SCAN SETTINGS ///
/////////////////////

// @route   get /api/labs/:labId/settings/scan
// @desc    find the lab and retrieve its scan settings
// @access  private
router.get('/labs/:labId/settings/scan', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.scanSettings);
  });
});

// @route   get /api/labs/:labId/settings/scan/edit
// @desc    find the lab and retrieve its full scan settings
// @access  private
router.get('/labs/:labId/settings/scan/edit', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.scanSettings);
  });
});

// @route   put /api/labs/:labId/settings/scan
// @desc    find the lab and update its scan settings
// @access  private
router.put('/labs/:labId/settings/scan', (req, res) => {
  // todo: make sure that user is lab owner
  const errors = {
    rawByOrderPrice: [],
    defaultScannerName: [],
    defaultScannerDesc: [],
    scannerBName: [],
    scannerBDesc: [],
    scannerCName: [],
    scannerCDesc: [],
    defaultScanResName: [],
    defaultScanResSfShortEdge: [],
    defaultScanResMfShortEdge: [],
    defaultScanResF4x5ShortEdge: [],
    defaultScanResF8x10ShortEdge: [],
    scanResBName: [],
    scanResBSfShortEdge: [],
    scanResBMfShortEdge: [],
    scanResBF4x5ShortEdge: [],
    scanResBF8x10ShortEdge: [],
    scanResCName: [],
    scanResCSfShortEdge: [],
    scanResCMfShortEdge: [],
    scanResCF4x5ShortEdge: [],
    scanResCF8x10ShortEdge: [],
    customScanOptionsName: [],
    defaultScanOptionName: [],
    defaultScanOptionDesc: [],
    scanOptionBName: [],
    scanOptionBDesc: [],
    scanOptionCName: [],
    scanOptionCDesc: [],
  };
  // todo: handle all possible errors
  {
    // if scanning is enabled,
    if (req.body.scanIsEnabled) {
      //// throw error if defaultscannername is not defined
      {
        if (!req.body.defaultScannerName.trim()) {
          errors.defaultScannerName.push(
            'Default scanner must have a name if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanresname is not defined
      {
        if (!req.body.defaultScanResName.trim()) {
          errors.defaultScanResName.push(
            'Default scan resolution must have a name if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanressfshortedge is not defined
      {
        if (!isNumber(req.body.defaultScanResSfShortEdge)) {
          errors.defaultScanResSfShortEdge.push(
            'Small format scan resolution must be defined if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanresmfshortedge is not defined
      {
        if (!isNumber(req.body.defaultScanResMfShortEdge)) {
          errors.defaultScanResMfShortEdge.push(
            'Medium format scan resolution must be defined if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanresf4x5shortedge is not defined
      {
        if (!isNumber(req.body.defaultScanResF4x5ShortEdge)) {
          errors.defaultScanResF4x5ShortEdge.push(
            '4x5 large format scan resolution must be defined if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanresf8x10shortedge is not defined
      {
        if (!isNumber(req.body.defaultScanResF8x10ShortEdge)) {
          errors.defaultScanResF8x10ShortEdge.push(
            '8x10 large format scan resolution must be defined if scanning is enabled.'
          );
        }
      }
      //// throw error if customscanoptionsname is not defined
      {
        if (!req.body.customScanOptionsName.trim()) {
          errors.customScanOptionsName.push(
            'Custom scan options must have a name if scanning is enabled.'
          );
        }
      }
      //// throw error if defaultscanoptionname is not defined
      {
        if (!req.body.defaultScanOptionName.trim()) {
          errors.defaultScanOptionName.push(
            'Default scan option must be defined if scanning is enabled.'
          );
        }
      }
    }
    // if raw by order is enabled,
    if (req.body.rawByOrderIsEnabled) {
      //// throw error if rawbyorderprice is not defined
      if (!isNumber(req.body.rawByOrderPrice)) {
        errors.rawByOrderPrice.push(
          'Price must be defined if raw by order is enabled.'
        );
      }
    }
    // if scannerb is enabled,
    if (req.body.scannerBIsEnabled) {
      //// throw error if scannerbname is not defined
      if (!req.body.scannerBName.trim()) {
        errors.scannerBName.push('Scanner B must have a name if enabled.');
      }
    }
    // if scannerc is enabled,
    if (req.body.scannerCIsEnabled) {
      //// throw error if scannercname is not defined
      if (!req.body.scannerCName.trim()) {
        errors.scannerCName.push('Scanner C must have a name if enabled.');
      }
    }
    // if scanresb is enabled,
    if (req.body.scanResBIsEnabled) {
      //// throw error if scanresbname is not defined
      if (!req.body.scanResBName.trim()) {
        errors.scanResBName.push(
          'Scan resolution B must have a name if enabled.'
        );
      }
      //// throw error if scanresbsfshortedge is not defined
      if (!isNumber(req.body.scanResBSfShortEdge)) {
        errors.scanResBSfShortEdge.push(
          'Small format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanresbmfshortedge is not defined
      if (!isNumber(req.body.scanResBMfShortEdge)) {
        errors.scanResBMfShortEdge.push(
          'Medium format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanresbf4x5shortedge is not defined
      if (!isNumber(req.body.scanResBF4x5ShortEdge)) {
        errors.scanResBF4x5ShortEdge.push(
          '4x5 large format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanresbf8x10shortedge is not defined
      if (!isNumber(req.body.scanResBF8x10ShortEdge)) {
        errors.scanResBF8x10ShortEdge.push(
          '8x10 large format scan resolution must be defined if enabled.'
        );
      }
    }
    // if scanresc is enabled,
    if (req.body.scanResCIsEnabled) {
      //// throw error if scanrescname is not defined
      if (!req.body.scanResCName.trim()) {
        errors.scanResCName.push(
          'Scan resolution C must have a name if enabled.'
        );
      }
      //// throw error if scanrescsfshortedge is not defined
      if (!isNumber(req.body.scanResCSfShortEdge)) {
        errors.scanResCSfShortEdge.push(
          'Small format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanrescmfshortedge is not defined
      if (!isNumber(req.body.scanResCMfShortEdge)) {
        errors.scanResCMfShortEdge.push(
          'Medium format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanrescf4x5shortedge is not defined
      if (!isNumber(req.body.scanResCF4x5ShortEdge)) {
        errors.scanResCF4x5ShortEdge.push(
          '4x5 large format scan resolution must be defined if enabled.'
        );
      }
      //// throw error if scanrescf8x10shortedge is not defined
      if (!isNumber(req.body.scanResCF8x10ShortEdge)) {
        errors.scanResCF8x10ShortEdge.push(
          '8x10 large format scan resolution must be defined if enabled.'
        );
      }
    }
    // if scanoptionb is enabled,
    if (req.body.scanOptionBIsEnabled) {
      //// throw error if scanoptionbname is not defined
      if (!req.body.scanOptionBName.trim()) {
        errors.scanOptionBName.push(
          'Custom scan option must have a name if enabled.'
        );
      }
    }
    // if scanoptionc is enabled,
    if (req.body.scanOptionCIsEnabled) {
      //// throw error if scanoptioncname is not defined
      if (!req.body.scanOptionCName.trim()) {
        errors.scanOptionCName.push(
          'Custom scan option must have a name if enabled.'
        );
      }
    }
    ///////////////
    // throw errors for any names and descriptions that are too long (if they are present at all)
    {
      if (req.body.defaultScannerName.trim()) {
        if (req.body.defaultScannerName.trim().length > 50) {
          errors.defaultScannerName.push(
            'Scanner name must not exceed 50 characters.'
          );
        }
      }
      if (req.body.defaultScannerDesc.trim()) {
        if (req.body.defaultScannerDesc.trim().length > 150) {
          errors.defaultScannerDesc.push(
            'Scanner description must not exceed 150 characters.'
          );
        }
      }
      if (req.body.scannerBName.trim()) {
        if (req.body.scannerBName.trim().length > 50) {
          errors.scannerBName.push(
            'Scanner name must not exceed 50 characters.'
          );
        }
      }
      if (req.body.scannerBDesc.trim()) {
        if (req.body.scannerBDesc.trim().length > 150) {
          errors.scannerBDesc.push(
            'Scanner description must not exceed 150 characters.'
          );
        }
      }
      if (req.body.scannerCName.trim()) {
        if (req.body.scannerCName.trim().length > 50) {
          errors.scannerCName.push(
            'Scanner name must not exceed 50 characters.'
          );
        }
      }
      if (req.body.scannerCDesc.trim()) {
        if (req.body.scannerCDesc.trim().length > 150) {
          errors.scannerCDesc.push(
            'Scanner description must not exceed 150 characters.'
          );
        }
      }
      // defaultScanResName
      if (req.body.defaultScanResName.trim()) {
        if (req.body.defaultScanResName.trim().length > 50) {
          errors.defaultScanResName.push(
            'Scan resolution name must not exceed 50 characters.'
          );
        }
      }
      // scanResBName
      if (req.body.scanResBName.trim()) {
        if (req.body.scanResBName.trim().length > 50) {
          errors.scanResBName.push(
            'Scan resolution name must not exceed 50 characters.'
          );
        }
      }
      // scanResCName
      if (req.body.scanResCName.trim()) {
        if (req.body.scanResCName.trim().length > 50) {
          errors.scanResCName.push(
            'Scan resolution name must not exceed 50 characters.'
          );
        }
      }
      // customScanOptionsName
      if (req.body.customScanOptionsName.trim()) {
        if (req.body.customScanOptionsName.trim().length > 50) {
          errors.customScanOptionsName.push(
            'Custom scan options name must not exceed 50 characters.'
          );
        }
      }
      // defaultScanOptionName
      if (req.body.defaultScanOptionName.trim()) {
        if (req.body.defaultScanOptionName.trim().length > 50) {
          errors.defaultScanOptionName.push(
            'Default scan option name must not exceed 50 characters.'
          );
        }
      }
      // defaultScanOptionDesc
      if (req.body.defaultScanOptionDesc.trim()) {
        if (req.body.defaultScanOptionDesc.trim().length > 150) {
          errors.defaultScanOptionDesc.push(
            'Default scan option description must not exceed 150 characters.'
          );
        }
      }
      // scanOptionBName
      if (req.body.scanOptionBName.trim()) {
        if (req.body.scanOptionBName.trim().length > 50) {
          errors.scanOptionBName.push(
            'Custom scan option name must not exceed 50 characters.'
          );
        }
      }
      // scanOptionBDesc
      if (req.body.scanOptionBDesc.trim()) {
        if (req.body.scanOptionBDesc.trim().length > 150) {
          errors.scanOptionBDesc.push(
            'Custom scan option description must not exceed 150 characters.'
          );
        }
      }
      // scanOptionCName
      if (req.body.scanOptionCName.trim()) {
        if (req.body.scanOptionCName.trim().length > 50) {
          errors.scanOptionCName.push(
            'Custom scan option name must not exceed 50 characters.'
          );
        }
      }
      // scanOptionCDesc
      if (req.body.scanOptionCDesc.trim()) {
        if (req.body.scanOptionCDesc.trim().length > 150) {
          errors.scanOptionCDesc.push(
            'Custom scan option description must not exceed 150 characters.'
          );
        }
      }
    }
    // throw errors for any numbers that are not within range (if there is a number at all)
    {
      // rawByOrderPrice
      if (
        isNumber(req.body.rawByOrderPrice) &&
        (req.body.rawByOrderPrice < 0.01 || req.body.rawByOrderPrice > 999.99)
      ) {
        errors.rawByOrderPrice.push(
          'Raw by order price must be between $0.01 and $999.99.'
        );
      }
      // defaultScanResSfShortEdge
      if (
        isNumber(req.body.defaultScanResSfShortEdge) &&
        (req.body.defaultScanResSfShortEdge < 100 ||
          req.body.defaultScanResSfShortEdge > 10000)
      ) {
        errors.defaultScanResSfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // defaultScanResMfShortEdge
      if (
        isNumber(req.body.defaultScanResMfShortEdge) &&
        (req.body.defaultScanResMfShortEdge < 100 ||
          req.body.defaultScanResMfShortEdge > 10000)
      ) {
        errors.defaultScanResMfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // defaultScanResF4x5ShortEdge
      if (
        isNumber(req.body.defaultScanResF4x5ShortEdge) &&
        (req.body.defaultScanResF4x5ShortEdge < 100 ||
          req.body.defaultScanResF4x5ShortEdge > 10000)
      ) {
        errors.defaultScanResF4x5ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // defaultScanResF8x10ShortEdge
      if (
        isNumber(req.body.defaultScanResF8x10ShortEdge) &&
        (req.body.defaultScanResF8x10ShortEdge < 100 ||
          req.body.defaultScanResF8x10ShortEdge > 10000)
      ) {
        errors.defaultScanResF8x10ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResBSfShortEdge
      if (
        isNumber(req.body.scanResBSfShortEdge) &&
        (req.body.scanResBSfShortEdge < 100 ||
          req.body.scanResBSfShortEdge > 10000)
      ) {
        errors.scanResBSfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResBMfShortEdge
      if (
        isNumber(req.body.scanResBMfShortEdge) &&
        (req.body.scanResBMfShortEdge < 100 ||
          req.body.scanResBMfShortEdge > 10000)
      ) {
        errors.scanResBMfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResBF4x5ShortEdge
      if (
        isNumber(req.body.scanResBF4x5ShortEdge) &&
        (req.body.scanResBF4x5ShortEdge < 100 ||
          req.body.scanResBF4x5ShortEdge > 10000)
      ) {
        errors.scanResBF4x5ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResBF8x10ShortEdge
      if (
        isNumber(req.body.scanResBF8x10ShortEdge) &&
        (req.body.scanResBF8x10ShortEdge < 100 ||
          req.body.scanResBF8x10ShortEdge > 10000)
      ) {
        errors.scanResBF8x10ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResCSfShortEdge
      if (
        isNumber(req.body.scanResCSfShortEdge) &&
        (req.body.scanResCSfShortEdge < 100 ||
          req.body.scanResCSfShortEdge > 10000)
      ) {
        errors.scanResCSfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResCMfShortEdge
      if (
        isNumber(req.body.scanResCMfShortEdge) &&
        (req.body.scanResCMfShortEdge < 100 ||
          req.body.scanResCMfShortEdge > 10000)
      ) {
        errors.scanResCMfShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResCF4x5ShortEdge
      if (
        isNumber(req.body.scanResCF4x5ShortEdge) &&
        (req.body.scanResCF4x5ShortEdge < 100 ||
          req.body.scanResCF4x5ShortEdge > 10000)
      ) {
        errors.scanResCF4x5ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
      // scanResF8x10ShortEdge
      if (
        isNumber(req.body.scanResF8x10ShortEdge) &&
        (req.body.scanResF8x10ShortEdge < 100 ||
          req.body.scanResF8x10ShortEdge > 10000)
      ) {
        errors.scanResF8x10ShortEdge.push(
          'Scan resolution short edge must be between 100px and 10,000px.'
        );
      }
    }
  }
  // if any of the errors arrays have a length of greater than 0, return the errors object
  let hasErrors = false;
  Object.keys(errors).forEach(itemName => {
    if (errors[itemName].length > 0) {
      hasErrors = true;
    }
  });
  if (hasErrors) {
    return res.status(400).json({ errors: errors });
  }
  Lab.findById(req.params.labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found' });
    foundLab.settings.scanSettings = {
      isEnabled: req.body.scanIsEnabled,
      rawByOrder: {
        isEnabled: req.body.rawByOrderIsEnabled,
        price: req.body.rawByOrderPrice,
      },
      scanners: {
        defaultScanner: {
          name: req.body.defaultScannerName.trim(),
          desc: req.body.defaultScannerDesc.trim(),
        },
        scannerB: {
          isEnabled: req.body.scannerBIsEnabled,
          name: req.body.scannerBName.trim(),
          desc: req.body.scannerBDesc.trim(),
        },
        scannerC: {
          isEnabled: req.body.scannerCIsEnabled,
          name: req.body.scannerCName.trim(),
          desc: req.body.scannerCDesc.trim(),
        },
      },
      scanResolutions: {
        defaultScanRes: {
          name: req.body.defaultScanResName.trim(),
          sfShortEdge: req.body.defaultScanResSfShortEdge,
          mfShortEdge: req.body.defaultScanResMfShortEdge,
          f4x5ShortEdge: req.body.defaultScanResF4x5ShortEdge,
          f8x10ShortEdge: req.body.defaultScanResF8x10ShortEdge,
        },
        scanResB: {
          isEnabled: req.body.scanResBIsEnabled,
          name: req.body.scanResBName.trim(),
          sfShortEdge: req.body.scanResBSfShortEdge,
          mfShortEdge: req.body.scanResBMfShortEdge,
          f4x5ShortEdge: req.body.scanResBF4x5ShortEdge,
          f8x10ShortEdge: req.body.scanResBF8x10ShortEdge,
        },
        scanResC: {
          isEnabled: req.body.scanResCIsEnabled,
          name: req.body.scanResCName.trim(),
          sfShortEdge: req.body.scanResCSfShortEdge,
          mfShortEdge: req.body.scanResCMfShortEdge,
          f4x5ShortEdge: req.body.scanResCF4x5ShortEdge,
          f8x10ShortEdge: req.body.scanResF8x10ShortEdge,
        },
      },
      customScanOptions: {
        name: req.body.customScanOptionsName.trim(),
        defaultScanOption: {
          name: req.body.defaultScanOptionName.trim(),
          desc: req.body.defaultScanOptionDesc.trim(),
        },
        scanOptionB: {
          isEnabled: req.body.scanOptionBIsEnabled,
          name: req.body.scanOptionBName.trim(),
          desc: req.body.scanOptionBDesc.trim(),
        },
        scanOptionC: {
          isEnabled: req.body.scanOptionCIsEnabled,
          name: req.body.scanOptionCName.trim(),
          desc: req.body.scanOptionCDesc.trim(),
        },
      },
    };
    foundLab.save().then(savedLab => {
      if (!savedLab)
        return res.status(400).json({ error: 'Unable to save lab' });
      return res.json({ success: true });
    });
  });
});

////////////////////////////////
/// SERVICE PRICING SETTINGS ///
////////////////////////////////

// @route   get /api/labs/:labId/settings/service-pricing
// @desc    find the lab and retrieve its service pricing settings
// @access  private
router.get('/labs/:labId/settings/service-pricing', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId)
    .populate({
      path: 'labServices.service',
      populate: { path: 'serviceType' },
    })
    .populate({
      path: 'labServices.service',
      populate: { path: 'filmType' },
    })
    .populate({
      path: 'labServices.service',
      populate: { path: 'filmSize' },
    })
    .then(foundLab => {
      // check what the lab allows
      const labAllowsDev = foundLab.settings.devSettings.isEnabled;
      const labAllowsScan = foundLab.settings.scanSettings.isEnabled;
      const labAllowsRawScansByRoll = !foundLab.settings.scanSettings.rawByOrder
        .isEnabled;
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      // get names for columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const defaultScanResName =
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res';
      const scanResBName =
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B';
      const scanResCName =
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C';
      const defaultScanOptionName =
        foundLab.settings.scanSettings.customScanOptions.defaultScanOption
          .name || 'Default Scan Option';
      const scanOptionBName =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.name ||
        'Scan Option B';
      const scanOptionCName =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.name ||
        'Scan Option C';
      // build out columns; if column is not enabled, it will not appear
      const columns = {
        base: { name: 'Base', isAllowed: true },
        receiveUndeveloped: {
          name: 'Receive Undeveloped',
          isAllowed: labAllowsDev,
        },
        receiveUncut: {
          name: 'Receive Uncut',
          isAllowed: labAllowsScan,
        },
        receiveSleeved: {
          name: 'Receive Sleeved',
          isAllowed: labAllowsScan,
        },
        receiveMounted: {
          name: 'Receive Mounted',
          isAllowed: labAllowsScan,
        },
        returnUncut: {
          name: 'Return Uncut',
          isAllowed: true,
        },
        returnSleeved: { name: 'Return Sleeved', isAllowed: true },
        returnMounted: { name: 'Return Mounted', isAllowed: true },
        noPushPull: { name: 'No Push/Pull', isAllowed: labAllowsDev },
        push1: { name: 'Push +1', isAllowed: labAllowsDev },
        push2: { name: 'Push +2', isAllowed: labAllowsDev },
        push3: { name: 'Push +3', isAllowed: labAllowsDev },
        pull1: { name: 'Pull -1', isAllowed: labAllowsDev },
        pull2: { name: 'Pull -2', isAllowed: labAllowsDev },
        pull3: { name: 'Pull -3', isAllowed: labAllowsDev },
        jpegScans: { name: 'Jpeg Scans', isAllowed: labAllowsScan },
        rawScans: {
          name: 'Raw Scans',
          isAllowed: labAllowsScan && labAllowsRawScansByRoll,
        },
        defaultScanner: { name: defaultScannerName, isAllowed: labAllowsScan },
        scannerB: {
          name: scannerBName,
          isAllowed: labAllowsScan && labAllowsScannerB,
        },
        scannerC: {
          name: scannerCName,
          isAllowed: labAllowsScan && labAllowsScannerC,
        },
        defaultScanRes: { name: defaultScanResName, isAllowed: labAllowsScan },
        scanResB: {
          name: scanResBName,
          isAllowed: labAllowsScan && labAllowsScanResB,
        },
        scanResC: {
          name: scanResCName,
          isAllowed: labAllowsScan && labAllowsScanResC,
        },
        defaultScanOption: {
          name: defaultScanOptionName,
          isAllowed: labAllowsScan,
        },
        scanOptionB: {
          name: scanOptionBName,
          isAllowed: labAllowsScan && labAllowsScanOptionB,
        },
        scanOptionC: {
          name: scanOptionCName,
          isAllowed: labAllowsScan && labAllowsScanOptionC,
        },
      };
      // build out rows; if row is not supported by the lab, it won't appear
      const rows = [];
      foundLab.labServices.forEach(foundLabService => {
        const hasScanAndSansDev =
          foundLabService.addOns.hasScanAndSansDev.isAllowed;
        const hasE6AndHasScanAndSansDev =
          foundLabService.addOns.hasE6AndHasScanAndSansDev.isAllowed;
        const hasScanOrHasDev =
          foundLabService.addOns.hasScanOrHasDev.isAllowed;
        const hasE6 = foundLabService.addOns.hasE6.isAllowed;
        const hasDev = foundLabService.addOns.hasDev.isAllowed;
        const hasScan = foundLabService.addOns.hasScan.isAllowed;
        let labCanSupport = true;
        // if the service includes dev, make sure that the lab can support that
        if (hasDev) {
          if (!labAllowsDev) {
            labCanSupport = false;
          }
        }
        // if the service includes scan, make sure that the lab can support that
        if (hasScan) {
          if (!labAllowsScan) {
            labCanSupport = false;
          }
        }
        // if the lab can support the row, we'll add the row
        if (labCanSupport && foundLabService.isEnabled) {
          // isAllowed is based on whether the addon is relevant to the service
          // it is automatically "true" if it's free, otherwise the row wouldn't be added
          // isEnabled is based on the lab's actual setting
          // it is automatically "true" if it's free, otherwise the row wouldn't be added
          rows.push({
            serviceId: foundLabService.service._id,
            serviceType: foundLabService.service.serviceType.name,
            filmType: foundLabService.service.filmType.name,
            filmSize: foundLabService.service.filmSize.name,
            base: {
              isAllowed: true,
              isEnabled: true,
              price: foundLabService.price,
            },
            receiveUndeveloped: {
              isAllowed: true,
              isEnabled: true,
              price: 0,
            },
            receiveUncut: {
              isAllowed: true,
              isEnabled: true,
              price: 0,
            },
            receiveSleeved: {
              isAllowed: hasScanAndSansDev,
              isEnabled:
                foundLabService.addOns.hasScanAndSansDev.receiveSleeved
                  .isEnabled,
              price:
                foundLabService.addOns.hasScanAndSansDev.receiveSleeved.price,
            },
            receiveMounted: {
              isAllowed: hasE6AndHasScanAndSansDev,
              isEnabled:
                foundLabService.addOns.hasE6AndHasScanAndSansDev.receiveMounted
                  .isEnabled,
              price:
                foundLabService.addOns.hasE6AndHasScanAndSansDev.receiveMounted
                  .price,
            },
            returnUncut: {
              isAllowed: true,
              isEnabled: true,
              price: 0,
            },
            returnSleeved: {
              isAllowed: hasScanOrHasDev,
              isEnabled:
                foundLabService.addOns.hasScanOrHasDev.returnSleeved.isEnabled,
              price: foundLabService.addOns.hasScanOrHasDev.returnSleeved.price,
            },
            returnMounted: {
              isAllowed: hasE6,
              isEnabled: foundLabService.addOns.hasE6.returnMounted.isEnabled,
              price: foundLabService.addOns.hasE6.returnMounted.price,
            },
            noPushPull: {
              isAllowed: serviceIncludesDev && columns.noPushPull.isAllowed,
              isEnabled: true,
              price: 0,
            },
            push1: {
              isAllowed: serviceIncludesDev && columns.push1.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push1.isEnabled,
              price: foundLabService.addOns.hasDev.push1.price,
            },
            push2: {
              isAllowed: serviceIncludesDev && columns.push2.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push2.isEnabled,
              price: foundLabService.addOns.hasDev.push2.price,
            },
            push3: {
              isAllowed: serviceIncludesDev && columns.push3.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push3.isEnabled,
              price: foundLabService.addOns.hasDev.push3.price,
            },
            pull1: {
              isAllowed: serviceIncludesDev && columns.pull1.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull1.isEnabled,
              price: foundLabService.addOns.hasDev.pull1.price,
            },
            pull2: {
              isAllowed: serviceIncludesDev && columns.pull2.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull2.isEnabled,
              price: foundLabService.addOns.hasDev.pull2.price,
            },
            pull3: {
              isAllowed: serviceIncludesDev && columns.pull3.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull3.isEnabled,
              price: foundLabService.addOns.hasDev.pull3.price,
            },
            jpegScans: {
              isAllowed: serviceIncludesScan && columns.jpegScans.isAllowed,
              isEnabled: true,
              price: 0,
            },
            rawScans: {
              isAllowed: serviceIncludesScan && columns.rawScans.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.rawScans.isEnabled,
              price: foundLabService.addOns.hasScan.rawScans.price,
            },
            defaultScanner: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanner.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scannerB: {
              isAllowed: serviceIncludesScan && columns.scannerB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
              price: foundLabService.addOns.hasScan.scannerB.price,
            },
            scannerC: {
              isAllowed: serviceIncludesScan && columns.scannerC.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
              price: foundLabService.addOns.hasScan.scannerC.price,
            },
            defaultScanRes: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanRes.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scanResB: {
              isAllowed: serviceIncludesScan && columns.scanResB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scanResB.isEnabled,
              price: foundLabService.addOns.hasScan.scanResB.price,
            },
            scanResC: {
              isAllowed: serviceIncludesScan && columns.scanResC.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scanResC.isEnabled,
              price: foundLabService.addOns.hasScan.scanResC.price,
            },
            defaultScanOption: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanOption.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scanOptionB: {
              isAllowed: serviceIncludesScan && columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
              price: foundLabService.addOns.hasScan.scanOptionB.price,
            },
            scanOptionC: {
              isAllowed: serviceIncludesScan && columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
              price: foundLabService.addOns.hasScan.scanOptionB.price,
            },
          });
        }
      });
      return res.json({ columns: columns, rows: rows });
    });
});

// @router  get /api/labs/:labId/settings/service-pricing/edit
// @desc    find the lab and retrieve its full service pricing settings
// @access  private
router.get('/labs/:labId/settings/service-pricing/edit', (req, res) => {
  Lab.findById(req.params.labId)
    .populate({
      path: 'labServices.service',
      populate: { path: 'serviceType' },
    })
    .populate({
      path: 'labServices.service',
      populate: { path: 'filmType' },
    })
    .populate({
      path: 'labServices.service',
      populate: { path: 'filmSize' },
    })
    .then(foundLab => {
      // get the things that the lab allows
      const labAllowsDev = foundLab.settings.devSettings.isEnabled;
      const labAllowsScan = foundLab.settings.scanSettings.isEnabled;
      const labAllowsRawScansByRoll = !foundLab.settings.scanSettings.rawByOrder
        .isEnabled;
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      // get names for the custom defined columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const defaultScanResName =
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res';
      const scanResBName =
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B';
      const scanResCName =
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C';
      const defaultScanOptionName =
        foundLab.settings.scanSettings.customScanOptions.defaultScanOption
          .name || 'Default Scan Option';
      const scanOptionBName =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.name ||
        'Scan Option B';
      const scanOptionCName =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.name ||
        'Scan Option C';
      // create an object of warnings that will be added to the columns
      const warnings = {
        base: [],
        receiveUndeveloped: [],
        receiveUncut: [],
        receiveSleeved: [],
        receiveMounted: [],
        returnUncut: [],
        returnSleeved: [],
        returnMounted: [],
        noPushPull: [],
        push1: [],
        push2: [],
        push3: [],
        pull1: [],
        pull2: [],
        pull3: [],
        jpegScans: [],
        rawScans: [],
        defaultScanner: [],
        scannerB: [],
        scannerC: [],
        defaultScanRes: [],
        scanResB: [],
        scanResC: [],
        defaultScanOption: [],
        scanOptionB: [],
        scanOptionC: [],
      };
      // modify the warnings object where warnings apply
      {
        if (!labAllowsDev) {
          const message = 'You must enable developing to offer this add-on.';
          warnings.push1.push(message);
          warnings.push2.push(message);
          warnings.push3.push(message);
          warnings.pull1.push(message);
          warnings.pull2.push(message);
          warnings.pull3.push(message);
        }
        if (!labAllowsScan) {
          const message = 'You must enable scanning to offer this add-on.';
          warnings.receiveSleeved.push(message);
          warnings.receiveMounted.push(message);
          warnings.jpegScans.push(message);
          warnings.rawScans.push(message);
          warnings.defaultScanner.push(message);
          warnings.scannerB.push(message);
          warnings.scannerC.push(message);
          warnings.defaultScanRes.push(message);
          warnings.scanResB.push(message);
          warnings.scanResC.push(message);
          warnings.defaultScanOption.push(message);
          warnings.scanOptionB.push(message);
          warnings.scanOptionC.push(message);
        }
        if (!labAllowsRawScansByRoll) {
          warnings.rawScans.push(
            'You must disable raw scans by order to offer this add-on.'
          );
        }
        if (!labAllowsScannerB) {
          warnings.scannerB.push(
            `You must enable the scanner "${scannerBName}" to offer this add-on.`
          );
        }
        if (!labAllowsScannerC) {
          warnings.scannerC.push(
            `You must enable the scanner "${scannerCName}" to offer this add-on.`
          );
        }
        if (!labAllowsScanResB) {
          warnings.scanResB.push(
            `You must enable the scan resolution "${scanResBName}" to offer this add-on.`
          );
        }
        if (!labAllowsScanResC) {
          warnings.scanResC.push(
            `You must enable the scan resolution "${scanResCName}" to offer this add-on.`
          );
        }
        if (!labAllowsScanOptionB) {
          warnings.scanOptionB.push(
            `You must enable the scan option "${scanOptionBName}" to offer this add-on.`
          );
        }
        if (!labAllowsScanOptionC) {
          warnings.scanOptionC.push(
            `You must enable the scan option "${scanOptionCName}" to offer this add-on.`
          );
        }
      }
      // build columns
      const columns = {
        base: {
          name: 'Base',
          warning: {
            isPresent: warnings.base.length > 0,
            messages: warnings.base,
          },
        },
        receiveUndeveloped: {
          name: 'Receive Undeveloped',
          warning: {
            isPresent: warnings.receiveUndeveloped.length > 0,
            messages: warnings.receiveUndeveloped,
          },
        },
        receiveUncut: {
          name: 'Receive Uncut',
          warning: {
            isPresent: warnings.receiveUncut.length > 0,
            messages: warnings.receiveUncut,
          },
        },
        receiveSleeved: {
          name: 'Receive Sleeved',
          warning: {
            isPresent: warnings.receiveSleeved.length > 0,
            messages: warnings.receiveSleeved,
          },
        },
        receiveMounted: {
          name: 'Receive Mounted',
          warning: {
            isPresent: warnings.receiveMounted.length > 0,
            messages: warnings.receiveMounted,
          },
        },
        returnUncut: {
          name: 'Return Uncut',
          warning: {
            isPresent: warnings.returnUnsleeved.length > 0,
            messages: warnings.returnUnsleeved,
          },
        },
        returnSleeved: {
          name: 'Return Sleeved',
          warning: {
            isPresent: warnings.returnSleeved.length > 0,
            messages: warnings.returnSleeved,
          },
        },
        returnMounted: {
          name: 'Return Mounted',
          warning: {
            isPresent: warnings.returnMounted.length > 0,
            messages: warnings.returnMounted,
          },
        },
        noPushPull: {
          name: 'No Push/Pull',
          warning: {
            isPresent: warnings.noPushPull.length > 0,
            messages: warnings.noPushPull,
          },
        },
        push1: {
          name: 'Push +1',
          warning: {
            isPresent: warnings.push1.length > 0,
            messages: warnings.push1,
          },
        },
        push2: {
          name: 'Push +2',
          warning: {
            isPresent: warnings.push2.length > 0,
            messages: warnings.push2,
          },
        },
        push3: {
          name: 'Push +3',
          warning: {
            isPresent: warnings.push3.length > 0,
            messages: warnings.push3,
          },
        },
        pull1: {
          name: 'Pull -1',
          warning: {
            isPresent: warnings.pull1.length > 0,
            messages: warnings.pull1,
          },
        },
        pull2: {
          name: 'Pull -2',
          warning: {
            isPresent: warnings.pull2.length > 0,
            messages: warnings.pull2,
          },
        },
        pull3: {
          name: 'Pull -3',
          warning: {
            isPresent: warnings.pull3.length > 0,
            messages: warnings.pull3,
          },
        },
        jpegScans: {
          name: 'Jpeg Scans',
          warning: {
            isPresent: warnings.jpegScans.length > 0,
            messages: warnings.jpegScans,
          },
        },
        rawScans: {
          name: 'Raw Scans',
          warning: {
            isPresent: warnings.rawScans.length > 0,
            messages: warnings.rawScans,
          },
        },
        defaultScanner: {
          name: defaultScannerName,
          warning: {
            isPresent: warnings.defaultScanner.length > 0,
            messages: warnings.defaultScanner,
          },
        },
        scannerB: {
          name: scannerBName,
          warning: {
            isPresent: warnings.scannerB.length > 0,
            messages: warnings.scannerB,
          },
        },
        scannerC: {
          name: scannerCName,
          warning: {
            isPresent: warnings.scannerC.length > 0,
            messages: warnings.scannerC,
          },
        },
        defaultScanRes: {
          name: defaultScanResName,
          warning: {
            isPresent: warnings.defaultScanRes.length > 0,
            messages: warnings.defaultScanRes,
          },
        },
        scanResB: {
          name: scanResBName,
          warning: {
            isPresent: warnings.scanResB.length > 0,
            messages: warnings.scanResB,
          },
        },
        scanResC: {
          name: scanResCName,
          warning: {
            isPresent: warnings.scanResC.length > 0,
            messages: warnings.scanResC,
          },
        },
        defaultScanOption: {
          name: defaultScanOptionName,
          warning: {
            isPresent: warnings.defaultScanOption.length > 0,
            messages: warnings.defaultScanOption,
          },
        },
        scanOptionB: {
          name: scanOptionBName,
          warning: {
            isPresent: warnings.scanOptionB.length > 0,
            messages: warnings.scanOptionB,
          },
        },
        scanOptionC: {
          name: scanOptionCName,
          warning: {
            isPresent: warnings.scanOptionC.length > 0,
            messages: warnings.scanOptionC,
          },
        },
      };
      // build rows
      const rows = foundLab.labServices.map(foundLabService => {
        const hasScanAndSansDev =
          foundLabService.addOns.hasScanAndSansDev.isAllowed;
        const hasE6AndHasScanAndSansDev =
          foundLabService.addOns.hasE6AndHasScanAndSansDev.isAllowed;
        const hasScanOrHasDev =
          foundLabService.addOns.hasScanOrHasDev.isAllowed;
        const hasE6 = foundLabService.addOns.hasE6.isAllowed;
        const hasDev = foundLabService.addOns.hasDev.isAllowed;
        const hasScan = foundLabService.addOns.hasScan.isAllowed;
        const unsupportedServiceTypes = [];
        if (hasDev && !labAllowsDev) {
          unsupportedServiceTypes.push('Developing');
        }
        if (hasScan && !labAllowsScan) {
          unsupportedServiceTypes.push('Scanning');
        }
        return {
          serviceId: foundLabService.service._id,
          serviceType: foundLabService.service.serviceType.name,
          warning: {
            isPresent: unsupportedServiceTypes.length > 0,
            unsupportedServiceTypes: unsupportedServiceTypes,
          },
          filmType: foundLabService.service.filmType.name,
          filmSize: foundLabService.service.filmSize.name,
          base: {
            isAllowed: true,
            isEnabled: foundLabService.isEnabled,
            price: foundLabService.price,
          },
          receiveUndeveloped: {
            isAllowed: hasDev,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          receiveUncut: {
            isAllowed: hasScanAndSansDev,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          receiveSleeved: {
            isAllowed: hasScanAndSansDev,
            isEnabled:
              foundLabService.addOns.hasScanAndSansDev.receiveSleeved.isEnabled,
            price:
              foundLabService.addOns.hasScanAndSansDev.receiveSleeved.price,
          },
          receiveMounted: {
            isAllowed: hasE6AndHasScanAndSansDev,
            isEnabled:
              foundLabService.addOns.hasE6AndHasScanAndSansDev.receiveMounted
                .isEnabled,
            price:
              foundLabService.addOns.hasE6AndHasScanAndSansDev.receiveMounted
                .price,
          },
          returnUncut: {
            isAllowed: true,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          returnSleeved: {
            isAllowed: hasScanOrHasDev,
            isEnabled:
              foundLabService.addOns.hasScanOrHasDev.returnSleeved.isEnabled,
            price: foundLabService.addOns.hasScanOrHasDev.returnSleeved.price,
          },
          returnMounted: {
            isAllowed: hasE6,
            isEnabled: foundLabService.addOns.hasE6.returnMounted.isEnabled,
            price: foundLabService.addOns.hasE6.returnMounted.price,
          },
          noPushPull: {
            isAllowed: hasDev,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          push1: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.push1.isEnabled,
            price: foundLabService.addOns.hasDev.push1.price,
          },
          push2: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.push2.isEnabled,
            price: foundLabService.addOns.hasDev.push2.price,
          },
          push3: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.push3.isEnabled,
            price: foundLabService.addOns.hasDev.push3.price,
          },
          pull1: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.pull1.isEnabled,
            price: foundLabService.addOns.hasDev.pull1.price,
          },
          pull2: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.pull2.isEnabled,
            price: foundLabService.addOns.hasDev.pull2.price,
          },
          pull3: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.hasDev.pull3.isEnabled,
            price: foundLabService.addOns.hasDev.pull3.price,
          },
          jpegScans: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          rawScans: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.rawScans.isEnabled,
            price: foundLabService.addOns.hasScan.rawScans.price,
          },
          defaultScanner: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scannerB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
            price: foundLabService.addOns.hasScan.scannerB.price,
          },
          scannerC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
            price: foundLabService.addOns.hasScan.scannerC.price,
          },
          defaultScanRes: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scanResB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scanResB.isEnabled,
            price: foundLabService.addOns.hasScan.scanResB.price,
          },
          scanResC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scanResC.isEnabled,
            price: foundLabService.addOns.hasScan.scanResC.price,
          },
          defaultScanOption: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scanOptionB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
            price: foundLabService.addOns.hasScan.scanOptionB.price,
          },
          scanOptionC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
            price: foundLabService.addOns.hasScan.scanOptionB.price,
          },
        };
      });
      // send columns and rows
      return res.json({ columns: columns, rows: rows });
    });
});

// @route   put /api/labs/:labId/settings/service-pricing
// @desc    find the lab and update its service pricing settings
// @access  private
router.put('/labs/:labId/settings/service-pricing', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    const errors = [];
    // cycle through the reqbody labservices (recursively)
    const applyChangesToLab = reqBodyLabServices => {
      if (reqBodyLabServices.length === 0) {
        // todo: if the errors array isn't empty, send it back
        if (errors.length > 0) {
          return res.status(400).json({ errors: errors });
        } else {
          // todo: otherwise, save and redirect
          foundLab.save().then(data => {
            return res.json({ success: true });
          });
        }
      } else {
        Service.findById(reqBodyLabServices[0].serviceId)
          .populate('serviceType')
          .populate('filmType')
          .populate('filmSize')
          .then(foundService => {
            // create an error object
            const serviceError = {
              serviceId: reqBodyLabServices[0].serviceId.toString(),
              messages: {
                base: [],
                receiveSleeved: [],
                receiveMounted: [],
                returnSleeved: [],
                returnMounted: [],
                push1: [],
                push2: [],
                push3: [],
                pull1: [],
                pull2: [],
                pull3: [],
                rawScans: [],
                scannerB: [],
                scannerC: [],
                scanResB: [],
                scanResC: [],
                scanOptionB: [],
                scanOptionC: [],
              },
            };
            // add necessary errors
            {
              // check what the service includes
              const serviceIncludesDev =
                foundService.serviceType.includedServiceTypes.dev;
              const serviceIncludesScan =
                foundService.serviceType.includedServiceTypes.scan;
              const serviceIncludesE6 =
                foundService.filmType.includedFilmTypes.e6;
              const validatePrice = (addOn, addOnName) => {
                // if there's no price, add error
                if (!isNumber(addOn.price)) {
                  serviceError.messages[addOnName].push(
                    'Price is required when enabling this cell.'
                  );
                  // if price is above 999.99, add error
                } else if (addOn.price > 999.99) {
                  serviceError.messages[addOnName].push(
                    'Price must not exceed $999.99.'
                  );
                  // if price is below 0, add error
                } else if (addOn.price < 0) {
                  serviceError.messages[addOnName].push(
                    'Price must not be below $0.'
                  );
                }
              };
              // if enabling this service, validate the base price
              if (reqBodyLabServices[0].base.isEnabled) {
                validatePrice(reqBodyLabServices[0].base, 'base');
              }
              // if enabling receive sleeved and the referenced service includes developing, add an error
              if (reqBodyLabServices[0].receiveSleeved.isEnabled) {
                serviceError.messages.receiveSleeved.push(
                  'Sleeved film cannot be developed.'
                );
              } else {
                validatePrice(
                  reqBodyLabServices[0].receiveSleeved,
                  'receiveSleeved'
                );
              }
              // if enabling receive mounted and the referenced service includes developing or not e6, add an error
              if (reqBodyLabServices[0].receiveMounted.isEnabled) {
                if (!serviceIncludesE6 || serviceIncludesDev) {
                  if (!serviceIncludesE6) {
                    serviceError.messages.receiveMounted.push(
                      'Only E6 film may be mounted.'
                    );
                  }
                  if (!serviceIncludesDev) {
                    serviceError.messages.receiveMounted.push(
                      'Mounted film cannot be developed.'
                    );
                  }
                } else {
                  validatePrice(
                    reqBodyLabServices[0].receiveMounted,
                    'receiveMounted'
                  );
                }
              }
              // if enabling return sleeved, validate the price
              if (reqBodyLabServices[0].returnSleeved.isEnabled) {
                validatePrice(
                  reqBodyLabServices[0].returnSleeved,
                  'returnSleeved'
                );
              }
              // possible errors for returning mounted
              if (reqBodyLabServices[0].returnMounted.isEnabled) {
                if (!serviceIncludesE6) {
                  serviceError.messages.returnMounted.push(
                    'Only slide film may be mounted.'
                  );
                } else {
                  validatePrice(
                    reqBodyLabServices[0].returnMounted,
                    'returnMounted'
                  );
                }
              }
              // possible errors for push1
              if (reqBodyLabServices[0].push1.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push1.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].push1, 'push1');
                }
              }
              // possible errors for push2
              if (reqBodyLabServices[0].push2.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push2.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].push2, 'push2');
                }
              }
              // possible errors for push3
              if (reqBodyLabServices[0].push3.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push3.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].push3, 'push3');
                }
              }
              // possible errors for pull1
              if (reqBodyLabServices[0].pull1.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull1.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].pull1, 'pull1');
                }
              }
              // possible errors for pull2
              if (reqBodyLabServices[0].pull2.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull2.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].pull2, 'pull2');
                }
              }
              // possible errors for pull3
              if (reqBodyLabServices[0].pull3.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull3.push(
                    'Service type does not include developing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].pull3, 'pull3');
                }
              }
              // possible error for raw scans
              if (reqBodyLabServices[0].rawScans.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.rawScans.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].rawScans, 'rawScans');
                }
              }
              // possible error for scannerb
              if (reqBodyLabServices[0].scannerB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerB.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].scannerB, 'scannerB');
                }
              }
              // possible error for scannerc
              if (reqBodyLabServices[0].scannerC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerC.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  validatePrice(reqBodyLabServices[0].scannerC, 'scannerC');
                }
              }
              // possible error for scanresb
              if (reqBodyLabServices[0].scanResB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanResB.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].scanResB, 'scanResB');
                }
              }
              // possible error for scanresc
              if (reqBodyLabServices[0].scanResC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanResC.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].scanResC, 'scanResC');
                }
              }
              // possible error for scanoptionb
              if (reqBodyLabServices[0].scanOptionB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanOptionB.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(
                    reqBodyLabServices[0].scanOptionB,
                    'scanOptionB'
                  );
                }
              }
              // possible error for scanoptionc
              if (reqBodyLabServices[0].scanOptionC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanOptionC.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  // validate the price
                  validatePrice(
                    reqBodyLabServices[0].scanOptionC,
                    'scanOptionC'
                  );
                }
              }
            }
            // create a "has error messages" variable to decide if we should push the serviceerror object
            let hasErrorMessages = false;
            Object.keys(serviceError.messages).forEach(itemName => {
              if (serviceError.messages[itemName].length > 0) {
                hasErrorMessages = true;
              }
            });
            // push the serviceError if there are error messages
            if (hasErrorMessages) {
              errors.push(serviceError);
            }
            // update the appropriate lab service if there are no error messages
            else {
              // todo: find the corresponding lab service
              foundLab.labServices.forEach((labService, index) => {
                if (
                  labService.service.toString() ===
                  reqBodyLabServices[0].serviceId.toString()
                ) {
                  // update all the stuff
                  {
                    // service itself
                    foundLab.labServices[index].isEnabled =
                      reqBodyLabServices[0].base.isEnabled;
                    foundLab.labServices[index].price =
                      reqBodyLabServices[0].base.price;

                    // receive sleeved
                    foundLab.labServices[
                      index
                    ].addOns.hasScanAndSansDev.receiveSleeved.isEnabled =
                      reqBodyLabServices[0].receiveSleeved.isEnabled;

                    foundLab.labServices[
                      index
                    ].addOns.hasScanAndSansDev.receiveSleeved.price =
                      reqBodyLabServices[0].receiveSleeved.price;

                    // receive mounted
                    foundLab.labServces[
                      index
                    ].addOns.hasE6AndHasScanAndSansDev.receiveMounted.isEnabled =
                      reqBodyLabServices[0].receiveMounted.isEnabled;

                    foundLab.labServces[
                      index
                    ].addOns.hasE6AndHasScanAndSansDev.receiveMounted.price =
                      reqBodyLabServices[0].receiveMounted.price;

                    // return sleeved
                    foundLab.labServices[
                      index
                    ].addOns.hasScanOrHasDev.returnSleeved.isEnabled =
                      reqBodyLabServices[0].returnSleeved.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScanOrHasDev.returnSleeved.price =
                      reqBodyLabServices[0].returnSleeved.price;

                    // return mounted
                    foundLab.labServices[
                      index
                    ].addOns.hasE6.returnMounted.isEnabled =
                      reqBodyLabServices[0].returnMounted.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasE6.returnMounted.price =
                      reqBodyLabServices[0].returnMounted.price;

                    // push 1
                    foundLab.labServices[index].addOns.hasDev.push1.isEnabled =
                      reqBodyLabServices[0].push1.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.push1.price =
                      reqBodyLabServices[0].push1.price;

                    // push 2
                    foundLab.labServices[index].addOns.hasDev.push2.isEnabled =
                      reqBodyLabServices[0].push2.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.push2.price =
                      reqBodyLabServices[0].push2.price;

                    // push 3
                    foundLab.labServices[index].addOns.hasDev.push3.isEnabled =
                      reqBodyLabServices[0].push3.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.push3.price =
                      reqBodyLabServices[0].push3.price;

                    // pull 1
                    foundLab.labServices[index].addOns.hasDev.pull1.isEnabled =
                      reqBodyLabServices[0].pull1.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.pull1.price =
                      reqBodyLabServices[0].pull1.price;

                    // pull 2
                    foundLab.labServices[index].addOns.hasDev.pull2.isEnabled =
                      reqBodyLabServices[0].pull2.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.pull2.price =
                      reqBodyLabServices[0].pull2.price;

                    // pull 3
                    foundLab.labServices[index].addOns.hasDev.pull3.isEnabled =
                      reqBodyLabServices[0].pull3.isEnabled;
                    foundLab.labServices[index].addOns.hasDev.pull3.price =
                      reqBodyLabServices[0].pull3.price;

                    // raw scans
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.rawScans.isEnabled =
                      reqBodyLabServices[0].rawScans.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.rawScans.price =
                      reqBodyLabServices[0].rawScans.price;

                    // scanner b
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.isEnabled =
                      reqBodyLabServices[0].scannerB.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scannerB.price =
                      reqBodyLabServices[0].scannerB.price;

                    // scanner c
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.isEnabled =
                      reqBodyLabServices[0].scannerC.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scannerC.price =
                      reqBodyLabServices[0].scannerC.price;

                    // scan res b
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanResB.isEnabled =
                      reqBodyLabServices[0].scanResB.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scanResB.price =
                      reqBodyLabServices[0].scanResB.price;

                    // scan res c
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanResC.isEnabled =
                      reqBodyLabServices[0].scanResC.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scanResC.price =
                      reqBodyLabServices[0].scanResC.price;

                    // scan option b
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanOptionB.isEnabled =
                      reqBodyLabServices[0].scanOptionB.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanOptionB.price =
                      reqBodyLabServices[0].scanOptionB.price;

                    // scan option c
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanOptionC.isEnabled =
                      reqBodyLabServices[0].scanOptionC.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scanOptionC.price =
                      reqBodyLabServices[0].scanOptionC.price;
                  }
                }
              });
            }
            const newArray = [...reqBodyLabServices];
            newArray.shift();
            applyChangesToLab(newArray);
          });
      }
    };
    applyChangesToLab(req.body.labServices);
  });
});

module.exports = router;
