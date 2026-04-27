const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');

// Middleware de API key para el ESP8266
const hardwareAuth = (req, res, next) => {
  const apiKey = req.headers['x-hardware-key'];
  if (apiKey !== process.env.HARDWARE_API_KEY) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  next();
};

router.post('/event', hardwareAuth, hardwareController.handleEvent);

module.exports = router;
