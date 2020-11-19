// import data to be seeded
// const serviceTypes = require('./seed-data/serviceTypes');
// const filmTypes = require('./seed-data/filmTypes');
// const filmSizes = require('./seed-data/filmSizes');
// const services = require('./seed-data/services');

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
  // seeding; run these one at a time maybe
  // you need to paste each piece of data in. idk why.
  // seedArrayToMongooseModel(serviceTypes, ServiceType);
  // seedArrayToMongooseModel(filmTypes, FilmType);
  // seedArrayToMongooseModel(filmSizes, FilmSize);
  // seedArrayToMongooseModel(services, Service);
  return;
};
