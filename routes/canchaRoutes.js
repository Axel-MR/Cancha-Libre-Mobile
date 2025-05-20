// routes/canchaRoutes.js
const express = require('express');
const router  = express.Router();

const {
  obtenerCanchas,
  obtenerCanchasPorCentro,
  crearCancha,
  actualizarCancha,
  eliminarCancha
} = require('../controllers/canchaController');

const { verificarToken, verificarAdmin } = require('../middleware/auth');

// ──────────────────────
// Rutas públicas
// ──────────────────────
router.get('/', obtenerCanchas);                 // Obtener todas las canchas
router.get('/centro/:id', obtenerCanchasPorCentro); // Obtener canchas por centro deportivo

// ──────────────────────
// Rutas protegidas
// ──────────────────────
router.post(
  '/centro/:id',
  verificarToken,
  verificarAdmin,
  crearCancha               // Crear cancha en un centro específico
);

router.put(
  '/:id',
  verificarToken,
  verificarAdmin,
  actualizarCancha          // Actualizar cancha
);

router.delete(
  '/:id',
  verificarToken,
  verificarAdmin,
  eliminarCancha            // Eliminar cancha
);

module.exports = router;
