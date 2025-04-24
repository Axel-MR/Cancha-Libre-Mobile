const express = require('express');
const router = express.Router();
const { crearCancha } = require('../controllers/canchasController');

router.post('/', crearCancha);

module.exports = router;