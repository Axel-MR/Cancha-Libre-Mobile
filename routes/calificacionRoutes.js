const express = require('express');
const router  = express.Router();

const {
  /* públicas */
  obtenerCalificacionesCancha,

  /* protegidas */
  obtenerCalificacionUsuario,
  obtenerCalificacionesUsuario, // Asegúrate de que este nombre coincida con el exportado en el controlador
  calificarCancha,
  eliminarCalificacion
} = require('../controllers/calificacionController');

const { verificarToken } = require('../middleware/auth');

/*─────────────────────────────────────────────
  Rutas públicas
─────────────────────────────────────────────*/
// Todas las calificaciones de una cancha
//  GET /api/calificaciones/cancha/:canchaId
router.get('/cancha/:canchaId', obtenerCalificacionesCancha);

/*─────────────────────────────────────────────
  Rutas protegidas (requieren token)
─────────────────────────────────────────────*/
// Calificación del usuario para una cancha específica
//  GET /api/calificaciones/usuario/cancha/:canchaId
router.get('/usuario/cancha/:canchaId', verificarToken, obtenerCalificacionUsuario);

// Todas las calificaciones del usuario autenticado
//  GET /api/calificaciones/usuario
router.get('/usuario', verificarToken, obtenerCalificacionesUsuario);

// Crear o actualizar calificación de una cancha
//  POST /api/calificaciones/cancha/:canchaId
router.post('/cancha/:canchaId', verificarToken, calificarCancha);

// Eliminar (soft-delete) calificación del usuario en una cancha
//  DELETE /api/calificaciones/cancha/:canchaId
router.delete('/cancha/:canchaId', verificarToken, eliminarCalificacion);

module.exports = router;