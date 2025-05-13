require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Inicialización
const app = express();
const prisma = new PrismaClient();

// Middleware manual para CORS (puede ser redundante si usas cors(), pero lo incluyo como pediste)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

// Conexión a Prisma
prisma.$connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión a DB:', err));

// Rutas
const authRoutes = require('./routes/authRoutes');
const centroDeportivoRoutes = require('./routes/centroDeportivoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const reservaController = require('./controllers/reservaController');

// Endpoints
app.get('/api/canchas', reservaController.getAllCanchas);
app.use('/api/auth', authRoutes);
app.use('/api/centros-deportivos', centroDeportivoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Manejo de errores global
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

// Cierre limpio
process.on('SIGINT', async () => {
  await prisma.$disconnect();
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
