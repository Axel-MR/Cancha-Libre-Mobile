const express = require('express');
const router = express.Router();
const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  eliminarUsuario,
  actualizarUsuario,
  iniciarSesion
} = require('../controllers/usuarioController');

const authMiddleware = require('../middleware/auth');

// Ruta de login (sin protección)
router.post('/login', iniciarSesion);

// Rutas protegidas
router.post('/registro', crearUsuario);
router.get('/', authMiddleware, obtenerUsuarios);
router.get('/:id', authMiddleware, obtenerUsuarioPorId);
router.delete('/:id', authMiddleware, eliminarUsuario);
router.put('/:id', authMiddleware, actualizarUsuario);

module.exports = router;