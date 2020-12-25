const express = require('express');
const router = express.Router();

// import models
const Lab = require('../models/lab');
const Service = require('../models/service');
const User = require('../models/user');

// import helper functions
const isNumber = require('../validation/is-number');

const maximums = {
  labNameLength: 100,
  labDescriptionLength: 300,
  shippingPrice: 100,
  additionalScanners: 3,
  additionalResolutions: 12,
  scannerNameLength: 50,
  scannerDescLength: 150,
  scanResNameLength: 50,
  scanResDescLength: 150,
  rawByOrderPrice: 999.99,
};

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

// @route   get /api/labs/:labId/name
// @desc    gets the name of the lab
// @access  admin or lab owner
router.get('/labs/:labId/name', (req, res) => {
  Lab.findById(req.params.labId)
    .then(foundLab => {
      if (!foundLab) return res.status(404).json({ error: 'Lab not found' });
      return res.json({
        name: foundLab.name,
      });
    })
    .catch(err => {
      return res.status(404).json({ error: 'Lab not found' });
    });
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
        // add an _id if it's defined
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
      name: {
        value: foundLab.name,
        errors: [],
        maxLength: maximums.labNameLength,
      },
      description: {
        value: foundLab.description,
        errors: [],
        maxLength: maximums.labDescriptionLength,
      },
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
  } else if (req.body.name.trim().length > maximums.labNameLength) {
    errors.name.push(
      `Name must not exceed ${maximums.labNameLength} characters.`
    );
  }
  if (req.body.description.trim().length > maximums.labDescriptionLength) {
    errors.description.push(
      `Description must not exceed ${maximums.labDescriptionLength} characters.`
    );
  }
  if (errors.name.length > 0 || errors.description.length > 0) {
    return res.status(400).json({ errors: errors });
  }
  Lab.findById(req.params.labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found.' });
    foundLab.name = req.body.name.trim();
    foundLab.description = req.body.description.trim();
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
    return res.json({
      allowDropoff: {
        checked: foundLab.settings.shipSettings.allowDropoff,
        errors: [],
      },
      allowPickup: {
        checked: foundLab.settings.shipSettings.allowPickup,
        errors: [],
      },
      shippingPrice: {
        value: foundLab.settings.shipSettings.shippingPrice.toFixed(2),
        errors: [],
        minValue: 0,
        maxValue: maximums.shippingPrice,
      },
    });
  });
});

// @route   put /api/labs/:labId/settings/ship
// @desc    find the lab and retrieve its ship settings
// @access  private
router.put('/labs/:labId/settings/ship', (req, res) => {
  // todo: make sure that user is lab owner
  const errors = {
    allowDropoff: [],
    allowPickup: [],
    shippingPrice: [],
  };
  if (
    !isNumber(Number(req.body.shippingPrice)) ||
    req.body.shippingPrice === ''
  ) {
    errors.shippingPrice.push('Shipping price is required.');
  }
  if (
    Number(req.body.shippingPrice).toFixed() < 0 ||
    Number(req.body.shippingPrice).toFixed() > maximums.shippingPrice
  ) {
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
      shippingPrice: Number(req.body.shippingPrice).toFixed(2),
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
    return res.json({
      isEnabled: { checked: foundLab.settings.devSettings.isEnabled },
    });
  });
});

// @route   put /api/labs/:labId/settings/dev
// @desc    find the lab and update its dev settings
// @access  private
router.put('/labs/:labId/settings/dev', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    foundLab.settings.devSettings.isEnabled = req.body.isEnabled;
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
    return res.json({
      isEnabled: {
        checked: foundLab.settings.scanSettings.isEnabled,
      },
      rawByOrder: {
        isEnabled: {
          checked: foundLab.settings.scanSettings.rawByOrder.isEnabled,
        },
        price: {
          value: Number(
            foundLab.settings.scanSettings.rawByOrder.price
          ).toFixed(2),
          maxValue: maximums.rawByOrderPrice,
        },
      },
      scanners: {
        defaultScanner: {
          name: {
            value: foundLab.settings.scanSettings.scanners.defaultScanner.name,
            maxLength: maximums.scannerNameLength,
          },
          desc: {
            value: foundLab.settings.scanSettings.scanners.defaultScanner.desc,
            maxLength: maximums.scannerDescLength,
          },
        },
        additionalScanners: foundLab.settings.scanSettings.scanners.additionalScanners.map(
          scanner => {
            return {
              scannerId: scanner.scannerId,
              isEnabled: { checked: scanner.isEnabled },
              name: {
                value: scanner.name,
                maxLength: maximums.scannerNameLength,
              },
              desc: {
                value: scanner.desc,
                maxLength: maximums.scannerDescLength,
              },
            };
          }
        ),
      },
      scanResolutions: {
        defaultScanRes: {
          name: {
            value:
              foundLab.settings.scanSettings.scanResolutions.defaultScanRes
                .name,
            maxLength: maximums.scanResNameLength,
          },
          desc: {
            value:
              foundLab.settings.scanSettings.scanResolutions.defaultScanRes
                .desc,
            maxLength: maximums.scanResDescLength,
          },
          hasRawByDefault: {
            checked:
              foundLab.settings.scanSettings.scanResolutions.defaultScanRes
                .hasRawByDefault,
          },
        },
        additionalResolutions: foundLab.settings.scanSettings.scanResolutions.additionalResolutions.map(
          resolution => {
            return {
              resId: resolution.resId,
              isEnabled: { checked: resolution.isEnabled },
              name: {
                value: resolution.name,
                maxLength: maximums.scanResNameLength,
              },
              desc: {
                value: resolution.desc,
                maxLength: maximums.scanResDescLength,
              },
              hasRawByDefault: {
                checked: resolution.hasRawByDefault,
              },
            };
          }
        ),
      },
    });
  });
});

