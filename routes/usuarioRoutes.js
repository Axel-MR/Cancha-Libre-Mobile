const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');

// Importar middleware de autenticación
const authMiddleware = require('../middleware/auth');

// Todas las rutas de usuarios están protegidas
router.get('/', authMiddleware, obtenerUsuarios);
router.get('/:id', authMiddleware, obtenerUsuarioPorId);
router.put('/:id', authMiddleware, actualizarUsuario);
router.delete('/:id', authMiddleware, eliminarUsuario);

module.exports = router;