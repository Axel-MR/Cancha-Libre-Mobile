const express = require('express');
const router = express.Router();
const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  eliminarUsuario,
  actualizarUsuario
} = require('../controllers/usuarioController');

// Proteger rutas con middleware de autenticación
const authMiddleware = require('../middleware/auth');

router.post('/', crearUsuario);
router.get('/', authMiddleware, obtenerUsuarios);
router.get('/:id', authMiddleware, obtenerUsuarioPorId);
router.delete('/:id', authMiddleware, eliminarUsuario);
router.put('/:id', authMiddleware, actualizarUsuario);

module.exports = router;