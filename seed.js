// import models
const ServiceType = require('./models/serviceType');
const FilmType = require('./models/filmType');
const FilmSize = require('./models/filmSize');

const serviceTypes = [
  'Develop',
  'Develop and scan',
  'Develop, scan, and print',
  'Scan',
  'Scan and print',
];

const filmTypes = ['C-41', 'Black and White', 'E-6', 'ECN-2'];

const filmSizes = [
  '35mm',
  '35mm Panoramic',
  '35mm Mounted',
  '120',
  '220',
  '4x5',
  '8x10',
];

const seedServiceTypes = serviceTypes => {
  if (serviceTypes.length === 0) return;
  const newServiceType = new ServiceType({ name: serviceTypes[0] });
  newServiceType.save((err, data) => {
    if (err) {
      console.log(`Service type "${serviceTypes[0]}" already exists.`);
    } else {
      console.log(`Created service type "${serviceTypes[0]}".`);
    }
    const myServiceTypes = [...serviceTypes];
    myServiceTypes.shift();
    seedServiceTypes(myServiceTypes);
  });
};

const seedFilmTypes = filmTypes => {
  if (filmTypes.length === 0) return;
  const newFilmType = new FilmType({ name: filmTypes[0] });
  newFilmType.save((err, data) => {
    if (err) {
      console.log(`Film type "${filmTypes[0]}" already exists.`);
    } else {
      console.log(`Created film type "${filmTypes[0]}".`);
    }
    const myFilmTypes = [...filmTypes];
    myFilmTypes.shift();
    seedFilmTypes(myFilmTypes);
  });
};

const seedFilmSizes = filmSizes => {
  if (filmSizes.length === 0) return;
  const newFilmSize = new FilmSize({ name: filmSizes[0] });
  newFilmSize.save((err, data) => {
    if (err) {
      console.log(`Film size "${filmSizes[0]}" already exists.`);
    } else {
      console.log(`Created film size "${filmSizes[0]}".`);
    }
    const myFilmSizes = [...filmSizes];
    myFilmSizes.shift();
    seedFilmSizes(myFilmSizes);
  });
};

exports.seedAll = () => {
  seedServiceTypes(serviceTypes);
  seedFilmTypes(filmTypes);
  seedFilmSizes(filmSizes);
};
