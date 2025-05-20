require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const helmet  = require('helmet');
const path    = require('path');
const { PrismaClient } = require('@prisma/client');

const app    = express();
const prisma = new PrismaClient();

/* ──────────────────────────────
 *  Middleware global
 * ────────────────────────────── */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

/* ──────────────────────────────
 *  Conexión a BD
 * ────────────────────────────── */
prisma
  .$connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión a DB:', err));

/* ──────────────────────────────
 *  Rutas API
 * ────────────────────────────── */
// Rutas agrupadas (incluye canchas y calificaciones)
const apiRoutes            = require('./routes'); // <── NUEVO: índice de rutas
// Resto de rutas existentes
const authRoutes           = require('./routes/authRoutes');
const centroRoutes         = require('./routes/centroDeportivoRoutes');
const reservaRoutes        = require('./routes/reservaRoutes');
const usuarioRoutes        = require('./routes/usuarioRoutes');
const reservaController    = require('./controllers/reservaController');

// Endpoints básicos
app.get('/api/canchas', reservaController.getAllCanchas);

// Enrutamiento modular
app.use('/api', apiRoutes);                        // <── NUEVO: /api/canchas, /api/calificaciones
app.use('/api/auth', authRoutes);
app.use('/api/centros-deportivos', centroRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Endpoint de salud
app.get('/api/status', (_, res) =>
  res.json({ status: 'ok', message: 'API funcionando correctamente' })
);

/* ──────────────────────────────
 *  Manejo de errores global
 * ────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('🔥 Error global:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

/* ──────────────────────────────
 *  Servidor
 * ────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Servidor corriendo:
  - Local: http://localhost:${PORT}
  - Red:   http://192.168.0.178:${PORT}`)
);

/* ──────────────────────────────
 *  Cierre limpio
 * ────────────────────────────── */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

/* ──────────────────────────────
 *  Ejemplo de creación de centro
 * ────────────────────────────── */
const crearCentroDeportivo = async (req, res) => {
  try {
    const {
      nombre,
      ubicacion,
      imagenUrl,
      imagenNombre,
      imagenTamaño,
      imagenTipo
    } = req.body;

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
