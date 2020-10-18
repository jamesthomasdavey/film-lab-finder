const ServiceType = require('./models/serviceType');

exports.seedPermanentData = () => {
  // add 'Develop' servicetype
  const develop = new ServiceType({
    name: 'Develop',
  });
  develop.save((err, data) => {
    if (err) {
      console.log(`Error: "Develop" already exists.`);
    } else {
      console.log('Added "Develop" service type.');
    }
    // add 'Develop and scan' servicetype
    const developScan = new ServiceType({
      name: 'Develop and scan',
    });
    developScan.save((err, data) => {
      if (err) {
        console.log(`Error: "Develop and scan" already exists.`);
      } else {
        console.log('Added "Develop and scan" service type.');
      }
      // add 'Develop, scan, and print' servicetype
      const developScanPrint = new ServiceType({
        name: 'Develop, scan, and print',
      });
      developScanPrint.save((err, data) => {
        if (err) {
          console.log(`Error: "Develop, scan, and print" already exists.`);
        } else {
          console.log('Added "Develop, scan, and print" service type.');
        }
      });
    });
  });
};
