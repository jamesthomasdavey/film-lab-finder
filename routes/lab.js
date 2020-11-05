const express = require('express');
const router = express.Router();

const sortServices = require('../helpers/sortServices');
const filmType = require('../models/filmType');

const Lab = require('../models/lab');
const service = require('../models/service');
const Service = require('../models/service');
const ServiceType = require('../models/serviceType');

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
              ship: { returnMounted: {}, returnSleeved: {} },
              dev: {},
              scan: {},
              print: {},
            },
          };
          labService.service = foundService._id;
          // set the allowed and dissallowed addons
          if (!foundService.filmSize.includedFilmSizes.f35mmMounted) {
            labService.addOns.ship.returnSleeved.isAllowed = true;
          }
          if (
            foundService.filmType.includedFilmTypes.e6 &&
            !foundService.filmSize.includedFilmSizes.f35mmMounted
          ) {
            labService.addOns.ship.returnMounted.isAllowed = true;
          }
          if (foundService.serviceType.includedServiceTypes.dev) {
            labService.addOns.dev.isAllowed = true;
          }
          if (foundService.serviceType.includedServiceTypes.scan) {
            labService.addOns.scan.isAllowed = true;
          }
          if (foundService.serviceType.includedServiceTypes.print) {
            labService.addOns.print.isAllowed = true;
          }
          return labService;
        });
        const newLab = new Lab({
          name: req.body.name,
          ownedBy: req.body.ownedBy,
          labServices: labServices,
        });
        newLab.save().then(savedLab => {
          return res.json(savedLab);
        });
      });
  });
});

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

// @route   get /api/labs/:labId/settings/ship
// @desc    find the lab and retrieve its ship settings
// @access  private
router.get('/labs/:labId/settings/ship', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.shipSettings);
  });
});

// @route   get /api/labs/:labId/settings/dev
// @desc    find the lab and retrieve its dev settings
// @access  private
router.get('/labs/:labId/settings/dev', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.devSettings);
  });
});

// @route   get /api/labs/:labId/settings/scan
// @desc    find the lab and retrieve its scan settings
// @access  private
router.get('/labs/:labId/settings/scan', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.scanSettings);
  });
});

