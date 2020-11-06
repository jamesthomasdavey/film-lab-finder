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
        if (labCanSupport && foundLabService.isEnabled) {
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
            returnUnsleeved: {
              isAllowed: true,
              isEnabled: true,
              price: 0,
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

// @router  get /api/labs/:labId/settings/service-pricing/edit
// @desc    find the lab and retrive its full service pricing settings
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
      return res.json(
        foundLab.labServices.map(foundLabService => {
          return {
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
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            push1: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.push1.isEnabled,
              price: foundLabService.addOns.dev.push1.price,
            },
            push2: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.push2.isEnabled,
              price: foundLabService.addOns.dev.push2.price,
            },
            push3: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.push3.isEnabled,
              price: foundLabService.addOns.dev.push3.price,
            },
            pull1: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.pull1.isEnabled,
              price: foundLabService.addOns.dev.pull1.price,
            },
            pull2: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.pull2.isEnabled,
              price: foundLabService.addOns.dev.pull2.price,
            },
            pull3: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.dev,
              isEnabled: foundLabService.addOns.dev.pull3.isEnabled,
              price: foundLabService.addOns.dev.pull3.price,
            },
            jpegScans: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            rawScans: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.rawScans.isEnabled,
              price: foundLabService.addOns.scan.rawScans.price,
            },
            defaultScanner: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scannerB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scannerB.isEnabled,
              price: foundLabService.addOns.scan.scannerB.price,
            },
            scannerC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scannerC.isEnabled,
              price: foundLabService.addOns.scan.scannerC.price,
            },
            scannerD: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scannerD.isEnabled,
              price: foundLabService.addOns.scan.scannerD.price,
            },
            defaultScanRes: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scanResB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scanResB.isEnabled,
              price: foundLabService.addOns.scan.scanResB.price,
            },
            scanResC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scanResC.isEnabled,
              price: foundLabService.addOns.scan.scanResC.price,
            },
            defaultScanOption: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            scanOptionB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            scanOptionC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.scan,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            defaultPrintSize: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            printSizeB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: foundLabService.addOns.print.printSizeB.isEnabled,
              price: foundLabService.addOns.print.printSizeB.price,
            },
            printSizeC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: foundLabService.addOns.print.printSizeC.isEnabled,
              price: foundLabService.addOns.print.printSizeC.price,
            },
            defaultPrintOption: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: true,
              price: 0,
              readOnly: true,
            },
            printOptionB: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: foundLabService.addOns.print.printOptionB.isEnabled,
              price: foundLabService.addOns.print.printOptionB.price,
            },
            printOptionC: {
              isAllowed:
                foundLabService.service.serviceType.includedServiceTypes.print,
              isEnabled: foundLabService.addOns.print.printOptionC.isEnabled,
              price: foundLabService.addOns.print.printOptionC.price,
            },
          };
        })
      );
    });
});

