// routes/canchaRoutes.js
const express = require('express');
const router = express.Router();
const { 
    obtenerCanchas, 
    obtenerCanchasPorCentro 
} = require('../controllers/canchaController');

router.get('/', obtenerCanchas); // Obtener todas las canchas
router.get('/centro/:id', obtenerCanchasPorCentro); // Obtener canchas por centro deportivo

module.exports = router;