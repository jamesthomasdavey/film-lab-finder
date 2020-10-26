const thenBy = require('thenby');

module.exports = servicesArray => {
  servicesArray.sort(
    thenBy.firstBy('serviceType').thenBy('filmType').thenBy('filmSize')
  );
};
