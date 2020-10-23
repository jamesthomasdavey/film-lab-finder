const express = require('express');
const router = express.Router();

const Lab = require('../models/lab');
const Service = require('../models/service');

// @route   get /api/labs/:labId/edit-services
// @desc    returns all available services, noting which ones the lab offers
// @access  private
router.get('/labs/:labId/edit-services', (req, res) => {
  Service.find({}).then(foundServices => {
    //
  });
});

// @route   post /api/labs/new
// @desc    creates a new lab based on parameters
// @access  private
router.post('/labs/new', (req, res) => {
  const newLab = new Lab({
    // hardcode this info for now
    name: 'Dummy Lab',
    ownedBy: '5f90955a2d099157b72fed1e',
  });
});
