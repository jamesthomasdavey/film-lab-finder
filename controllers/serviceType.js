const ServiceType = require('../models/serviceType');
const { errorHandler } = require('../helpers/dbErrorHandler');

// will I ever use this?
exports.create = (req, res) => {
  const serviceType = new ServiceType(req.body);
  serviceType
    .save()
    .then(data => res.json({ data }))
    .catch(err => res.status(400).json({ error: errorHandler(err) }));
};
