const ServiceType = require('../models/serviceType');
const { errorHandler } = require('../helpers/dbErrorHandler');

// will I ever use this?
exports.create = (req, res) => {
  const serviceType = new ServiceType(req.body);
  serviceType.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({ data });
  });
};