// @route   put /api/labs/:labId/settings/scan
// @desc    find the lab and update its scan settings
// @access  private
router.put('/labs/:labId/settings/scan', (req, res) => {
  // todo: make sure that user is lab owner
  const reqScanSettings = req.body;

  const errors = {
    rawByOrder: {
      price: [],
    },
    scanners: {
      defaultScanner: {
        name: [],
        desc: [],
      },
      additionalScanners: reqScanSettings.scanners.additionalScanners.map(
        () => {
          return {
            name: [],
            desc: [],
          };
        }
      ),
    },
    scanResolutions: {
      defaultScanRes: {
        name: [],
        desc: [],
      },
      additionalResolutions: reqScanSettings.scanResolutions.additionalResolutions.map(
        () => {
          return {
            name: [],
            desc: [],
          };
        }
      ),
    },
  };
  // handle all possible errors
  {
    // if there are more than x additional scanners
    if (
      reqScanSettings.scanners.additionalScanners.length >
      maximums.additionalScanners
    ) {
      return res
        .status(400)
        .json({ error: 'Maximum scan resolutions exceeded.' });
    }
    // if there are more than X additional scan resolutions,
    if (
      reqScanSettings.scanResolutions.additionalResolutions.length >
      maximums.additionalResolutions
    ) {
      return res
        .status(400)
        .json({ error: 'Maximum scan resolutions exceeded.' });
    }
    // check for duplicate scannerIds
    {
      const scannerIdDuplicates = {};
      reqScanSettings.scanners.additionalScanners.forEach(scanner => {
        if (scannerIdDuplicates[`scannerId${scanner.scannerId}`]) {
          return res
            .status(400)
            .json({ error: 'Duplicate scanner IDs found.' });
        }
      });
    }
    // check for duplicate resIds
    {
      const resIdDuplicates = {};
      reqScanSettings.scanResolutions.additionalResolutions.forEach(
        resolution => {
          if (resIdDuplicates[`resId${resolution.resId}`]) {
            return res
              .status(400)
              .json({ error: 'Duplicate resolution IDs found.' });
          } else {
            resIdDuplicates[`resId${resolution.resId}`] = true;
          }
        }
      );
    }
    // if scanning is enabled,
    if (reqScanSettings.isEnabled) {
      //// throw error if default scanner name is not defined
      {
        if (!reqScanSettings.scanners.defaultScanner.name.trim()) {
          errors.scanners.defaultScanner.name.push(
            'Default scanner must have a name if scanning is enabled.'
          );
        }
      }
      //// throw error if default scan resolution name is not defined
      {
        if (!reqScanSettings.scanResolutions.defaultScanRes.name.trim()) {
          errors.scanResolutions.defaultScanRes.name.push(
            'Default scan resolution must have a name if scanning is enabled.'
          );
        }
      }
    }
    // if raw by order is enabled,
    if (reqScanSettings.rawByOrder.isEnabled) {
      //// throw error if raw by order price is not defined
      if (!isNumber(Number(reqScanSettings.rawByOrder.price))) {
        errors.rawByOrder.price.push(
          'Price must be defined if Raw By Order is enabled.'
        );
      }
    }
    // if any of the additional scanners exist,
    reqScanSettings.scanners.additionalScanners.forEach((scanner, i) => {
      // throw an error if the scanner name is not defined
      if (!scanner.name.trim()) {
        errors.scanners.additionalScanners[i].name.push(
          'Scanner must have a name. Remove this scanner if no longer needed.'
        );
      } else {
        // throw an error if the scanner name is not unique
        let nameIsUnique = true;
        if (scanner.name === reqScanSettings.scanners.defaultScanner.name) {
          nameIsUnique = false;
        } else {
          reqScanSettings.scanners.additionalScanners.forEach(
            (otherScanner, otherScannerIndex) => {
              if (i > otherScannerIndex) {
                if (
                  scanner.name === otherScanner.name &&
                  scanner.scannerId !== otherScanner.scannerId
                ) {
                  nameIsUnique = false;
                }
              }
            }
          );
        }
        if (!nameIsUnique) {
          errors.scanners.additionalScanners[i].name.push(
            'Scanner name must be unique.'
          );
        }
      }
    });
    // if any of the additional scan resolutions exist,
    reqScanSettings.scanResolutions.additionalResolutions.forEach(
      (resolution, i) => {
        // throw an error if the scan resolution name is not defined
        if (!resolution.name.trim()) {
          errors.scanResolutions.additionalResolutions[i].name.push(
            'Scan resolution must have a name. Remove this resolution if no longer needed.'
          );
        } else {
          // throw an error if the scan resolution name is not unique
          let nameIsUnique = true;
          if (
            resolution.name ===
            reqScanSettings.scanResolutions.defaultScanRes.name
          ) {
            nameIsUnique = false;
          } else {
            reqScanSettings.scanResolutions.additionalResolutions.forEach(
              (otherRes, otherResIndex) => {
                if (i > otherResIndex) {
                  if (
                    resolution.name === otherRes.name &&
                    resolution.resId !== otherRes.resId
                  ) {
                    nameIsUnique = false;
                  }
                }
              }
            );
          }
          if (!nameIsUnique) {
            errors.scanResolutions.additionalResolutions[i].name.push(
              'Scan resolution name must be unique.'
            );
          }
        }
      }
    );
    // throw errors for any names and descriptions that are too long (if they are present at all)
    {
      // defaultscanner name
      if (reqScanSettings.scanners.defaultScanner.name.trim()) {
        if (
          reqScanSettings.scanners.defaultScanner.name.trim().length >
          maximums.scannerNameLength
        ) {
          errors.scanners.defaultScanner.name.push(
            `Scanner name must not exceed ${maximums.scannerNameLength} characters.`
          );
        }
      }
      // defaultscanner desc
      if (reqScanSettings.scanners.defaultScanner.desc.trim()) {
        if (
          reqScanSettings.scanners.defaultScanner.desc.trim().length >
          maximums.scannerDescLength
        ) {
          errors.scanners.defaultScanner.desc.push(
            `Scanner description must not exceed ${maximums.scannerDescLength} characters.`
          );
        }
      }
      // additional scanners
      reqScanSettings.scanners.additionalScanners.forEach((scanner, i) => {
        if (scanner.name.trim().length > maximums.scannerNameLength) {
          errors.scanners.additionalScanners[i].name.push(
            `Scanner name must not exceed ${maximums.scannerNameLength} characters.`
          );
        }
        if (scanner.desc.trim().length > maximums.scannerDescLength) {
          errors.scanners.additionalScanners[i].desc.push(
            `Scanner description must not exceed ${maximums.scannerDescLength} characters.`
          );
        }
      });
      // defaultScanRes name
      if (reqScanSettings.scanResolutions.defaultScanRes.name.trim()) {
        if (
          reqScanSettings.scanResolutions.defaultScanRes.name.trim().length >
          maximums.scanResNameLength
        ) {
          errors.scanResolutions.defaultScanRes.name.push(
            `Scan resolution name must not exceed ${maximums.scanResNameLength} characters.`
          );
        }
      }
      // defaultScanRes desc
      if (reqScanSettings.scanResolutions.defaultScanRes.desc.trim()) {
        if (
          reqScanSettings.scanResolutions.defaultScanRes.desc.trim().length >
          maximums.scanResDescLength
        ) {
          errors.scanResolutions.defaultScanRes.desc.push(
            `Scan resolution description must not exceed ${maximums.scanResDescLength} characters.`
          );
        }
      }
      // additional reses
      reqScanSettings.scanResolutions.additionalResolutions.forEach(
        (resolution, i) => {
          if (resolution.name.trim().length > maximums.scanResNameLength) {
            errors.scanResolutions.additionalResolutions[i].name.push(
              `Scan resolution name must not exceed ${maximums.scanResNameLength} characters.`
            );
          }
          if (resolution.desc.trim().length > maximums.scanResDescLength) {
            errors.scanResoltuions.additionalResolutions[i].desc.push(
              `Scan resolution description must not exceed ${maximums.scanResDescLength} characters.`
            );
          }
        }
      );
    }
    // throw errors for any numbers that are not within range (if there is a number at all)
    {
      // rawByOrderPrice
      if (
        isNumber(reqScanSettings.rawByOrder.price) &&
        (req.body.rawByOrderPrice < 0.01 ||
          req.body.rawByOrderPrice > maximums.rawByOrderPrice)
      ) {
        errors.rawByOrderPrice.push(
          `Raw by order price must be between $0.01 and $${maximums.rawByOrderPrice}.`
        );
      }
    }
  }
  // if any of the errors arrays have a length of greater than 0, return the errors object
  const hasErrors = () => {
    if (errors.rawByOrder.price.length > 0) {
      return true;
    }
    if (errors.scanners.defaultScanner.name.length > 0) {
      return true;
    }
    if (errors.scanners.defaultScanner.desc.length > 0) {
      return true;
    }
    {
      let scannerErrors = false;
      errors.scanners.additionalScanners.forEach(scanner => {
        if (scanner.name.length > 0) {
          scannerErrors = true;
        }
        if (scanner.desc.length > 0) {
          scannerErrors = true;
        }
      });
      if (scannerErrors) return true;
    }
    if (errors.scanResolutions.defaultScanRes.name.length > 0) {
      return true;
    }
    if (errors.scanResolutions.defaultScanRes.desc.length > 0) {
      return true;
    }
    {
      let scanResErrors = false;
      errors.scanResolutions.additionalResolutions.forEach(resolution => {
        if (resolution.name.length > 0) {
          scanResErrors = true;
        }
        if (resolution.desc.length > 0) {
          scanResErrors = true;
        }
      });
      if (scanResErrors) return true;
    }
    return false;
  };
  if (hasErrors()) {
    return res.status(400).json({ errors: errors });
  }
  Lab.findById(req.params.labId).then(foundLab => {
    if (!foundLab) return res.status(404).json({ error: 'Lab not found' });
    foundLab.settings.scanSettings = {
      isEnabled: reqScanSettings.isEnabled,
      rawByOrder: {
        isEnabled: reqScanSettings.rawByOrder.isEnabled,
        price: reqScanSettings.rawByOrder.price,
      },
      scanners: {
        defaultScanner: {
          name: reqScanSettings.scanners.defaultScanner.name.trim(),
          desc: reqScanSettings.scanners.defaultScanner.desc.trim(),
        },
        additionalScanners: reqScanSettings.scanners.additionalScanners.map(
          scanner => {
            return {
              scannerId: scanner.scannerId,
              isEnabled: scanner.isEnabled,
              name: scanner.name,
              desc: scanner.desc,
            };
          }
        ),
      },
      scanResolutions: {
        defaultScanRes: {
          name: reqScanSettings.scanResolutions.defaultScanRes.name.trim(),
          desc: reqScanSettings.scanResolutions.defaultScanRes.desc.trim(),
          hasRawByDefault:
            reqScanSettings.scanResolutions.defaultScanRes.hasRawByDefault,
        },
        additionalResolutions: reqScanSettings.scanResolutions.additionalResolutions.map(
          resolution => {
            return {
              resId: resolution.resId,
              isEnabled: resolution.isEnabled,
              name: resolution.name,
              desc: resolution.desc,
              hasRawByDefault: resolution.hasRawByDefault,
            };
          }
        ),
      },
    };

    foundLab.labServices.forEach((labService, i) => {
      // default scanner
      const defaultScannerCustomResolutions = [];
      reqScanSettings.scanResolutions.additionalResolutions.forEach(
        (reqResolution, index) => {
          ////// for each requested custom resolution, check if it already exists or not
          let resolutionAlreadyExists = false;
          let resolutionIndex;
          labService.addOns.hasScan.defaultScanner.scanResolutions.forEach(
            foundResolution => {
              if (foundResolution.resId === reqResolution.resId) {
                resolutionAlreadyExists = true;
                resolutionIndex = index;
              }
            }
          );
          if (resolutionAlreadyExists) {
            defaultScannerCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled:
                labService.addOns.hasScan.defaultScanner.scanResolutions[
                  resolutionIndex
                ].isEnabled,
              price:
                labService.addOns.hasScan.defaultScanner.scanResolutions[
                  resolutionIndex
                ].price,
            });
          } else {
            defaultScannerCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled: reqResolution.isEnabled,
              price: reqResolution.price,
            });
          }
        }
      );
      foundLab.labServices[
        i
      ].addOns.hasScan.defaultScanner.scanResolutions = defaultScannerCustomResolutions;
      // scanner b
      const scannerBCustomResolutions = [];
      reqScanSettings.scanResolutions.additionalResolutions.forEach(
        (reqResolution, index) => {
          ////// for each requested custom resolution, check if it already exists or not
          let resolutionAlreadyExists = false;
          let resolutionIndex;
          labService.addOns.hasScan.scannerB.scanResolutions.forEach(
            foundResolution => {
              if (foundResolution.resId === reqResolution.resId) {
                resolutionAlreadyExists = true;
                resolutionIndex = index;
              }
            }
          );
          if (resolutionAlreadyExists) {
            scannerBCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled:
                labService.addOns.hasScan.scannerB.scanResolutions[
                  resolutionIndex
                ].isEnabled,
              price:
                labService.addOns.hasScan.scannerB.scanResolutions[
                  resolutionIndex
                ].price,
            });
          } else {
            scannerBCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled: reqResolution.isEnabled,
              price: reqResolution.price,
            });
          }
        }
      );
      foundLab.labServices[
        i
      ].addOns.hasScan.scannerB.scanResolutions = scannerBCustomResolutions;
      // scanner c
      const scannerCCustomResolutions = [];
      reqScanSettings.scanResolutions.additionalResolutions.forEach(
        (reqResolution, index) => {
          ////// for each requested custom resolution, check if it already exists or not
          let resolutionAlreadyExists = false;
          let resolutionIndex;
          labService.addOns.hasScan.scannerC.scanResolutions.forEach(
            foundResolution => {
              if (foundResolution.resId === reqResolution.resId) {
                resolutionAlreadyExists = true;
                resolutionIndex = index;
              }
            }
          );
          if (resolutionAlreadyExists) {
            scannerCCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled:
                labService.addOns.hasScan.scannerC.scanResolutions[
                  resolutionIndex
                ].isEnabled,
              price:
                labService.addOns.hasScan.scannerC.scanResolutions[
                  resolutionIndex
                ].price,
            });
          } else {
            scannerCCustomResolutions.push({
              resId: reqResolution.resId,
              isEnabled: reqResolution.isEnabled,
              price: reqResolution.price,
            });
          }
        }
      );
      foundLab.labServices[
        i
      ].addOns.hasScan.scannerC.scanResolutions = scannerCCustomResolutions;
    });

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
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanResD =
        foundLab.settings.scanSettings.scanResolutions.scanResD.isEnabled;
      const labAllowsScanResE =
        foundLab.settings.scanSettings.scanResolutions.scanResE.isEnabled;
      const labAllowsScanResF =
        foundLab.settings.scanSettings.scanResolutions.scanResF.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      // get names for columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const defaultScannerDefaultScanResName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const defaultScannerScanResBName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const defaultScannerScanResCName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const defaultScannerScanResDName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const defaultScannerScanResEName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const defaultScannerScanResFName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerBDefaultScanResName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const scannerBScanResBName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const scannerBScanResCName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const scannerBScanResDName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const scannerBScanResEName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const scannerBScanResFName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const scannerCDefaultScanResName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const scannerCScanResBName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const scannerCScanResCName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const scannerCScanResDName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const scannerCScanResEName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const scannerCScanResFName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
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
        defaultScanner: { name: defaultScannerName, isAllowed: labAllowsScan },
        defaultScannerDefaultScanRes: {
          name: defaultScannerDefaultScanResName,
          isAllowed: labAllowsScan,
        },
        defaultScannerScanResB: {
          name: defaultScannerScanResBName,
          isAllowed: labAllowsScan && labAllowsScanResB,
        },
        defaultScannerScanResC: {
          name: defaultScannerScanResCName,
          isAllowed: labAllowsScan && labAllowsScanResC,
        },
        defaultScannerScanResD: {
          name: defaultScannerScanResDName,
          isAllowed: labAllowsScan && labAllowsScanResD,
        },
        defaultScannerScanResE: {
          name: defaultScannerScanResEName,
          isAllowed: labAllowsScan && labAllowsScanResE,
        },
        defaultScannerScanResF: {
          name: defaultScannerScanResFName,
          isAllowed: labAllowsScan && labAllowsScanResF,
        },
        scannerB: {
          name: scannerBName,
          isAllowed: labAllowsScan && labAllowsScannerB,
        },
        scannerBDefaultScanRes: {
          name: scannerBDefaultScanResName,
          isAllowed: labAllowsScannerB,
        },
        scannerBscanResB: {
          name: scannerBScanResBName,
          isAllowed: labAllowsScannerB && labAllowsScanResB,
        },
        scannerBscanResC: {
          name: scannerBScanResCName,
          isAllowed: labAllowsScannerB && labAllowsScanResC,
        },
        scannerBscanResD: {
          name: scannerBScanResDName,
          isAllowed: labAllowsScannerB && labAllowsScanResD,
        },
        scannerBscanResE: {
          name: scannerBScanResEName,
          isAllowed: labAllowsScannerB && labAllowsScanResE,
        },
        scannerBscanResF: {
          name: scannerBScanResFName,
          isAllowed: labAllowsScannerB && labAllowsScanResF,
        },
        scannerC: {
          name: scannerCName,
          isAllowed: labAllowsScan && labAllowsScannerC,
        },
        scannerCDefaultScanRes: {
          name: scannerCDefaultScanResName,
          isAllowed: labAllowsScannerC,
        },
        scannerCscanResB: {
          name: scannerCScanResBName,
          isAllowed: labAllowsScannerC && labAllowsScanResB,
        },
        scannerCscanResC: {
          name: scannerCScanResCName,
          isAllowed: labAllowsScannerC && labAllowsScanResC,
        },
        scannerCscanResD: {
          name: scannerCScanResDName,
          isAllowed: labAllowsScannerC && labAllowsScanResD,
        },
        scannerCscanResE: {
          name: scannerCScanResEName,
          isAllowed: labAllowsScannerC && labAllowsScanResE,
        },
        scannerCscanResF: {
          name: scannerCScanResFName,
          isAllowed: labAllowsScannerC && labAllowsScanResF,
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
              isAllowed: hasDev && columns.noPushPull.isAllowed,
              isEnabled: true,
              price: 0,
            },
            push1: {
              isAllowed: hasDev && columns.push1.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push1.isEnabled,
              price: foundLabService.addOns.hasDev.push1.price,
            },
            push2: {
              isAllowed: hasDev && columns.push2.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push2.isEnabled,
              price: foundLabService.addOns.hasDev.push2.price,
            },
            push3: {
              isAllowed: hasDev && columns.push3.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.push3.isEnabled,
              price: foundLabService.addOns.hasDev.push3.price,
            },
            pull1: {
              isAllowed: hasDev && columns.pull1.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull1.isEnabled,
              price: foundLabService.addOns.hasDev.pull1.price,
            },
            pull2: {
              isAllowed: hasDev && columns.pull2.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull2.isEnabled,
              price: foundLabService.addOns.hasDev.pull2.price,
            },
            pull3: {
              isAllowed: hasDev && columns.pull3.isAllowed,
              isEnabled: foundLabService.addOns.hasDev.pull3.isEnabled,
              price: foundLabService.addOns.hasDev.pull3.price,
            },
            defaultScanner: {
              isAllowed: hasScan && columns.defaultScanner.isAllowed,
              isEnabled: true,
              price: 0,
            },
            defaultScannerDefaultScanRes: {
              isAllowed:
                hasScan && columns.defaultScannerDefaultScanRes.isAllowed,
              isEnabled: true,
              price: 0,
            },
            defaultScannerScanResB: {
              isAllowed: hasScan && columns.defaultScannerScanResB.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResB.isEnabled,
              price:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResB.price,
            },
            defaultScannerScanResC: {
              isAllowed: hasScan && columns.defaultScannerScanResC.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResC.isEnabled,
              price:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResC.price,
            },
            defaultScannerScanResD: {
              isAllowed: hasScan && columns.defaultScannerScanResD.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResD.isEnabled,
              price:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResD.price,
            },
            defaultScannerScanResE: {
              isAllowed: hasScan && columns.defaultScannerScanResE.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResE.isEnabled,
              price:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResE.price,
            },
            defaultScannerScanResF: {
              isAllowed: hasScan && columns.defaultScannerScanResF.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResF.isEnabled,
              price:
                foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                  .scanResF.price,
            },
            scannerB: {
              isAllowed: hasScan && columns.scannerB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
              price: foundLabService.addOns.hasScan.scannerB.price,
            },
            scannerBDefaultScanRes: {
              isAllowed: hasScan && columns.scannerBDefaultScanRes.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
              price: 0,
            },
            scannerBScanResB: {
              isAllowed: hasScan && columns.scannerBScanResB.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResB
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResB
                  .price,
            },
            scannerBScanResC: {
              isAllowed: hasScan && columns.scannerBScanResC.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResC
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResC
                  .price,
            },
            scannerBScanResD: {
              isAllowed: hasScan && columns.scannerBScanResD.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResD
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResD
                  .price,
            },
            scannerBScanResE: {
              isAllowed: hasScan && columns.scannerBScanResE.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResE
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResE
                  .price,
            },
            scannerBScanResF: {
              isAllowed: hasScan && columns.scannerBScanResF.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResF
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResF
                  .price,
            },
            scannerC: {
              isAllowed: hasScan && columns.scannerC.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
              price: foundLabService.addOns.hasScan.scannerC.price,
            },

            scannerCDefaultScanRes: {
              isAllowed: hasScan && columns.scannerCDefaultScanRes.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
              price: 0,
            },
            scannerCScanResB: {
              isAllowed: hasScan && columns.scannerCScanResB.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResB
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResB
                  .price,
            },
            scannerCScanResC: {
              isAllowed: hasScan && columns.scannerCScanResC.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResC
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResC
                  .price,
            },
            scannerCScanResD: {
              isAllowed: hasScan && columns.scannerCScanResD.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResD
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResD
                  .price,
            },
            scannerCScanResE: {
              isAllowed: hasScan && columns.scannerCScanResE.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResE
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResE
                  .price,
            },
            scannerCScanResF: {
              isAllowed: hasScan && columns.scannerCScanResF.isAllowed,
              isEnabled:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResF
                  .isEnabled,
              price:
                foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResF
                  .price,
            },
            defaultScanOption: {
              isAllowed: hasScan && columns.defaultScanOption.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scanOptionB: {
              isAllowed: hasScan && columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
              price: foundLabService.addOns.hasScan.scanOptionB.price,
            },
            scanOptionC: {
              isAllowed: hasScan && columns.scanOptionB.isAllowed,
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
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanResD =
        foundLab.settings.scanSettings.scanResolutions.scanResD.isEnabled;
      const labAllowsScanResE =
        foundLab.settings.scanSettings.scanResolutions.scanResE.isEnabled;
      const labAllowsScanResF =
        foundLab.settings.scanSettings.scanResolutions.scanResF.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      // get names for the custom defined columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const defaultScannerDefaultScanResName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const defaultScannerScanResBName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const defaultScannerScanResCName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const defaultScannerScanResDName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const defaultScannerScanResEName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const defaultScannerScanResFName = `${defaultScannerName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerBDefaultScanResName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const scannerBScanResBName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const scannerBScanResCName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const scannerBScanResDName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const scannerBScanResEName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const scannerBScanResFName = `${scannerBName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const scannerCDefaultScanResName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.defaultScanRes.name ||
        'Default Scan Res'
      }`;
      const scannerCScanResBName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
        'Scan Res B'
      }`;
      const scannerCScanResCName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
        'Scan Res C'
      }`;
      const scannerCScanResDName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
        'Scan Res D'
      }`;
      const scannerCScanResEName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
        'Scan Res E'
      }`;
      const scannerCScanResFName = `${scannerCName}: ${
        foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
        'Scan Res F'
      }`;
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
        defaultScanner: [],
        defaultScannerDefaultScanRes: [],
        defaultScannerScanResB: [],
        defaultScannerScanResC: [],
        defaultScannerScanResD: [],
        defaultScannerScanResE: [],
        defaultScannerScanResF: [],
        scannerB: [],
        scannerBDefaultScanRes: [],
        scannerBScanResB: [],
        scannerBScanResC: [],
        scannerBScanResD: [],
        scannerBScanResE: [],
        scannerBScanResF: [],
        scannerC: [],
        scannerCDefaultScanRes: [],
        scannerCScanResB: [],
        scannerCScanResC: [],
        scannerCScanResD: [],
        scannerCScanResE: [],
        scannerCScanResF: [],
        defaultScanOption: [],
        scanOptionB: [],
        scanOptionC: [],
      };
      // modify the warnings object where warnings apply
      {
        if (!labAllowsDev) {
          const message = 'You must enable developing to offer this add-on.';
          warning.receiveUndeveloped.push(message);
          warning.noPushPull.push(message);
          warnings.push1.push(message);
          warnings.push2.push(message);
          warnings.push3.push(message);
          warnings.pull1.push(message);
          warnings.pull2.push(message);
          warnings.pull3.push(message);
        }
        if (!labAllowsScan) {
          const message = 'You must enable scanning to offer this add-on.';
          warnings.receiveUncut.push(message);
          warnings.receiveSleeved.push(message);
          warnings.receiveMounted.push(message);
          warnings.jpegScans.push(message);
          warnings.rawScans.push(message);
          warnings.defaultScanner.push(message);
          warnings.defaultScannerDefaultScanRes.push(message);
          warnings.defaultScannerScanResB.push(message);
          warnings.defaultScannerScanResC.push(message);
          warnings.defaultScannerScanResD.push(message);
          warnings.defaultScannerScanResE.push(message);
          warnings.defaultScannerScanResF.push(message);
          warnings.scannerB.push(message);
          warnings.scannerBDefaultScanRes.push(message);
          warnings.scannerBScanResB.push(message);
          warnings.scannerBScanResC.push(message);
          warnings.scannerBScanResD.push(message);
          warnings.scannerBScanResE.push(message);
          warnings.scannerBScanResF.push(message);
          warnings.scannerC.push(message);
          warnings.scannerCDefaultScanRes.push(message);
          warnings.scannerCScanResB.push(message);
          warnings.scannerCScanResC.push(message);
          warnings.scannerCScanResD.push(message);
          warnings.scannerCScanResE.push(message);
          warnings.scannerCScanResF.push(message);
          warnings.defaultScanOption.push(message);
          warnings.scanOptionB.push(message);
          warnings.scanOptionC.push(message);
        }
        if (!labAllowsDev && !labAllowsScan) {
          const message = `You must enable developing or scanning to offer this add-on.`;
          warnings.returnUncut.push(message);
          warnings.returnSleeved.push(message);
          warnings.returnMounted.push(message);
        }
        if (!labAllowsScannerB) {
          const message = `You must enable the scanner "${scannerBName}" to offer this add-on.`;
          warnings.scannerB.push(message);
          warnings.scannerBDefaultScanRes.push(message);
          warnings.scannerBScanResB.push(message);
          warnings.scannerBScanResC.push(message);
          warnings.scannerBScanResD.push(message);
          warnings.scannerBScanResE.push(message);
          warnings.scannerBScanResF.push(message);
        }
        if (!labAllowsScannerC) {
          const message = `You must enable the scanner "${scannerCName}" to offer this add-on.`;
          warnings.scannerC.push(message);
          warnings.scannerCDefaultScanRes.push(message);
          warnings.scannerCScanResB.push(message);
          warnings.scannerCScanResC.push(message);
          warnings.scannerCScanResD.push(message);
          warnings.scannerCScanResE.push(message);
          warnings.scannerCScanResF.push(message);
        }
        if (!labAllowsScanResB) {
          const message = `You must enable the scan resolution "${
            foundLab.settings.scanSettings.scanResolutions.scanResB.name ||
            'Scan Res B'
          }" to offer this add-on.`;
          warnings.defaultScannerScanResB.push(message);
          warnings.scannerBScanResB.push(message);
          warnings.scannerCScanResB.push(message);
        }
        if (!labAllowsScanResC) {
          const message = `You must enable the scan resolution "${
            foundLab.settings.scanSettings.scanResolutions.scanResC.name ||
            'Scan Res C'
          }" to offer this add-on.`;
          warnings.defaultScannerScanResC.push(message);
          warnings.scannerBScanResC.push(message);
          warnings.scannerCScanResC.push(message);
        }
        if (!labAllowsScanResD) {
          const message = `You must enable the scan resolution "${
            foundLab.settings.scanSettings.scanResolutions.scanResD.name ||
            'Scan Res D'
          }" to offer this add-on.`;
          warnings.defaultScannerScanResD.push(message);
          warnings.scannerBScanResD.push(message);
          warnings.scannerCScanResD.push(message);
        }
        if (!labAllowsScanResE) {
          const message = `You must enable the scan resolution "${
            foundLab.settings.scanSettings.scanResolutions.scanResE.name ||
            'Scan Res E'
          }" to offer this add-on.`;
          warnings.defaultScannerScanResE.push(message);
          warnings.scannerBScanResE.push(message);
          warnings.scannerCScanResE.push(message);
        }
        if (!labAllowsScanResF) {
          const message = `You must enable the scan resolution "${
            foundLab.settings.scanSettings.scanResolutions.scanResF.name ||
            'Scan Res F'
          }" to offer this add-on.`;
          warnings.defaultScannerScanResF.push(message);
          warnings.scannerBScanResF.push(message);
          warnings.scannerCScanResF.push(message);
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
            isPresent: warnings.returnUncut.length > 0,
            messages: warnings.returnUncut,
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
        defaultScanner: {
          name: defaultScannerName,
          warning: {
            isPresent: warnings.defaultScanner.length > 0,
            messages: warnings.defaultScanner,
          },
        },
        defaultScannerDefaultScanRes: {
          name: defaultScannerDefaultScanResName,
          warning: {
            isPresent: warnings.defaultScannerDefaultScanRes.length > 0,
            messages: warnings.defaultScannerDefaultScanRes,
          },
        },
        defaultScannerScanResB: {
          name: defaultScannerScanResBName,
          warning: {
            isPresent: warnings.defaultScannerScanResB.length > 0,
            messages: warnings.defaultScannerScanResB,
          },
        },
        defaultScannerScanResC: {
          name: defaultScannerScanResCName,
          warning: {
            isPresent: warnings.defaultScannerScanResC.length > 0,
            messages: warnings.defaultScannerScanResC,
          },
        },
        defaultScannerScanResD: {
          name: defaultScannerScanResDName,
          warning: {
            isPresent: warnings.defaultScannerScanResD.length > 0,
            messages: warnings.defaultScannerScanResD,
          },
        },
        defaultScannerScanResE: {
          name: defaultScannerScanResEName,
          warning: {
            isPresent: warnings.defaultScannerScanResE.length > 0,
            messages: warnings.defaultScannerScanResE,
          },
        },
        defaultScannerScanResF: {
          name: defaultScannerScanResFName,
          warning: {
            isPresent: warnings.defaultScannerScanResF.length > 0,
            messages: warnings.defaultScannerScanResF,
          },
        },
        scannerB: {
          name: scannerBName,
          warning: {
            isPresent: warnings.scannerB.length > 0,
            messages: warnings.scannerB,
          },
        },
        scannerBDefaultScanRes: {
          name: scannerBDefaultScanResName,
          warning: {
            isPresent: warnings.scannerBDefaultScanRes.length > 0,
            messages: warnings.scannerBDefaultScanRes,
          },
        },
        scannerBScanResB: {
          name: scannerBScanResBName,
          warning: {
            isPresent: warnings.scannerBScanResB.length > 0,
            messages: warnings.scannerBScanResB,
          },
        },
        scannerBScanResC: {
          name: scannerBScanResCName,
          warning: {
            isPresent: warnings.scannerBScanResC.length > 0,
            messages: warnings.scannerBScanResC,
          },
        },
        scannerBScanResD: {
          name: scannerBScanResDName,
          warning: {
            isPresent: warnings.scannerBScanResD.length > 0,
            messages: warnings.scannerBScanResD,
          },
        },
        scannerBScanResE: {
          name: scannerBScanResEName,
          warning: {
            isPresent: warnings.scannerBScanResE.length > 0,
            messages: warnings.scannerBScanResE,
          },
        },
        scannerBScanResF: {
          name: scannerBScanResFName,
          warning: {
            isPresent: warnings.scannerBScanResF.length > 0,
            messages: warnings.scannerBScanResF,
          },
        },
        scannerC: {
          name: scannerCName,
          warning: {
            isPresent: warnings.scannerC.length > 0,
            messages: warnings.scannerC,
          },
        },

        scannerCDefaultScanRes: {
          name: scannerCDefaultScanResName,
          warning: {
            isPresent: warnings.scannerCDefaultScanRes.length > 0,
            messages: warnings.scannerCDefaultScanRes,
          },
        },
        scannerCScanResB: {
          name: scannerCScanResBName,
          warning: {
            isPresent: warnings.scannerCScanResB.length > 0,
            messages: warnings.scannerCScanResB,
          },
        },
        scannerCScanResC: {
          name: scannerCScanResCName,
          warning: {
            isPresent: warnings.scannerCScanResC.length > 0,
            messages: warnings.scannerCScanResC,
          },
        },
        scannerCScanResD: {
          name: scannerCScanResDName,
          warning: {
            isPresent: warnings.scannerCScanResD.length > 0,
            messages: warnings.scannerCScanResD,
          },
        },
        scannerCScanResE: {
          name: scannerCScanResEName,
          warning: {
            isPresent: warnings.scannerCScanResE.length > 0,
            messages: warnings.scannerCScanResE,
          },
        },
        scannerCScanResF: {
          name: scannerCScanResFName,
          warning: {
            isPresent: warnings.scannerCScanResF.length > 0,
            messages: warnings.scannerCScanResF,
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
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.push1.isEnabled,
            price: foundLabService.addOns.hasDev.push1.price,
          },
          push2: {
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.push2.isEnabled,
            price: foundLabService.addOns.hasDev.push2.price,
          },
          push3: {
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.push3.isEnabled,
            price: foundLabService.addOns.hasDev.push3.price,
          },
          pull1: {
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.pull1.isEnabled,
            price: foundLabService.addOns.hasDev.pull1.price,
          },
          pull2: {
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.pull2.isEnabled,
            price: foundLabService.addOns.hasDev.pull2.price,
          },
          pull3: {
            isAllowed: hasDev,
            isEnabled: foundLabService.addOns.hasDev.pull3.isEnabled,
            price: foundLabService.addOns.hasDev.pull3.price,
          },
          defaultScanner: {
            isAllowed: hasScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          defaultScannerDefaultScanRes: {
            isAllowed: hasScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          defaultScannerScanResB: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResB.isEnabled,
            price:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResB.price,
          },
          defaultScannerScanResC: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResC.isEnabled,
            price:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResC.price,
          },
          defaultScannerScanResD: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResD.isEnabled,
            price:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResD.price,
          },
          defaultScannerScanResE: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResE.isEnabled,
            price:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResE.price,
          },
          defaultScannerScanResF: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResF.isEnabled,
            price:
              foundLabService.addOns.hasScan.defaultScanner.scanResolutions
                .scanResF.price,
          },
          scannerB: {
            isAllowed: hasScan,
            isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
            price: foundLabService.addOns.hasScan.scannerB.price,
          },
          scannerBDefaultScanRes: {
            isAllowed: hasScan,
            isEnabled: foundLabService.addOns.hasScan.scannerB.isEnabled,
            price: 0,
            readOnly: true,
          },
          scannerBScanResB: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResB
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResB
                .price,
          },
          scannerBScanResC: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResC
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResC
                .price,
          },
          scannerBScanResD: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResD
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResD
                .price,
          },
          scannerBScanResE: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResE
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResE
                .price,
          },
          scannerBScanResF: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResF
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerB.scanResolutions.scanResF
                .price,
          },
          scannerC: {
            isAllowed: hasScan,
            isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
            price: foundLabService.addOns.hasScan.scannerC.price,
          },
          scannerCDefaultScanRes: {
            isAllowed: hasScan,
            isEnabled: foundLabService.addOns.hasScan.scannerC.isEnabled,
            price: 0,
            readOnly: true,
          },
          scannerCScanResB: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResB
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResB
                .price,
          },
          scannerCScanResC: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResC
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResC
                .price,
          },
          scannerCScanResD: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResD
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResD
                .price,
          },
          scannerCScanResE: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResE
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResE
                .price,
          },
          scannerCScanResF: {
            isAllowed: hasScan,
            isEnabled:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResF
                .isEnabled,
            price:
              foundLabService.addOns.hasScan.scannerC.scanResolutions.scanResF
                .price,
          },
          defaultScanOption: {
            isAllowed: hasScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scanOptionB: {
            isAllowed: hasScan,
            isEnabled: foundLabService.addOns.hasScan.scanOptionB.isEnabled,
            price: foundLabService.addOns.hasScan.scanOptionB.price,
          },
          scanOptionC: {
            isAllowed: hasScan,
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
                defaultScannerScanResB: [],
                defaultScannerScanResC: [],
                defaultScannerScanResD: [],
                defaultScannerScanResE: [],
                defaultScannerScanResF: [],
                scannerB: [],
                scannerBScanResB: [],
                scannerBScanResC: [],
                scannerBScanResD: [],
                scannerBScanResE: [],
                scannerBScanResF: [],
                scannerC: [],
                scannerCScanResB: [],
                scannerCScanResC: [],
                scannerCScanResD: [],
                scannerCScanResE: [],
                scannerCScanResF: [],
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
                if (serviceIncludesDev) {
                  serviceError.messages.receiveSleeved.push(
                    'Sleeved film cannot be developed.'
                  );
                }
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
                      'Only E-6 film may be mounted.'
                    );
                  }
                  if (!serviceIncludesDev) {
                    serviceError.messages.receiveMounted.push(
                      'Mounted film cannot be developed.'
                    );
                  }
                }
                validatePrice(
                  reqBodyLabServices[0].receiveMounted,
                  'receiveMounted'
                );
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
                    'Only E-6 film may be mounted.'
                  );
                }
                validatePrice(
                  reqBodyLabServices[0].returnMounted,
                  'returnMounted'
                );
              }
              // possible errors for push1
              if (reqBodyLabServices[0].push1.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push1.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].push1, 'push1');
              }
              // possible errors for push2
              if (reqBodyLabServices[0].push2.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push2.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].push2, 'push2');
              }
              // possible errors for push3
              if (reqBodyLabServices[0].push3.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.push3.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].push3, 'push3');
              }
              // possible errors for pull1
              if (reqBodyLabServices[0].pull1.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull1.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].pull1, 'pull1');
              }
              // possible errors for pull2
              if (reqBodyLabServices[0].pull2.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull2.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].pull2, 'pull2');
              }
              // possible errors for pull3
              if (reqBodyLabServices[0].pull3.isEnabled) {
                // add error if service doesn't include developing
                if (!serviceIncludesDev) {
                  serviceError.messages.pull3.push(
                    'Service type does not include developing.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].pull3, 'pull3');
              }
              // possible error for defaultScanner scanresb
              if (reqBodyLabServices[0].defaultScannerScanResB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.defaultScannerScanResB.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].defaultScannerScanResB,
                  'defaultScannerScanResB'
                );
              }
              // possible error for defaultScanner scanresc
              if (reqBodyLabServices[0].defaultScannerScanResC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.defaultScannerScanResC.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].defaultScannerScanResC,
                  'defaultScannerScanResC'
                );
              }
              // possible error for defaultScanner scanresd
              if (reqBodyLabServices[0].defaultScannerScanResD.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.defaultScannerScanResD.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].defaultScannerScanResD,
                  'defaultScannerScanResD'
                );
              }
              // possible error for defaultScanner scanrese
              if (reqBodyLabServices[0].defaultScannerScanResE.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.defaultScannerScanResE.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].defaultScannerScanResE,
                  'defaultScannerScanResE'
                );
              }
              // possible error for defaultScanner scanresf
              if (reqBodyLabServices[0].defaultScannerScanResF.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.defaultScannerScanResF.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].defaultScannerScanResF,
                  'defaultScannerScanResF'
                );
              }
              // possible error for scannerb
              if (reqBodyLabServices[0].scannerB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerB.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].scannerB, 'scannerB');
              }
              // possible error for scannerB scanresb
              if (reqBodyLabServices[0].scannerBScanResB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerBScanResB.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerBScanResB,
                  'scannerBScanResB'
                );
              }
              // possible error for scannerB scanresc
              if (reqBodyLabServices[0].scannerBScanResC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerBScanResC.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerBScanResC,
                  'scannerBScanResC'
                );
              }
              // possible error for scannerB scanresd
              if (reqBodyLabServices[0].scannerBScanResD.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerBScanResD.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerBScanResD,
                  'scannerBScanResD'
                );
              }
              // possible error for scannerB scanrese
              if (reqBodyLabServices[0].scannerBScanResE.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerBScanResE.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerBScanResE,
                  'scannerBScanResE'
                );
              }
              // possible error for scannerB scanresf
              if (reqBodyLabServices[0].scannerBScanResF.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerBScanResF.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerBScanResF,
                  'scannerBScanResF'
                );
              }
              // possible error for scannerc
              if (reqBodyLabServices[0].scannerC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerC.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].scannerC, 'scannerC');
              }

              ///
              ///
              // possible error for scannerC scanresb
              if (reqBodyLabServices[0].scannerCScanResB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerCScanResB.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerCScanResB,
                  'scannerCScanResB'
                );
              }
              // possible error for scannerC scanresc
              if (reqBodyLabServices[0].scannerCScanResC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerCScanResC.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerCScanResC,
                  'scannerCScanResC'
                );
              }
              // possible error for scannerC scanresd
              if (reqBodyLabServices[0].scannerCScanResD.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerCScanResD.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerCScanResD,
                  'scannerCScanResD'
                );
              }
              // possible error for scannerC scanrese
              if (reqBodyLabServices[0].scannerCScanResE.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerCScanResE.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerCScanResE,
                  'scannerCScanResE'
                );
              }
              // possible error for scannerC scanresf
              if (reqBodyLabServices[0].scannerCScanResF.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerCScanResF.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(
                  reqBodyLabServices[0].scannerCScanResF,
                  'scannerCScanResF'
                );
              }

              // possible error for scanoptionb
              if (reqBodyLabServices[0].scanOptionB.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanOptionB.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].scanOptionB, 'scanOptionB');
              }
              // possible error for scanoptionc
              if (reqBodyLabServices[0].scanOptionC.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scanOptionC.push(
                    'Service type does not include scanning.'
                  );
                }
                // validate the price
                validatePrice(reqBodyLabServices[0].scanOptionC, 'scanOptionC');
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
              // find the corresponding lab service
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
                    foundLab.labServices[
                      index
                    ].addOns.hasE6AndHasScanAndSansDev.receiveMounted.isEnabled =
                      reqBodyLabServices[0].receiveMounted.isEnabled;

                    foundLab.labServices[
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

                    // defaultScannerScanResB
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResB.isEnabled =
                      reqBodyLabServices[0].defaultScannerScanResB.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResB.price =
                      reqBodyLabServices[0].defaultScannerScanResB.price;
                    // defaultScanner scanResC
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResC.isEnabled =
                      reqBodyLabServices[0].defaultScannerScanResC.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResC.price =
                      reqBodyLabServices[0].defaultScannerScanResC.price;
                    // defaultScanner scanResD
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResD.isEnabled =
                      reqBodyLabServices[0].defaultScannerScanResD.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResD.price =
                      reqBodyLabServices[0].defaultScannerScanResD.price;
                    // defaultScanner scanResE
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResE.isEnabled =
                      reqBodyLabServices[0].defaultScannerScanResE.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResE.price =
                      reqBodyLabServices[0].defaultScannerScanResE.price;
                    // defaultScanner scanResF
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResF.isEnabled =
                      reqBodyLabServices[0].defaultScannerScanResF.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.defaultScanner.scanResolutions.scanResF.price =
                      reqBodyLabServices[0].defaultScannerScanResF.price;

                    // scanner b
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.isEnabled =
                      reqBodyLabServices[0].scannerB.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scannerB.price =
                      reqBodyLabServices[0].scannerB.price;

                    // scannerB scanResB
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResB.isEnabled =
                      reqBodyLabServices[0].scannerBScanResB.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResB.price =
                      reqBodyLabServices[0].scannerBScanResB.price;
                    // scannerB scanResC
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResC.isEnabled =
                      reqBodyLabServices[0].scannerBScanResC.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResC.price =
                      reqBodyLabServices[0].scannerBScanResC.price;
                    // scannerB scanResD
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResD.isEnabled =
                      reqBodyLabServices[0].scannerBScanResD.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResD.price =
                      reqBodyLabServices[0].scannerBScanResD.price;
                    // scannerB scanResE
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResE.isEnabled =
                      reqBodyLabServices[0].scannerBScanResE.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResE.price =
                      reqBodyLabServices[0].scannerBScanResE.price;
                    // scannerB scanResF
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResF.isEnabled =
                      reqBodyLabServices[0].scannerBScanResF.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerB.scanResolutions.scanResF.price =
                      reqBodyLabServices[0].scannerBScanResF.price;

                    // scanner c
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.isEnabled =
                      reqBodyLabServices[0].scannerC.isEnabled;
                    foundLab.labServices[index].addOns.hasScan.scannerC.price =
                      reqBodyLabServices[0].scannerC.price;

                    // scannerC scanResB
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResB.isEnabled =
                      reqBodyLabServices[0].scannerCScanResB.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResB.price =
                      reqBodyLabServices[0].scannerCScanResB.price;
                    // scannerC scanResC
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResC.isEnabled =
                      reqBodyLabServices[0].scannerCScanResC.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResC.price =
                      reqBodyLabServices[0].scannerCScanResC.price;
                    // scannerC scanResD
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResD.isEnabled =
                      reqBodyLabServices[0].scannerCScanResD.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResD.price =
                      reqBodyLabServices[0].scannerCScanResD.price;
                    // scannerC scanResE
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResE.isEnabled =
                      reqBodyLabServices[0].scannerCScanResE.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResE.price =
                      reqBodyLabServices[0].scannerCScanResE.price;
                    // scannerC scanResF
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResF.isEnabled =
                      reqBodyLabServices[0].scannerCScanResF.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.hasScan.scannerC.scanResolutions.scanResF.price =
                      reqBodyLabServices[0].scannerCScanResF.price;

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
