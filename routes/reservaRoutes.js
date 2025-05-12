// routes/reservaRoutes.js
const express = require('express');
const router = express.Router();
const { 
    crearReserva, 
    obtenerReservas, 
    obtenerReservasDisponibles,
    actualizarReserva,
    obtenerReservasUsuario // Añadir esta función a la importación
} = require('../controllers/reservaController');

router.get('/', obtenerReservas); // Obtener todas las reservas
router.get('/disponibles', obtenerReservasDisponibles); // Obtener reservas disponibles
router.post('/', crearReserva); // Crear una nueva reserva
router.get('/usuario', obtenerReservasUsuario);
router.put('/:id', actualizarReserva); // Nueva ruta para actualizar una reserva

module.exports = router;