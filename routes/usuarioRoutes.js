const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');

// Importar middleware de autenticación - corregido para desestructurar la función verificarToken
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas de usuarios están protegidas - usando verificarToken en lugar de authMiddleware
router.get('/', verificarToken, obtenerUsuarios);
router.get('/:id', verificarToken, obtenerUsuarioPorId);
router.put('/:id', verificarToken, actualizarUsuario);
router.delete('/:id', verificarToken, eliminarUsuario);

module.exports = router;