// @route   get /api/labs/:labId/settings/print
// @desc    find the lab and retrieve its print settings
// @access  private
router.get('/labs/:labId/settings/print', (req, res) => {
  // todo: make sure that user is lab owner
  Lab.findById(req.params.labId).then(foundLab => {
    return res.json(foundLab.settings.printSettings);
  });
});

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
      // get info for columns and rows
      const devAllowed = foundLab.settings.devSettings.isEnabled;
      const scanAllowed = foundLab.settings.scanSettings.isEnabled;
      const printAllowed = foundLab.settings.printSettings.isEnabled;
      // build out columns
      const columns = {
        base: { isAllowed: true },
        returnUnsleeved: { isAllowed: true },
        returnSleeved: { isAllowed: true },
        returnMounted: { isAllowed: true },
        noPushPull: { isAllowed: devAllowed },
        push1: { isAllowed: devAllowed },
        push2: { isAllowed: devAllowed },
        push3: { isAllowed: devAllowed },
        pull1: { isAllowed: devAllowed },
        pull2: { isAllowed: devAllowed },
        pull3: { isAllowed: devAllowed },
        jpegScans: { isAllowed: scanAllowed },
        rawScans: {
          isAllowed:
            scanAllowed && !foundLab.settings.scanSettings.rawByOrder.isEnabled,
        },
        defaultScanner: { isAllowed: scanAllowed },
        scannerB: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.scanners.scannerB.isEnabled,
        },
        scannerC: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.scanners.scannerC.isEnabled,
        },
        scannerD: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.scanners.scannerD.isEnabled,
        },
        defaultScanRes: { isAllowed: scanAllowed },
        scanResB: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled,
        },
        scanResC: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled,
        },
        defaultScanOption: { isAllowed: scanAllowed },
        scanOptionB: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.customScanOptions.scanOptionB
              .isEnabled,
        },
        scanOptionC: {
          isAllowed:
            scanAllowed &&
            foundLab.settings.scanSettings.customScanOptions.scanOptionC
              .isEnabled,
        },
        defaultPrintSize: { isAllowed: printAllowed },
        printSizeB: {
          isAllowed:
            printAllowed &&
            foundLab.settings.printSettings.printSizes.printSizeB.isEnabled,
        },
        printSizeC: {
          isAllowed:
            printAllowed &&
            foundLab.settings.printSettings.printSizes.printSizeC.isEnabled,
        },
        defaultPrintOption: { isAllowed: printAllowed },
        printOptionB: {
          isAllowed:
            printAllowed &&
            foundLab.settings.printSettings.customPrintOptions.printOptionB
              .isEnabled,
        },
        printOptionC: {
          isAllowed:
            printAllowed &&
            foundLab.settings.printSettings.customPrintOptions.printOptionC
              .isEnabled,
        },
      };
      // build out rows
      const rows = [];
      foundLab.labServices.forEach(foundLabService => {
        let labCanSupport = true;
        // if the service includes dev, make sure that the lab can support that
        if (foundLabService.service.serviceType.includedServiceTypes.dev) {
          if (!foundLab.settings.devSettings.isEnabled) {
            labCanSupport = false;
          }
        }
        // if the service includes scan, make sure that the lab can support that
        if (foundLabService.service.serviceType.includedServiceTypes.scan) {
          if (!foundLab.settings.scanSettings.isEnabled) {
            labCanSupport = false;
          }
        }
        // if the service includes print, make sure that the lab can support that
        if (foundLabService.service.serviceType.includedServiceTypes.print) {
          if (!foundLab.settings.printSettings.isEnabled) {
            labCanSupport = false;
          }
        }
        // if the lab can support the row, we'll add the row
        if (labCanSupport) {
          rows.push({
            serviceId: foundLabService.service._id,
            serviceType: foundLabService.service.serviceType.name,
            filmType: foundLabService.service.filmType.name,
            filmSize: foundLabService.service.filmSize.name,
            base: {
              isAllowed: true,
              isEnabled: foundLabService.isEnabled,
              price: foundLabService.price,
            },
            returnUnsleeved: {
              isAllowed: true,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            returnSleeved: {
              isAllowed: foundLabService.addOns.ship.returnSleeved.isAllowed,
              isEnabled: foundLabService.addOns.ship.returnSleeved.isEnabled,
              price: foundLabService.addOns.ship.returnSleeved.price,
            },
            returnMounted: {
              isAllowed: foundLabService.addOns.ship.returnMounted.isAllowed,
              isEnabled: foundLabService.addOns.ship.returnMounted.isEnabled,
              price: foundLabService.addOns.ship.returnMounted.price,
            },
            noPushPull: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.noPushPull.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            push1: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.push1.isAllowed,
              isEnabled: foundLabService.addOns.dev.push1.isEnabled,
              price: foundLabService.addOns.dev.push1.price,
            },
            push2: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.push2.isAllowed,
              isEnabled: foundLabService.addOns.dev.push2.isEnabled,
              price: foundLabService.addOns.dev.push2.price,
            },
            push3: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.push3.isAllowed,
              isEnabled: foundLabService.addOns.dev.push3.isEnabled,
              price: foundLabService.addOns.dev.push3.price,
            },
            pull1: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.pull1.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull1.isEnabled,
              price: foundLabService.addOns.dev.pull1.price,
            },
            pull2: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.pull2.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull2.isEnabled,
              price: foundLabService.addOns.dev.pull2.price,
            },
            pull3: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev &&
                columns.pull3.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull3.isEnabled,
              price: foundLabService.addOns.dev.pull3.price,
            },
            jpegScans: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.jpegScans.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            rawScans: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.rawScans.isAllowed,
              isEnabled: foundLabService.addOns.scan.rawScans.isEnabled,
              price: foundLabService.addOns.scan.rawScans.price,
            },
            defaultScanner: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.defaultScanner.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scannerB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scannerB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerB.isEnabled,
              price: foundLabService.addOns.scan.scannerB.price,
            },
            scannerC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scannerC.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerC.isEnabled,
              price: foundLabService.addOns.scan.scannerC.price,
            },
            scannerD: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scannerD.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerD.isEnabled,
              price: foundLabService.addOns.scan.scannerD.price,
            },
            defaultScanRes: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.defaultScanRes.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scanResB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scanResB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanResB.isEnabled,
              price: foundLabService.addOns.scan.scanResB.price,
            },
            scanResC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scanResC.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanResC.isEnabled,
              price: foundLabService.addOns.scan.scanResC.price,
            },
            defaultScanOption: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.defaultScanOption.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scanOptionB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            scanOptionC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan &&
                columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            defaultPrintSize: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.defaultPrintSize.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            printSizeB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.printSizeB.isAllowed,
              isEnabled: foundLabService.addOns.print.printSizeB.isEnabled,
              price: foundLabService.addOns.print.printSizeB.price,
            },
            printSizeC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.printSizeC.isAllowed,
              isEnabled: foundLabService.addOns.print.printSizeC.isEnabled,
              price: foundLabService.addOns.print.printSizeC.price,
            },
            defaultPrintOption: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.defaultPrintOption.isAllowed,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            printOptionB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.printOptionB.isAllowed,
              isEnabled: foundLabService.addOns.print.printOptionB.isEnabled,
              price: foundLabService.addOns.print.printOptionB.price,
            },
            printOptionC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes
                  .print && columns.printOptionC.isAllowed,
              isEnabled: foundLabService.addOns.print.printOptionC.isEnabled,
              price: foundLabService.addOns.print.printOptionC.price,
            },
          });
        }
      });
      return res.json({ columns: columns, rows: rows });
    });
});

