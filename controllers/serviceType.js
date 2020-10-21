const ServiceType = require('../models/serviceType');

// will I ever use this?
exports.create = (req, res) => {
  const serviceType = new ServiceType(req.body);
  serviceType.save().then(data => res.json({ data }));
};
