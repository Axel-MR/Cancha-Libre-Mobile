const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear cancha
const crearCancha = async (req, res) => {
  const { nombre, deporte, alumbrado, jugadores, centroDeportivoId } = req.body;

  // Validación mejorada
  if (!nombre || !deporte || alumbrado === undefined || jugadores === undefined || !centroDeportivoId) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios: nombre, deporte, alumbrado, jugadores, centroDeportivoId' 
    });
  }

  try {
    // Verificar existencia del centro deportivo
    const centroExistente = await prisma.centroDeportivo.findUnique({
      where: { id: centroDeportivoId },
    });

    if (!centroExistente) {
      return res.status(404).json({ error: 'Centro deportivo no encontrado' });
    }

    // Validar número de jugadores
    if (jugadores <= 0) {
      return res.status(400).json({ error: 'El número de jugadores debe ser mayor a 0' });
    }

    const nuevaCancha = await prisma.canchas.create({
      data: {
        nombre,
        deporte,
        alumbrado,
        jugadores,
        centroDeportivo: { connect: { id: centroDeportivoId } }
      },
      include: {
        centroDeportivo: true // Incluir relación en la respuesta
      }
    });

    res.status(201).json(nuevaCancha);
  } catch (error) {
    console.error('Error al crear cancha:', error);
    res.status(500).json({ 
      error: 'Error al crear cancha',
      details: error.message 
    });
  }
};

// Obtener todas las canchas
const obtenerCanchas = async (req, res) => {
  try {
    const canchas = await prisma.canchas.findMany({
      include: {
        centroDeportivo: true,
        reservas: true
      }
    });
    res.json(canchas);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener canchas',
      details: error.message 
    });
  }
};

// Obtener cancha por ID
const obtenerCanchaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const cancha = await prisma.canchas.findUnique({
      where: { id },
      include: {
        centroDeportivo: true,
        reservas: {
          include: {
            reservador: true
          }
        }
      }
    });

    if (!cancha) return res.status(404).json({ error: 'Cancha no encontrada' });
    res.json(cancha);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener cancha',
      details: error.message 
    });
  }
};

// Actualizar cancha
const actualizarCancha = async (req, res) => {
  const { id } = req.params;
  const { nombre, deporte, alumbrado, jugadores, centroDeportivoId } = req.body;

  try {
    // Verificar existencia de la cancha
    const canchaExistente = await prisma.canchas.findUnique({ where: { id } });
    if (!canchaExistente) return res.status(404).json({ error: 'Cancha no encontrada' });

    // Verificar nuevo centro deportivo si se provee
    if (centroDeportivoId) {
      const centroExistente = await prisma.centroDeportivo.findUnique({
        where: { id: centroDeportivoId }
      });
      if (!centroExistente) return res.status(404).json({ error: 'Nuevo centro deportivo no existe' });
    }

    const canchaActualizada = await prisma.canchas.update({
      where: { id },
      data: {
        nombre,
        deporte,
        alumbrado,
        jugadores,
        centroDeportivoId: centroDeportivoId || canchaExistente.centroDeportivoId
      },
      include: {
        centroDeportivo: true
      }
    });

    res.json(canchaActualizada);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar cancha',
      details: error.message 
    });
  }
};

// Eliminar cancha
const eliminarCancha = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.canchas.delete({
      where: { id },
      include: {
        reservas: true // Incluir reservas relacionadas
      }
    });
    res.json({ message: 'Cancha eliminada correctamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Cancha no encontrada' });
    } else {
      res.status(500).json({ 
        error: 'Error al eliminar cancha',
        details: error.message 
      });
    }
  }
};

module.exports = {
  crearCancha,
  obtenerCanchas,
  obtenerCanchaPorId,
  actualizarCancha,
  eliminarCancha
};