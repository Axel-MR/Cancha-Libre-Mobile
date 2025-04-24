// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check } = require('express-validator'); // Instálalo con npm install express-validator

router.get('/', authController.status);

router.post('/registro', [
  check('correo').isEmail().normalizeEmail(),
  check('clave').isLength({ min: 6 }),
  check('nombre').not().isEmpty().trim(),
  check('telefono').isLength({ min: 10, max: 10 }),
  check('clave_ine').not().isEmpty()
], authController.registro);

router.post('/login', authController.login); 

module.exports = router;