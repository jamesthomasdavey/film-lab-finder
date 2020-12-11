exports.serviceTypes = [
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
