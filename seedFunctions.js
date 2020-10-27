// import models
const ServiceType = require('./models/serviceType');
const FilmType = require('./models/filmType');
const FilmSize = require('./models/filmSize');
const Service = require('./models/service');

const identifiers = {
  serviceTypes: {
    dev: {
      name: 'Develop',
      _id: '5f8f58c1062b1b2a4900e98f',
    },
    devScan: {
      name: 'Develop and scan',
      _id: '5f8f58c2062b1b2a4900e992',
    },
    devScanPrint: {
      name: 'Develop, scan, and print',
      _id: '5f8f58c2062b1b2a4900e994',
    },
    scan: {
      name: 'Scan',
      _id: '5f8f58c2062b1b2a4900e998',
    },
    scanPrint: {
      name: 'Scan and print',
      _id: '5f8f58c2062b1b2a4900e99a',
    },
    devPrint: {
      name: 'Develop and Print',
      _id: '5f930f043306428bb3090e42',
    },
    print: {
      name: 'Print',
      _id: '5f9082c22992d24cbe82d043',
    },
  },
  filmTypes: {
    c41: {
      name: 'C-41',
      _id: '5f8f58c1062b1b2a4900e990',
    },
    bw: {
      name: 'Black and White',
      _id: '5f8f58c2062b1b2a4900e993',
    },
    e6: {
      name: 'E-6',
      _id: '5f8f58c2062b1b2a4900e996',
    },
    ecn2: {
      name: 'ECN-2',
      _id: '5f8f58c2062b1b2a4900e999',
    },
  },
  filmSizes: {
    f35mm: {
      name: '35mm',
      _id: '5f8f58c1062b1b2a4900e991',
    },
    f35mmPano: {
      name: '35mm Panoramic',
      _id: '5f8f58c2062b1b2a4900e995',
    },
    f35mmMounted: {
      name: '35mm Mounted',
      _id: '5f8f58c2062b1b2a4900e997',
    },
    f120: {
      name: '120',
      _id: '5f8f58c2062b1b2a4900e99b',
    },
    f220: {
      name: '220',
      _id: '5f8f58c2062b1b2a4900e99c',
    },
    f4x5: {
      name: '4x5',
      _id: '5f8f58c2062b1b2a4900e99d',
    },
    f8x10: {
      name: '8x10',
      _id: '5f8f58c2062b1b2a4900e99e',
    },
  },
};

const serviceTypes = [
  {
    name: identifiers.serviceTypes.dev.name,
    _id: identifiers.serviceTypes.dev._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      dev: true,
    },
  },
  {
    name: identifiers.serviceTypes.devScan.name,
    _id: identifiers.serviceTypes.devScan._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      dev: true,
      scan: true,
    },
  },
  {
    name: identifiers.serviceTypes.devScanPrint.name,
    _id: identifiers.serviceTypes.devScanPrint._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      dev: true,
      scan: true,
      print: true,
    },
  },
  {
    name: identifiers.serviceTypes.scan.name,
    _id: identifiers.serviceTypes.scan._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      scan: true,
    },
  },
  {
    name: identifiers.serviceTypes.scanPrint.name,
    _id: identifiers.serviceTypes.scanPrint._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      scan: true,
      print: true,
    },
  },
  {
    name: identifiers.serviceTypes.devPrint.name,
    _id: identifiers.serviceTypes.print._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
  },
  {
    name: identifiers.serviceTypes.print.name,
    _id: identifiers.serviceTypes.print._id,
    compatibilities: {
      filmTypes: [
        identifiers.filmTypes.c41._id,
        identifiers.filmTypes.bw._id,
        identifiers.filmTypes.e6._id,
        identifiers.filmTypes.ecn2._id,
      ],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
    includedServiceTypes: {
      print: true,
    },
  },
];

