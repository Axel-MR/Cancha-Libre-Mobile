const express = require('express');
const router = express.Router();
const { login, crearUsuario } = require('../controllers/authController');

// Rutas de autenticación (sin protección)
router.post('/login', login);
router.post('/registro', crearUsuario);

module.exports = router;