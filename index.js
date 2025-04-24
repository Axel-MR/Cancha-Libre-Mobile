const express = require('express');
const app = express();

// Middlewares esenciales PRIMERO
app.use(express.json()); // Para parsear JSON

// Importar rutas DESPUÉS
const authRoutes = require('./routes/authRoutes');

// Registrar rutas
app.use('/api/auth', authRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(3000, '0.0.0.0', () => {
  console.log(`
  🚀 Servidor corriendo:
  - Local: http://localhost:3000
  - Red: http://192.168.0.178:3000
  `);
});