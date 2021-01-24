// import data to be seeded
// const serviceTypes = require('./seed-data/serviceTypes');
// const filmTypes = require('./seed-data/filmTypes');
// const filmSizes = require('./seed-data/filmSizes');
// const services = require('./seed-data/services');

const serviceTypes = [
  {
    name: 'Develop',
    _id: '5f8f58c1062b1b2a4900e98f',
    compatibilities: {
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
    includedServiceTypes: { dev: true },
    allowedAddOns: {},
  },
  {
    name: 'Develop and scan',
    _id: '5f8f58c2062b1b2a4900e992',
    compatibilities: {
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
    includedServiceTypes: { dev: true, scan: true },
  },
  {
    name: 'Scan',
    _id: '5f8f58c2062b1b2a4900e998',
    compatibilities: {
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
    includedServiceTypes: { scan: true },
  },
];

const filmTypes = [
  {
    name: 'C-41',
    _id: '5f8f58c1062b1b2a4900e990',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
  },
  {
    name: 'Black and White',
    _id: '5f8f58c2062b1b2a4900e993',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
  },
  {
    name: 'E-6',
    _id: '5f8f58c2062b1b2a4900e996',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
        '5f8f58c2062b1b2a4900e99d',
        '5f8f58c2062b1b2a4900e99e',
      ],
    },
    includedFilmTypes: { e6: true },
  },
  {
    name: 'ECN-2',
    _id: '5f8f58c2062b1b2a4900e999',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmSizes: [
        '5f8f58c1062b1b2a4900e991',
        '5f8f58c2062b1b2a4900e995',
        '5f8f58c2062b1b2a4900e99b',
        '5f8f58c2062b1b2a4900e99c',
      ],
    },
  },
];

const filmSizes = [
  {
    name: '35mm',
    _id: '5f8f58c1062b1b2a4900e991',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
    },
  },
  {
    name: '35mm Panoramic',
    _id: '5f8f58c2062b1b2a4900e995',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
    },
  },
  {
    name: '120',
    _id: '5f8f58c2062b1b2a4900e99b',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
    },
  },
  {
    name: '220',
    _id: '5f8f58c2062b1b2a4900e99c',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
        '5f8f58c2062b1b2a4900e999',
      ],
    },
  },
  {
    name: '4x5',
    _id: '5f8f58c2062b1b2a4900e99d',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
      ],
    },
  },
  {
    name: '8x10',
    _id: '5f8f58c2062b1b2a4900e99e',
    compatibilities: {
      serviceTypes: [
        '5f8f58c1062b1b2a4900e98f',
        '5f8f58c2062b1b2a4900e992',
        '5f8f58c2062b1b2a4900e998',
      ],
      filmTypes: [
        '5f8f58c1062b1b2a4900e990',
        '5f8f58c2062b1b2a4900e993',
        '5f8f58c2062b1b2a4900e996',
      ],
    },
  },
];

const services = [
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f228d7ed4f6841bc053b',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f228d7ed4f6841bc053c',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f228d7ed4f6841bc053d',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f229d7ed4f6841bc053e',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f229d7ed4f6841bc053f',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f229d7ed4f6841bc0540',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f229d7ed4f6841bc0541',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f229d7ed4f6841bc0542',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f229d7ed4f6841bc0543',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f229d7ed4f6841bc0544',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f229d7ed4f6841bc0545',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f229d7ed4f6841bc0546',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f229d7ed4f6841bc0547',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f229d7ed4f6841bc0548',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22ad7ed4f6841bc0549',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22ad7ed4f6841bc054a',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22ad7ed4f6841bc054b',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22ad7ed4f6841bc054c',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22ad7ed4f6841bc054d',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22ad7ed4f6841bc054e',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22ad7ed4f6841bc054f',
  },
  {
    serviceType: '5f8f58c1062b1b2a4900e98f',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22ad7ed4f6841bc0550',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22ad7ed4f6841bc0551',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22ad7ed4f6841bc0552',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22bd7ed4f6841bc0553',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22bd7ed4f6841bc0554',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22bd7ed4f6841bc0555',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22bd7ed4f6841bc0556',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22bd7ed4f6841bc0557',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22bd7ed4f6841bc0558',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22bd7ed4f6841bc0559',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22bd7ed4f6841bc055a',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22bd7ed4f6841bc055b',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22bd7ed4f6841bc055c',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22bd7ed4f6841bc055d',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22cd7ed4f6841bc055e',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22cd7ed4f6841bc055f',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22cd7ed4f6841bc0560',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22cd7ed4f6841bc0561',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22cd7ed4f6841bc0562',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22cd7ed4f6841bc0563',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22cd7ed4f6841bc0564',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22cd7ed4f6841bc0565',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e992',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22cd7ed4f6841bc0566',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22cd7ed4f6841bc0567',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22dd7ed4f6841bc0568',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22dd7ed4f6841bc0569',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22dd7ed4f6841bc056a',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22dd7ed4f6841bc056b',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c1062b1b2a4900e990',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22dd7ed4f6841bc056c',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22dd7ed4f6841bc056d',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22dd7ed4f6841bc056e',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22dd7ed4f6841bc056f',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22dd7ed4f6841bc0570',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22dd7ed4f6841bc0571',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e993',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22dd7ed4f6841bc0572',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22ed7ed4f6841bc0573',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22ed7ed4f6841bc0574',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22ed7ed4f6841bc0575',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22ed7ed4f6841bc0576',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99d',
    _id: '5fa2f22ed7ed4f6841bc0577',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e996',
    filmSize: '5f8f58c2062b1b2a4900e99e',
    _id: '5fa2f22ed7ed4f6841bc0578',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c1062b1b2a4900e991',
    _id: '5fa2f22ed7ed4f6841bc0579',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e995',
    _id: '5fa2f22ed7ed4f6841bc057a',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99b',
    _id: '5fa2f22ed7ed4f6841bc057b',
  },
  {
    serviceType: '5f8f58c2062b1b2a4900e998',
    filmType: '5f8f58c2062b1b2a4900e999',
    filmSize: '5f8f58c2062b1b2a4900e99c',
    _id: '5fa2f22fd7ed4f6841bc057c',
  },
];

// import models
const ServiceType = require('./models/serviceType');
const FilmType = require('./models/filmType');
const FilmSize = require('./models/filmSize');
const Service = require('./models/service');

// asyncronous functions
const seedArrayToMongooseModel = (array, mongooseModel) => {
  if (array.length === 0) return console.log('Done seeding.');
  const newMongoObject = new mongooseModel(array[0]);
  newMongoObject.save((err, data) => {
    const newArray = [...array];
    newArray.shift();
    seedArrayToMongooseModel(newArray, mongooseModel);
  });
};

// execution
exports.execute = () => {
  // seeding; run these one at a time
  // you need to paste each piece of data in. idk why.
  // seedArrayToMongooseModel(serviceTypes, ServiceType);
  // seedArrayToMongooseModel(filmTypes, FilmType);
  // seedArrayToMongooseModel(filmSizes, FilmSize);
  // seedArrayToMongooseModel(services, Service);
  return;
};
