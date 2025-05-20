const express = require('express');
const router = express.Router();

// Importar rutas específicas
const canchaRoutes = require('./canchaRoutes');
const calificacionRoutes = require('./calificacionRoutes');

// Montar las rutas en sus respectivos prefijos
router.use('/canchas', canchaRoutes);
router.use('/calificaciones', calificacionRoutes);

module.exports = router;