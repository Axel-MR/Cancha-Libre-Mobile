// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

/*─────────────────────────────────────────────
  Rutas públicas (no requieren token)
─────────────────────────────────────────────*/
// POST /api/auth/registro
router.post('/registro', authController.crearUsuario);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/renovar-token
router.post('/renovar-token', authController.renovarToken);

/*─────────────────────────────────────────────
  Rutas protegidas (requieren token)
─────────────────────────────────────────────*/
// GET /api/auth/verificar
router.get('/verificar', verificarToken, authController.verificarToken);

// POST /api/auth/logout
router.post('/logout', verificarToken, authController.logout);

module.exports = router;