// @route   put /api/labs/:labId/settings/service-pricing
// @desc    find the lab and edit its service pricing settings
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
        // console.log(reqBodyLabServices);
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
                scannerD: [],
                scanResB: [],
                scanResC: [],
                scanOptionB: [],
                scanOptionC: [],
                printSizeB: [],
                printSizeC: [],
                printOptionB: [],
                printOptionC: [],
              },
            };
            // add necessary errors
            {
              // check what the service includes
              const serviceIncludesDev =
                foundService.serviceType.includedServiceTypes.dev;
              const serviceIncludesScan =
                foundService.serviceType.includedServiceTypes.scan;
              const serviceIncludesPrint =
                foundService.serviceType.includedServiceTypes.print;
              const serviceIncludesE6 =
                foundService.filmType.includedFilmTypes.e6;
              const serviceIncludesF35mmMounted =
                foundService.filmSize.includedFilmSizes.f35mmMounted;
              const validatePrice = (addOn, addOnName) => {
                if (!addOn.price && Number(addOn.price) !== 0) {
                  serviceError.messages[addOnName].push(
                    'Price is required when enabling this cell.'
                  );
                } else if (Number(addOn.price) > 999.99) {
                  serviceError.messages[addOnName].push(
                    'Price must not exceed $999.99.'
                  );
                } else if (Number(addOn.price < 0)) {
                  serviceError.messages[addOnName].push(
                    'Price must not be below $0.'
                  );
                }
              };
              // if enabling, validate the price
              if (reqBodyLabServices[0].base.isEnabled) {
                validatePrice(reqBodyLabServices[0].base, 'base');
              }
              // if enabling return sleeved and the referenced service is for mounted film, add an error
              if (reqBodyLabServices[0].returnSleeved.isEnabled) {
                if (serviceIncludesF35mmMounted) {
                  serviceError.messages.returnSleeved.push(
                    'Mounted film cannot be sleeved.'
                  );
                } else {
                  validatePrice(
                    reqBodyLabServices[0].returnSleeved,
                    'returnSleeved'
                  );
                }
              }
              // possible errors for returning mounted
              if (reqBodyLabServices[0].returnMounted.isEnabled) {
                if (serviceIncludesF35mmMounted) {
                  serviceError.messages.returnMounted.push(
                    'Mounted film cannot be re-mounted.'
                  );
                }
                if (!serviceIncludesE6) {
                  serviceError.messages.returnMounted.push(
                    'Only slide film may be mounted.'
                  );
                }
                if (!serviceIncludesF35mmMounted && serviceIncludesE6)
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
              // possible error for scannerd
              if (reqBodyLabServices[0].scannerD.isEnabled) {
                // add error if service doesn't include scanning
                if (!serviceIncludesScan) {
                  serviceError.messages.scannerD.push(
                    'Service type does not include scanning.'
                  );
                } else {
                  validatePrice(reqBodyLabServices[0].scannerD, 'scannerD');
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
              // possible error for printsizeb
              if (reqBodyLabServices[0].printSizeB.isEnabled) {
                // add error if service doesn't include printing
                if (!serviceIncludesPrint) {
                  serviceError.messages.printSizeB.push(
                    'Service type does not include printing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].printSizeB, 'printSizeB');
                }
              }
              // possible error for printsizec
              if (reqBodyLabServices[0].printSizeC.isEnabled) {
                // add error if service doesn't include printing
                if (!serviceIncludesPrint) {
                  serviceError.messages.printSizeC.push(
                    'Service type does not include printing.'
                  );
                } else {
                  // validate the price
                  validatePrice(reqBodyLabServices[0].printSizeC, 'printSizeC');
                }
              }
              // possible error for printoptionb
              if (reqBodyLabServices[0].printOptionB.isEnabled) {
                // add error if service doesn't include printing
                if (!serviceIncludesPrint) {
                  serviceError.messages.printOptionB.push(
                    'Service type does not include printing.'
                  );
                } else {
                  // validate the price
                  validatePrice(
                    reqBodyLabServices[0].printOptionB,
                    'printOptionB'
                  );
                }
              }
              // possible error for printoptionc
              if (reqBodyLabServices[0].printOptionC.isEnabled) {
                // add error if service doesn't include printing
                if (!serviceIncludesPrint) {
                  serviceError.messages.printOptionC.push(
                    'Service type does not include printing.'
                  );
                } else {
                  // validate the price
                  validatePrice(
                    reqBodyLabServices[0].printOptionC,
                    'printOptionC'
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
                    foundLab.labServices[index].isEnabled =
                      reqBodyLabServices[0].base.isEnabled;
                    foundLab.labServices[index].price =
                      reqBodyLabServices[0].base.price;

                    foundLab.labServices[
                      index
                    ].addOns.ship.returnSleeved.isEnabled =
                      reqBodyLabServices[0].returnSleeved.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.ship.returnSleeved.price =
                      reqBodyLabServices[0].returnSleeved.price;

                    foundLab.labServices[
                      index
                    ].addOns.ship.returnMounted.isEnabled =
                      reqBodyLabServices[0].returnMounted.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.ship.returnMounted.price =
                      reqBodyLabServices[0].returnMounted.price;

                    foundLab.labServices[index].addOns.dev.push1.isEnabled =
                      reqBodyLabServices[0].push1.isEnabled;
                    foundLab.labServices[index].addOns.dev.push1.price =
                      reqBodyLabServices[0].push1.price;

                    foundLab.labServices[index].addOns.dev.push2.isEnabled =
                      reqBodyLabServices[0].push2.isEnabled;
                    foundLab.labServices[index].addOns.dev.push2.price =
                      reqBodyLabServices[0].push2.price;

                    foundLab.labServices[index].addOns.dev.push3.isEnabled =
                      reqBodyLabServices[0].push3.isEnabled;
                    foundLab.labServices[index].addOns.dev.push3.price =
                      reqBodyLabServices[0].push3.price;

                    foundLab.labServices[index].addOns.dev.pull1.isEnabled =
                      reqBodyLabServices[0].pull1.isEnabled;
                    foundLab.labServices[index].addOns.dev.pull1.price =
                      reqBodyLabServices[0].pull1.price;

                    foundLab.labServices[index].addOns.dev.pull2.isEnabled =
                      reqBodyLabServices[0].pull2.isEnabled;
                    foundLab.labServices[index].addOns.dev.pull2.price =
                      reqBodyLabServices[0].pull2.price;

                    foundLab.labServices[index].addOns.dev.pull3.isEnabled =
                      reqBodyLabServices[0].pull3.isEnabled;
                    foundLab.labServices[index].addOns.dev.pull3.price =
                      reqBodyLabServices[0].pull3.price;

                    foundLab.labServices[index].addOns.scan.rawScans.isEnabled =
                      reqBodyLabServices[0].rawScans.isEnabled;
                    foundLab.labServices[index].addOns.scan.rawScans.price =
                      reqBodyLabServices[0].rawScans.price;

                    foundLab.labServices[index].addOns.scan.scannerB.isEnabled =
                      reqBodyLabServices[0].scannerB.isEnabled;
                    foundLab.labServices[index].addOns.scan.scannerB.price =
                      reqBodyLabServices[0].scannerB.price;

                    foundLab.labServices[index].addOns.scan.scannerC.isEnabled =
                      reqBodyLabServices[0].scannerC.isEnabled;
                    foundLab.labServices[index].addOns.scan.scannerC.price =
                      reqBodyLabServices[0].scannerC.price;

                    foundLab.labServices[index].addOns.scan.scannerD.isEnabled =
                      reqBodyLabServices[0].scannerD.isEnabled;
                    foundLab.labServices[index].addOns.scan.scannerD.price =
                      reqBodyLabServices[0].scannerD.price;

                    foundLab.labServices[index].addOns.scan.scanResB.isEnabled =
                      reqBodyLabServices[0].scanResB.isEnabled;
                    foundLab.labServices[index].addOns.scan.scanResB.price =
                      reqBodyLabServices[0].scanResB.price;

                    foundLab.labServices[index].addOns.scan.scanResC.isEnabled =
                      reqBodyLabServices[0].scanResC.isEnabled;
                    foundLab.labServices[index].addOns.scan.scanResC.price =
                      reqBodyLabServices[0].scanResC.price;

                    foundLab.labServices[
                      index
                    ].addOns.scan.scanOptionB.isEnabled =
                      reqBodyLabServices[0].scanOptionB.isEnabled;
                    foundLab.labServices[index].addOns.scan.scanOptionB.price =
                      reqBodyLabServices[0].scanOptionB.price;

                    foundLab.labServices[
                      index
                    ].addOns.scan.scanOptionC.isEnabled =
                      reqBodyLabServices[0].scanOptionC.isEnabled;
                    foundLab.labServices[index].addOns.scan.scanOptionC.price =
                      reqBodyLabServices[0].scanOptionC.price;

                    foundLab.labServices[
                      index
                    ].addOns.print.printSizeB.isEnabled =
                      reqBodyLabServices[0].printSizeB.isEnabled;
                    foundLab.labServices[index].addOns.print.printSizeB.price =
                      reqBodyLabServices[0].printSizeB.price;

                    foundLab.labServices[
                      index
                    ].addOns.print.printSizeC.isEnabled =
                      reqBodyLabServices[0].printSizeC.isEnabled;
                    foundLab.labServices[index].addOns.print.printSizeC.price =
                      reqBodyLabServices[0].printSizeC.price;

                    foundLab.labServices[
                      index
                    ].addOns.print.printOptionB.isEnabled =
                      reqBodyLabServices[0].printOptionB.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.print.printOptionB.price =
                      reqBodyLabServices[0].printOptionB.price;

                    foundLab.labServices[
                      index
                    ].addOns.print.printOptionC.isEnabled =
                      reqBodyLabServices[0].printOptionC.isEnabled;
                    foundLab.labServices[
                      index
                    ].addOns.print.printOptionC.price =
                      reqBodyLabServices[0].printOptionC.price;
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