// @route   put /api/labs/:labId/settings/service-pricing
// @desc    find the lab and edit its service pricing settings
// @access  private
router.put('/labs/:labId/settings/service-pricing', (req, res) => {
  Lab.findById(req.params.labId)
    // .populate({
    //   path: 'labServices.service',
    //   populate: { path: 'serviceType' },
    // })
    // .populate({
    //   path: 'labServices.service',
    //   populate: { path: 'filmType' },
    // })
    // .populate({
    //   path: 'labServices.service',
    //   populate: { path: 'filmSize' },
    // })
    .then(foundLab => {
      const errors = [];
      // check what the lab is allowed to do
      const labAllowances = {
        dev: foundLab.settings.devSettings.isEnabled,
        scan: foundLab.settings.scanSettings.isEnabled,
        print: foundLab.settings.printSettings.isEnabled,
        scannerB:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.scanners.scannerB.isEnabled,
        scannerC:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.scanners.scannerC.isEnabled,
        scannerD:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.scanners.scannerD.isEnabled,
        scanResB:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled,
        scanResC:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled,
        scanOptionB:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.customScanOptions.scanOptionB
            .isEnabled,
        scanOptionC:
          foundLab.settings.scanSettings.isEnabled &&
          foundLab.settings.scanSettings.customScanOptions.scanOptionC
            .isEnabled,
        printSizeB:
          foundLab.settings.printSettings.isEnabled &&
          foundLab.settings.printSettings.printSizes.printSizeB.isEnabled,
        printSizeC:
          foundLab.settings.printSettings.isEnabled &&
          foundLab.settings.printSettings.printSizes.printSizeC.isEnabled,
        printOptionB:
          foundLab.settings.printSettings.isEnabled &&
          foundLab.settings.printSettings.customPrintOptions.printOptionB
            .isEnabled,
        printOptionC:
          foundLab.settings.printSettings.isEnabled &&
          foundLab.settings.printSettings.customPrintOptions.printOptionC
            .isEnabled,
      };
      // cycle through the reqbody labservices (recursively)
      const applyChangesToLab = reqBodyLabServices => {
        if (reqBodyLabServices.length === 0) {
          // this where you finally hit "save" or send back the errors if there are any
          return console.log('done');
        }
        Service.findById(reqBodyLabServices[0].serviceId)
          .populate('serviceType')
          .populate('filmType')
          .populate('filmSize')
          .then(foundService => {
            // create an error object
            const serviceError = {
              serviceId: reqBodyLabServices[0].serviceId,
              messages: {
                base: [],
                returnSleeved: [],
                returnMounted: [],
                push1: [],
                push2: [],
                push3: [],
                pull1: [],
                pull2: [],
                pull3: [],
                rawScans: [],
              },
            };
            // check what the referenced service includes
            const foundServiceInclusions = {
              serviceType: {
                dev: foundService.serviceType.includedServiceTypes.dev,
                scan: foundService.serviceType.includedServiceTypes.scan,
                print: foundService.serviceType.includedServiceTypes.print,
              },
              filmType: {
                e6: foundService.filmType.includedFilmTypes.e6,
              },
              filmSize: {
                f35mmMounted:
                  foundService.filmSize.includedFilmSizes.f35mmMounted,
              },
            };
            // create a "disable only" variable incase that's all the user wants to do
            let userIsDisablingService = false;
            if (!reqBodyLabServices[0].base.isEnabled) {
              userIsDisablingService = true;
            } else {
              // check for possible errors
              // if enabling and the referenced service has a service type that the lab doesn't allow, add an error
              if (reqBodyLabServices[0].base.isEnabled) {
                if (
                  foundServiceInclusions.serviceType.dev &&
                  !labAllowances.dev
                ) {
                  serviceError.messages.base.push(
                    'Developing is not currently enabled.'
                  );
                }
                if (
                  foundServiceInclusions.serviceType.scan &&
                  !labAllowances.scan
                ) {
                  serviceError.messages.base.push(
                    'Scanning is not currently enabled.'
                  );
                }
                if (
                  foundServiceInclusions.serviceType.print &&
                  !labAllowances.print
                ) {
                  serviceError.messages.base.push(
                    'Printing is not currently enabled.'
                  );
                }
              }
              // if enabling return sleeved and the referenced service is for mounted film, add an error
              if (reqBodyLabServices[0].returnSleeved.isEnabled) {
                if (foundServiceInclusions.filmSize.f35mmMounted) {
                  serviceError.messages.returnSleeved.push(
                    'Mounted film cannot be sleeved.'
                  );
                }
              }
              // if enabling return mounted and the film is not slide film or is already mounted, add an error
              if (reqBodyLabServices[0].returnMounted.isEnabled) {
                if (foundServiceInclusions.filmSize.f35mmMounted) {
                  serviceError.messages.returnMounted.push(
                    'Mounted film cannot be re-mounted.'
                  );
                }
                if (!foundServiceInclusions.filmType.e6) {
                  serviceError.messages.returnMounted.push(
                    'Only slide film may be mounted.'
                  );
                }
              }
              // if enabling dev related services but the lab doesn't allow it, add an error
              if (!labAllowances.dev) {
                if (reqBodyLabServices[0].push1.isEnabled) {
                  serviceError.messages.push1.push('Developing is not enabled');
                }
                if (reqBodyLabServices[0].push2.isEnabled) {
                  serviceError.messages.push2.push('Developing is not enabled');
                }
                if (reqBodyLabServices[0].push3.isEnabled) {
                  serviceError.messages.push3.push('Developing is not enabled');
                }
                if (reqBodyLabServices[0].pull1.isEnabled) {
                  serviceError.messages.pull1.push('Developing is not enabled');
                }
                if (reqBodyLabServices[0].pull2.isEnabled) {
                  serviceError.messages.pull2.push('Developing is not enabled');
                }
                if (reqBodyLabServices[0].pull3.isEnabled) {
                  serviceError.messages.pull3.push('Developing is not enabled');
                }
              }
              // if enabling scan related services but the lab doesn't allow it, add an error
              if (!labAllowances.scan) {
                if (reqBodyLabServices[0].rawScans.isEnabled) {
                  serviceError.messages.rawScans.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scannerB.isEnabled) {
                  serviceError.messages.scannerB.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scannerC.isEnabled) {
                  serviceError.messages.scannerC.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scannerD.isEnabled) {
                  serviceError.messages.scannerD.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scanResB.isEnabled) {
                  serviceError.messages.scanResB.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scanResC.isEnabled) {
                  serviceError.messages.scanResC.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scanOptionB.isEnabled) {
                  serviceError.messages.scanOptionB.push(
                    'Scanning is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].scanOptionC.isEnabled) {
                  serviceError.messages.scanOptionC.push(
                    'Scanning is not enabled.'
                  );
                }
              }
              // if enabling print related services but the lab doesn't allow it, add an error
              if (!labAllowances.print) {
                if (reqBodyLabServices[0].printSizeB.isEnabled) {
                  serviceError.messages.printSizeB.push(
                    'Printing is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].printSizeC.isEnabled) {
                  serviceError.messages.printSizeC.push(
                    'Printing is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].printOptionB.isEnabled) {
                  serviceError.messages.printOptionB.push(
                    'Printing is not enabled.'
                  );
                }
                if (reqBodyLabServices[0].printOptionC.isEnabled) {
                  serviceError.messages.printOptionC.push(
                    'Printing is not enabled.'
                  );
                }
              }
              // if enabling scannerb but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scannerB.isEnabled) {
                if (!labAllowances.scannerB) {
                  ('This scanner has not been enabled.');
                }
              }
              // if enabling scannerc but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scannerC.isEnabled) {
                if (!labAllowances.scannerC) {
                  ('This scanner has not been enabled.');
                }
              }
              // if enabling scannerd but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scannerD.isEnabled) {
                if (!labAllowances.scannerD) {
                  ('This scanner has not been enabled.');
                }
              }
              // if enabling scanresb but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scanResB.isEnabled) {
                if (!labAllowances.scanResB) {
                  ('This scan resolution has not been enabled.');
                }
              }
              // if enabling scanresc but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scanResC.isEnabled) {
                if (!labAllowances.scanResC) {
                  ('This scan resolution has not been enabled.');
                }
              }
              // if enabling scanoptionb but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scanOptionB.isEnabled) {
                if (!labAllowances.scanOptionB) {
                  ('This scan option has not been enabled.');
                }
              }
              // if enabling scanoptionc but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].scanOptionC.isEnabled) {
                if (!labAllowances.scanOptionC) {
                  ('This scan option has not been enabled.');
                }
              }
              // if enabling printsizeb but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].printSizeB.isEnabled) {
                if (!labAllowances.printSizeB) {
                  ('This print size has not been enabled.');
                }
              }
              // if enabling printsizec but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].printSizeC.isEnabled) {
                if (!labAllowances.printSizeC) {
                  ('This print size has not been enabled.');
                }
              }
              // if enabling printoptionb but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].printOptionB.isEnabled) {
                if (!labAllowances.printOptionB) {
                  ('This print option has not been enabled.');
                }
              }
              // if enabling printoptionc but the lab doesn't allow it, add an error
              if (reqBodyLabServices[0].printOptionC.isEnabled) {
                if (!labAllowances.printOptionC) {
                  ('This print size has not been enabled.');
                }
              }
            }
            if (req.body) const newArray = [...reqBodyLabServices];
            newArray.shift();
            applyChangesToLab(newArray);
          });
      };
      applyChangesToLab(req.body.labServices);
      // if the user just wants to disable it, just disable it without making any other changes
      // if the user doesn't want to disable it, make sure that it's allowed according to the lab
      // also, make sure that it's allowed according to the service
      // if the changes are allowed, update the corresponding labservice
      // if the errors array isn't empty, send the errors array
      // otherwise, save it
    });
});

module.exports = router;
