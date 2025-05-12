const express = require('express');
const router = express.Router();
const {
  crearCentroDeportivo,
  obtenerCentrosDeportivos,
  obtenerCentroDeportivoPorId,
  actualizarCentroDeportivo,
  eliminarCentroDeportivo
} = require('../controllers/centroDeportivoController');

// Importamos los controladores de canchas (que deberás crear)
const {
  obtenerCanchasPorCentro,
  crearCancha,
  actualizarCancha,
  eliminarCancha
} = require('../controllers/canchaController');

// Configuración de Multer para imágenes
const multer = require('multer');
const upload = multer({ dest: 'uploads/centros-deportivos/' });

// Rutas para centros deportivos
router.get('/', obtenerCentrosDeportivos); // Listar todos los centros
router.get('/:id', obtenerCentroDeportivoPorId); // Obtener un centro específico
router.post('/', upload.single('imagen'), crearCentroDeportivo); // Crear nuevo centro
router.put('/:id', upload.single('imagen'), actualizarCentroDeportivo); // Actualizar centro
router.delete('/:id', eliminarCentroDeportivo); // Eliminar centro

// Rutas para canchas (anidadas bajo centros deportivos)
router.get('/:id/canchas', obtenerCanchasPorCentro); // Listar canchas de un centro
router.post('/:id/canchas', crearCancha); // Crear nueva cancha para un centro

// Nota: Las rutas de actualizar y eliminar canchas pueden ir aquí o en una ruta separada
// Como tienes mencionado en tu código de React Native una ruta /canchas/:id para eliminar:
router.delete('/canchas/:id', eliminarCancha); // Eliminar cancha

module.exports = router;