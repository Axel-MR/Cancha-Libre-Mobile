require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

// Inicialización
const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',  // Permitir solicitudes de cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));  // Log de peticiones
app.use(express.json({ limit: '50mb' }));  // Aumentar el límite del cuerpo para aceptar grandes cantidades de datos

// Conexión a Prisma (base de datos)
prisma.$connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión a DB:', err));

// Importar y usar rutas
const authRoutes = require('./routes/authRoutes');
const centroDeportivoRoutes = require('./routes/centroDeportivoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
// Corregido: Usar el nombre correcto del archivo
// Opción 1: Si el archivo se llama authRoute.js
// const usuarioRoutes = require('./routes/authRoute');
// Opción 2: Si el archivo se llama usuarioRoutes.js (con una 's' al final)
const usuarioRoutes = require('./routes/usuarioRoutes');
const reservaController = require('./controllers/reservaController');

// Ruta para obtener todas las canchas
app.get('/api/canchas', reservaController.getAllCanchas);

app.use('/api/auth', authRoutes);
app.use('/api/centros-deportivos', centroDeportivoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes); // Configurar rutas de usuario

// Ruta de verificación para comprobar el estado de la API
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Manejo de errores global (cualquier error no manejado se pasa aquí)
app.use((err, req, res, next) => {
  console.error('🔥 Error global:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo:
  - Local: http://localhost:${PORT}
  - Red: http://192.168.100.13:${PORT}`);
});
// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await prisma.$disconnect();  // Desconectar de la base de datos
  process.exit();
});

// Ejemplo de función para crear un nuevo centro deportivo
const crearCentroDeportivo = async (req, res) => {
  try {
    const { nombre, ubicacion, imagenUrl, imagenNombre, imagenTamaño, imagenTipo } = req.body;

    const nuevoCentro = await prisma.centroDeportivo.create({
      data: {
        nombre,
        ubicacion,
        imagenUrl,
        imagenNombre,
        imagenTamaño,
        imagenTipo
      }
    });

    res.status(201).json(nuevoCentro);
  } catch (error) {
    console.error('Error al crear centro deportivo:', error);
    res.status(500).json({ error: 'Error al crear centro deportivo' });
  }
};