const filmTypes = [
  {
    name: identifiers.filmTypes.c41.name,
    _id: identifiers.filmTypes.c41._id,
    compatibilities: {
      serviceTypes: [],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
  },
  {
    name: identifiers.filmTypes.bw.name,
    _id: identifiers.filmTypes.bw._id,
    compatibilities: {
      serviceTypes: [],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
  },
  {
    name: identifiers.filmTypes.e6.name,
    _id: identifiers.filmTypes.e6._id,
    compatibilities: {
      serviceTypes: [],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
  },
  {
    name: identifiers.filmTypes.ecn2.name,
    _id: identifiers.filmTypes.ecn2._id,
    compatibilities: {
      serviceTypes: [],
      filmSizes: [
        identifiers.filmSizes.f35mm._id,
        identifiers.filmSizes.f35mmPano._id,
        identifiers.filmSizes.f35mmMounted._id,
        identifiers.filmSizes.f120._id,
        identifiers.filmSizes.f220._id,
        identifiers.filmSizes.f4x5._id,
        identifiers.filmSizes.f8x10._id,
      ],
    },
  },
];

const filmSizes = [
  {
    name: identifiers.filmSizes.f35mm.name,
    _id: identifiers.filmSizes.f35mm._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f35mmPano.name,
    _id: identifiers.filmSizes.f35mmPano._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f35mmMounted.name,
    _id: identifiers.filmSizes.f35mmMounted._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f120.name,
    _id: identifiers.filmSizes.f120._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f220.name,
    _id: identifiers.filmSizes.f220._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f4x5.name,
    _id: identifiers.filmSizes.f4x5._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
  {
    name: identifiers.filmSizes.f8x10.name,
    _id: identifiers.filmSizes.f8x10._id,
    compatibilities: {
      serviceTypes: [],
      filmTypes: [],
    },
  },
];

const services = [];

// synchronous functions
const addRemainingCompatibilities = () => {
  // add compatible service types to film types
  filmTypes.forEach(filmType => {
    serviceTypes.forEach(serviceType => {
      let isCompatible = false;
      serviceType.compatibilities.filmTypes.forEach(compFilmType => {
        if (filmType._id === compFilmType) {
          isCompatible = true;
        }
      });
      if (isCompatible) {
        filmType.compatibilities.serviceTypes.push(serviceType._id);
      }
    });
  });
  // add compatible service types to film sizes
  filmSizes.forEach(filmSize => {
    serviceTypes.forEach(serviceType => {
      let isCompatible = false;
      serviceType.compatibilities.filmSizes.forEach(compFilmSize => {
        if (filmSize._id === compFilmSize) {
          isCompatible = true;
        }
      });
      if (isCompatible) {
        filmSize.compatibilities.serviceTypes.push(serviceType._id);
      }
    });
  });
  // add compatible film types to film sizes
  filmSizes.forEach(filmSize => {
    filmTypes.forEach(filmType => {
      let isCompatible = false;
      filmType.compatibilities.filmSizes.forEach(compFilmSize => {
        if (filmSize._id === compFilmSize) {
          isCompatible = true;
        }
      });
      if (isCompatible) {
        filmSize.compatibilities.filmTypes.push(filmType._id);
      }
    });
  });
};

const buildServices = () => {
  // cycle through the service types
  serviceTypes.forEach(serviceType => {
    const includedServiceTypes = serviceType.includedServiceTypes;
    // for each service type, cycle through its compatible film types
    serviceType.compatibilities.filmTypes.forEach(compatibleFilmTypeId => {
      // for each of its compatible film types, find the compatible film type in the filmtypes array
      filmTypes.forEach(filmType => {
        if (filmType._id === compatibleFilmTypeId) {
          // once you find the compatible film type, cycle through its compatible film sizes
          filmType.compatibilities.filmSizes.forEach(compatibleFilmSizeId => {
            // for each of it's compatible film sizes, find the compatible film size in the filmsize array
            filmSizes.forEach(filmSize => {
              if (filmSize._id === compatibleFilmSizeId) {
                // once you find the compatible film size, cycle through its compatible service types
                filmSize.compatibilities.serviceTypes.forEach(
                  compatibleServiceTypeId => {
                    if (serviceType._id === compatibleServiceTypeId) {
                      // once you find a match, push the object into services
                      services.push({
                        serviceType: serviceType._id,
                        filmType: filmType._id,
                        filmSize: filmSize._id,
                        includedServiceTypes: includedServiceTypes,
                      });
                    }
                  }
                );
              }
            });
          });
        }
      });
    });
  });
};

// asyncronous functions
const seedArrayToMongooseModel = (array, mongooseModel) => {
  if (array.length === 0) return;
  const newMongoObject = new mongooseModel(array[0]);
  newMongoObject.save((err, data) => {
    const newArray = [...array];
    newArray.shift();
    seedArrayToMongooseModel(newArray, mongooseModel);
  });
};

// execution
exports.execute = () => {
  // always run these first
  // addRemainingCompatibilities();
  // buildServices();
  // seeding; run these one at a time maybe
  // seedArrayToMongooseModel(serviceTypes, ServiceType);
  // seedArrayToMongooseModel(filmTypes, FilmType);
  // seedArrayToMongooseModel(filmSizes, FilmSize);
  // seedArrayToMongooseModel(services, Service);
  return;
};
