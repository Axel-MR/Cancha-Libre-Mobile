// routes/reservaRoutes.js
const express = require('express');
const router = express.Router();
const { crearReserva } = require('../controllers/reservaController');

router.post('/', crearReserva); 
module.exports = router;