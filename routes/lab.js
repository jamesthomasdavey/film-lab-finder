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
      // check what the lab allows
      const labAllowsDev = foundLab.settings.devSettings.isEnabled;
      const labAllowsScan = foundLab.settings.scanSettings.isEnabled;
      const labAllowsPrint = foundLab.settings.printSettings.isEnabled;
      const labAllowsRawScansByRoll = !foundLab.settings.scanSettings.rawByOrder
        .isEnabled;
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScannerD =
        foundLab.settings.scanSettings.scanners.scannerD.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      const labAllowsPrintSizeB =
        foundLab.settings.printSettings.printSizes.printSizeB.isEnabled;
      const labAllowsPrintSizeC =
        foundLab.settings.printSettings.printSizes.printSizeC.isEnabled;
      const labAllowsPrintOptionB =
        foundLab.settings.printSettings.customPrintOptions.printOptionB
          .isEnabled;
      const labAllowsPrintOptionC =
        foundLab.settings.printSettings.customPrintOptions.printOptionC
          .isEnabled;
      // get names for columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const scannerDName =
        foundLab.settings.scanSettings.scanners.scannerD.name || 'Scanner D';
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
      const defaultPrintSizeName =
        foundLab.settings.printSettings.printSizes.defaultPrintSize.name ||
        'Default Print Size';
      const printSizeBName =
        foundLab.settings.printSettings.printSizes.printSizeB.name ||
        'Print Size B';
      const printSizeCName =
        foundLab.settings.printSettings.printSizes.printSizeC.name ||
        'Print Size C';
      const defaultPrintOptionName =
        foundLab.settings.printSettings.customPrintOptions.defaultPrintOption
          .name || 'Default Print Option';
      const printOptionBName =
        foundLab.settings.printSettings.customPrintOptions.printOptionB.name ||
        'Print Option B';
      const printOptionCName =
        foundLab.settings.printSettings.customPrintOptions.printOptionC.name ||
        'Print Option C';
      // build out columns; if column is not enabled, it will not appear
      const columns = {
        base: { name: 'Base', isAllowed: true },
        returnUnsleeved: { name: 'Return Unsleeved', isAllowed: true },
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
        scannerD: {
          name: scannerDName,
          isAllowed: labAllowsScan && labAllowsScannerD,
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
        defaultPrintSize: {
          name: defaultPrintSizeName,
          isAllowed: labAllowsPrint,
        },
        printSizeB: {
          name: printSizeBName,
          isAllowed: labAllowsPrint && labAllowsPrintSizeB,
        },
        printSizeC: {
          name: printSizeCName,
          isAllowed: labAllowsPrint && labAllowsPrintSizeC,
        },
        defaultPrintOption: {
          name: defaultPrintOptionName,
          isAllowed: labAllowsPrint,
        },
        printOptionB: {
          name: printOptionBName,
          isAllowed: labAllowsPrint && labAllowsPrintOptionB,
        },
        printOptionC: {
          name: printOptionCName,
          isAllowed: labAllowsPrint && labAllowsPrintOptionC,
        },
      };
      // build out rows; if row is not supported by the lab, it won't appear
      const rows = [];
      foundLab.labServices.forEach(foundLabService => {
        const serviceIncludesDev =
          foundLabService.service.serviceType.includedServiceTypes.dev;
        const serviceIncludesScan =
          foundLabService.service.serviceType.includedServiceTypes.scan;
        const serviceIncludesPrint =
          foundLabService.service.serviceType.includedServiceTypes.print;
        let labCanSupport = true;
        // if the service includes dev, make sure that the lab can support that
        if (serviceIncludesDev) {
          if (!labAllowsDev) {
            labCanSupport = false;
          }
        }
        // if the service includes scan, make sure that the lab can support that
        if (serviceIncludesScan) {
          if (!labAllowsScan) {
            labCanSupport = false;
          }
        }
        // if the service includes print, make sure that the lab can support that
        if (foundLabService.service.serviceType.includedServiceTypes.print) {
          if (!labAllowsPrint) {
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
              isAllowed: serviceIncludesDev && columns.noPushPull.isAllowed,
              isEnabled: true,
              price: 0,
            },
            push1: {
              isAllowed: serviceIncludesDev && columns.push1.isAllowed,
              isEnabled: foundLabService.addOns.dev.push1.isEnabled,
              price: foundLabService.addOns.dev.push1.price,
            },
            push2: {
              isAllowed: serviceIncludesDev && columns.push2.isAllowed,
              isEnabled: foundLabService.addOns.dev.push2.isEnabled,
              price: foundLabService.addOns.dev.push2.price,
            },
            push3: {
              isAllowed: serviceIncludesDev && columns.push3.isAllowed,
              isEnabled: foundLabService.addOns.dev.push3.isEnabled,
              price: foundLabService.addOns.dev.push3.price,
            },
            pull1: {
              isAllowed: serviceIncludesDev && columns.pull1.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull1.isEnabled,
              price: foundLabService.addOns.dev.pull1.price,
            },
            pull2: {
              isAllowed: serviceIncludesDev && columns.pull2.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull2.isEnabled,
              price: foundLabService.addOns.dev.pull2.price,
            },
            pull3: {
              isAllowed: serviceIncludesDev && columns.pull3.isAllowed,
              isEnabled: foundLabService.addOns.dev.pull3.isEnabled,
              price: foundLabService.addOns.dev.pull3.price,
            },
            jpegScans: {
              isAllowed: serviceIncludesScan && columns.jpegScans.isAllowed,
              isEnabled: true,
              price: 0,
            },
            rawScans: {
              isAllowed: serviceIncludesScan && columns.rawScans.isAllowed,
              isEnabled: foundLabService.addOns.scan.rawScans.isEnabled,
              price: foundLabService.addOns.scan.rawScans.price,
            },
            defaultScanner: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanner.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scannerB: {
              isAllowed: serviceIncludesScan && columns.scannerB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerB.isEnabled,
              price: foundLabService.addOns.scan.scannerB.price,
            },
            scannerC: {
              isAllowed: serviceIncludesScan && columns.scannerC.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerC.isEnabled,
              price: foundLabService.addOns.scan.scannerC.price,
            },
            scannerD: {
              isAllowed: serviceIncludesScan && columns.scannerD.isAllowed,
              isEnabled: foundLabService.addOns.scan.scannerD.isEnabled,
              price: foundLabService.addOns.scan.scannerD.price,
            },
            defaultScanRes: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanRes.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scanResB: {
              isAllowed: serviceIncludesScan && columns.scanResB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanResB.isEnabled,
              price: foundLabService.addOns.scan.scanResB.price,
            },
            scanResC: {
              isAllowed: serviceIncludesScan && columns.scanResC.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanResC.isEnabled,
              price: foundLabService.addOns.scan.scanResC.price,
            },
            defaultScanOption: {
              isAllowed:
                serviceIncludesScan && columns.defaultScanOption.isAllowed,
              isEnabled: true,
              price: 0,
            },
            scanOptionB: {
              isAllowed: serviceIncludesScan && columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            scanOptionC: {
              isAllowed: serviceIncludesScan && columns.scanOptionB.isAllowed,
              isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
              price: foundLabService.addOns.scan.scanOptionB.price,
            },
            defaultPrintSize: {
              isAllowed:
                serviceIncludesPrint && columns.defaultPrintSize.isAllowed,
              isEnabled: true,
              price: 0,
            },
            printSizeB: {
              isAllowed: serviceIncludesPrint && columns.printSizeB.isAllowed,
              isEnabled: foundLabService.addOns.print.printSizeB.isEnabled,
              price: foundLabService.addOns.print.printSizeB.price,
            },
            printSizeC: {
              isAllowed: serviceIncludesPrint && columns.printSizeC.isAllowed,
              isEnabled: foundLabService.addOns.print.printSizeC.isEnabled,
              price: foundLabService.addOns.print.printSizeC.price,
            },
            defaultPrintOption: {
              isAllowed:
                serviceIncludesPrint && columns.defaultPrintOption.isAllowed,
              isEnabled: true,
              price: 0,
            },
            printOptionB: {
              isAllowed: serviceIncludesPrint && columns.printOptionB.isAllowed,
              isEnabled: foundLabService.addOns.print.printOptionB.isEnabled,
              price: foundLabService.addOns.print.printOptionB.price,
            },
            printOptionC: {
              isAllowed: serviceIncludesPrint && columns.printOptionC.isAllowed,
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
      // get the things that the lab allows
      const labAllowsDev = foundLab.settings.devSettings.isEnabled;
      const labAllowsScan = foundLab.settings.scanSettings.isEnabled;
      const labAllowsPrint = foundLab.settings.printSettings.isEnabled;
      const labAllowsRawScansByRoll = !foundLab.settings.scanSettings.rawByOrder
        .isEnabled;
      const labAllowsScannerB =
        foundLab.settings.scanSettings.scanners.scannerB.isEnabled;
      const labAllowsScannerC =
        foundLab.settings.scanSettings.scanners.scannerC.isEnabled;
      const labAllowsScannerD =
        foundLab.settings.scanSettings.scanners.scannerD.isEnabled;
      const labAllowsScanResB =
        foundLab.settings.scanSettings.scanResolutions.scanResB.isEnabled;
      const labAllowsScanResC =
        foundLab.settings.scanSettings.scanResolutions.scanResC.isEnabled;
      const labAllowsScanOptionB =
        foundLab.settings.scanSettings.customScanOptions.scanOptionB.isEnabled;
      const labAllowsScanOptionC =
        foundLab.settings.scanSettings.customScanOptions.scanOptionC.isEnabled;
      const labAllowsPrintSizeB =
        foundLab.settings.printSettings.printSizes.printSizeB.isEnabled;
      const labAllowsPrintSizeC =
        foundLab.settings.printSettings.printSizes.printSizeC.isEnabled;
      const labAllowsPrintOptionB =
        foundLab.settings.printSettings.customPrintOptions.printOptionB
          .isEnabled;
      const labAllowsPrintOptionC =
        foundLab.settings.printSettings.customPrintOptions.printOptionC
          .isEnabled;
      // get names for the custom defined columns
      const defaultScannerName =
        foundLab.settings.scanSettings.scanners.defaultScanner.name ||
        'Default Scanner';
      const scannerBName =
        foundLab.settings.scanSettings.scanners.scannerB.name || 'Scanner B';
      const scannerCName =
        foundLab.settings.scanSettings.scanners.scannerC.name || 'Scanner C';
      const scannerDName =
        foundLab.settings.scanSettings.scanners.scannerD.name || 'Scanner D';
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
      const defaultPrintSizeName =
        foundLab.settings.printSettings.printSizes.defaultPrintSize.name ||
        'Default Print Size';
      const printSizeBName =
        foundLab.settings.printSettings.printSizes.printSizeB.name ||
        'Print Size B';
      const printSizeCName =
        foundLab.settings.printSettings.printSizes.printSizeC.name ||
        'Print Size C';
      const defaultPrintOptionName =
        foundLab.settings.printSettings.customPrintOptions.defaultPrintOption
          .name || 'Default Print Option';
      const printOptionBName =
        foundLab.settings.printSettings.customPrintOptions.printOptionB.name ||
        'Print Option B';
      const printOptionCName =
        foundLab.settings.printSettings.customPrintOptions.printOptionC.name ||
        'Print Option C';
      // create an object of warnings that will be added to the columns
      const warnings = {
        base: [],
        returnUnsleeved: [],
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
        scannerD: [],
        defaultScanRes: [],
        scanResB: [],
        scanResC: [],
        defaultScanOption: [],
        scanOptionB: [],
        scanOptionC: [],
        defaultPrintSize: [],
        printSizeB: [],
        printSizeC: [],
        defaultPrintOption: [],
        printOptionB: [],
        printOptionC: [],
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
          warnings.jpegScans.push(message);
          warnings.rawScans.push(message);
          warnings.defaultScanner.push(message);
          warnings.scannerB.push(message);
          warnings.scannerC.push(message);
          warnings.scannerD.push(message);
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
        if (!labAllowsScannerD) {
          warnings.scannerD.push(
            `You must enable the scanner "${scannerDName}" to offer this add-on.`
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
        if (!labAllowsPrintSizeB) {
          warnings.printSizeB.push(
            `You must enable the print size "${printSizeBName}" to offer this add-on.`
          );
        }
        if (!labAllowsPrintSizeC) {
          warnings.printSizeC.push(
            `You must enable the print size "${printSizeCName}" to offer this add-on.`
          );
        }
        if (!labAllowsPrintOptionB) {
          warnings.printOptionB.push(
            `You must enable the print option "${printOptionB}" to offer this add-on.`
          );
        }
        if (!labAllowsPrintOptionC) {
          warnings.printOptionC.push(
            `You must enable the print option "${printOptionC}" to offer this add-on.`
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
        returnUnsleeved: {
          name: 'Return Unsleeved',
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
        scannerD: {
          name: scannerDName,
          warning: {
            isPresent: warnings.scannerD.length > 0,
            messages: warnings.scannerD,
          },
        },
        defaultScanRes: { name: defaultScanResName, isAllowed: scanAllowed },
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
        defaultPrintSize: {
          name: defaultPrintSizeName,
          warning: {
            isPresent: warnings.defaultPrintSize.length > 0,
            messages: warnings.defaultPrintSize,
          },
        },
        printSizeB: {
          name: printSizeBName,
          warning: {
            isPresent: warnings.printSizeB.length > 0,
            messages: warnings.printSizeB,
          },
        },
        printSizeC: {
          name: printSizeCName,
          warning: {
            isPresent: warnings.printSizeC.length > 0,
            messages: warnings.printSizeC,
          },
        },
        defaultPrintOption: {
          name: defaultPrintOptionName,
          warning: {
            isPresent: warnings.defaultPrintOption.length > 0,
            messages: warnings.defaultPrintOption,
          },
        },
        printOptionB: {
          name: printOptionBName,
          warning: {
            isPresent: warnings.printOptionB.length > 0,
            messages: warnings.printOptionB,
          },
        },
        printOptionC: {
          name: printOptionCName,
          warning: {
            isPresent: warnings.printOptionC.length > 0,
            messages: warnings.printOptionC,
          },
        },
      };
      // build rows
      const rows = foundLab.labServices.map(foundLabService => {
        const serviceIncludesDev =
          foundLabService.service.serviceType.includedServiceTypes.dev;
        const serviceIncludesScan =
          foundLabService.service.serviceType.includedServiceTypes.scan;
        const serviceIncludesPrint =
          foundLabService.service.serviceType.includedServiceTypes.print;
        const unsupportedServiceTypes = [];
        if (serviceIncludesDev && !labAllowsDev) {
          unsupportedServiceTypes.push('Developing');
        }
        if (serviceIncludesScan && !labAllowsScan) {
          unsupportedServiceTypes.push('Scanning');
        }
        if (serviceIncludesPrint && !labAllowsPrint) {
          unsupportedServiceTypes.push('Printing');
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
            isAllowed: serviceIncludesDev,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          push1: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.push1.isEnabled,
            price: foundLabService.addOns.dev.push1.price,
          },
          push2: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.push2.isEnabled,
            price: foundLabService.addOns.dev.push2.price,
          },
          push3: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.push3.isEnabled,
            price: foundLabService.addOns.dev.push3.price,
          },
          pull1: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.pull1.isEnabled,
            price: foundLabService.addOns.dev.pull1.price,
          },
          pull2: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.pull2.isEnabled,
            price: foundLabService.addOns.dev.pull2.price,
          },
          pull3: {
            isAllowed: serviceIncludesDev,
            isEnabled: foundLabService.addOns.dev.pull3.isEnabled,
            price: foundLabService.addOns.dev.pull3.price,
          },
          jpegScans: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          rawScans: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.rawScans.isEnabled,
            price: foundLabService.addOns.scan.rawScans.price,
          },
          defaultScanner: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scannerB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scannerB.isEnabled,
            price: foundLabService.addOns.scan.scannerB.price,
          },
          scannerC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scannerC.isEnabled,
            price: foundLabService.addOns.scan.scannerC.price,
          },
          scannerD: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scannerD.isEnabled,
            price: foundLabService.addOns.scan.scannerD.price,
          },
          defaultScanRes: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scanResB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scanResB.isEnabled,
            price: foundLabService.addOns.scan.scanResB.price,
          },
          scanResC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scanResC.isEnabled,
            price: foundLabService.addOns.scan.scanResC.price,
          },
          defaultScanOption: {
            isAllowed: serviceIncludesScan,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          scanOptionB: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
            price: foundLabService.addOns.scan.scanOptionB.price,
          },
          scanOptionC: {
            isAllowed: serviceIncludesScan,
            isEnabled: foundLabService.addOns.scan.scanOptionB.isEnabled,
            price: foundLabService.addOns.scan.scanOptionB.price,
          },
          defaultPrintSize: {
            isAllowed: serviceIncludesPrint,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          printSizeB: {
            isAllowed: serviceIncludesPrint,
            isEnabled: foundLabService.addOns.print.printSizeB.isEnabled,
            price: foundLabService.addOns.print.printSizeB.price,
          },
          printSizeC: {
            isAllowed: serviceIncludesPrint,
            isEnabled: foundLabService.addOns.print.printSizeC.isEnabled,
            price: foundLabService.addOns.print.printSizeC.price,
          },
          defaultPrintOption: {
            isAllowed: serviceIncludesPrint,
            isEnabled: true,
            price: 0,
            readOnly: true,
          },
          printOptionB: {
            isAllowed: serviceIncludesPrint,
            isEnabled: foundLabService.addOns.print.printOptionB.isEnabled,
            price: foundLabService.addOns.print.printOptionB.price,
          },
          printOptionC: {
            isAllowed: serviceIncludesPrint,
            isEnabled: foundLabService.addOns.print.printOptionC.isEnabled,
            price: foundLabService.addOns.print.printOptionC.price,
          },
        };
      });
      // send columns and rows
      return res.json({ columns: columns, rows: rows });
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
