const express = require('express');
const router = express.Router();
const {
  crearCentroDeportivo,
  obtenerCentrosDeportivos,
  obtenerCentroDeportivoPorId,
  actualizarCentroDeportivo,
  eliminarCentroDeportivo
} = require('../controllers/centroDeportivoController');

// Configuración de Multer para imágenes
const multer = require('multer');
const upload = multer({ dest: 'uploads/centros-deportivos/' });

// Rutas GET
router.get('/', obtenerCentrosDeportivos); // Listar todos los centros
router.get('/:id', obtenerCentroDeportivoPorId); // Obtener un centro específico

// Rutas que modifican datos
router.post('/', upload.single('imagen'), crearCentroDeportivo); // Crear nuevo centro
router.put('/:id', upload.single('imagen'), actualizarCentroDeportivo); // Actualizar centro
router.delete('/:id', eliminarCentroDeportivo); // Eliminar centro

module.exports = router;