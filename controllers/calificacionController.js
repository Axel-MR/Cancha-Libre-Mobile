const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener calificación de un usuario para una cancha específica
const obtenerCalificacionUsuario = async (req, res) => {
  const { canchaId } = req.params;
  const usuarioId = req.user.id; // Asumiendo que tienes middleware de autenticación

  try {
    const calificacion = await prisma.calificacion.findUnique({
      where: {
        canchaId_usuarioId: {
          canchaId,
          usuarioId
        }
      }
    });

    res.status(200).json({
      success: true,
      data: calificacion ? calificacion.valor : 0
    });
  } catch (error) {
    console.error('Error al obtener calificación del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener calificación',
      details: error.message
    });
  }
};

// Obtener todas las calificaciones de una cancha
const obtenerCalificacionesCancha = async (req, res) => {
  const { canchaId } = req.params;

  try {
    const calificaciones = await prisma.calificacion.findMany({
      where: {
        canchaId,
        estado: 'ACTIVA'
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener el promedio y total de la cancha
    const cancha = await prisma.cancha.findUnique({
      where: { id: canchaId },
      select: {
        calificacionPromedio: true,
        totalCalificaciones: true
      }
    });

    if (!cancha) {
      return res.status(404).json({
        success: false,
        error: 'Cancha no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        calificaciones,
        promedio: cancha.calificacionPromedio,
        total: cancha.totalCalificaciones
      }
    });
  } catch (error) {
    console.error('Error al obtener calificaciones de la cancha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener calificaciones',
      details: error.message
    });
  }
};

// Calificar una cancha (crear o actualizar calificación)
const calificarCancha = async (req, res) => {
  const { canchaId } = req.params;
  const { valor } = req.body;
  const usuarioId = req.user.id; // Asumiendo que tienes middleware de autenticación

  try {
    // Validar que la calificación sea un múltiplo de 0.5 entre 0.5 y 5
    const rating = parseFloat(valor);
    if (isNaN(rating) || rating < 0.5 || rating > 5 || (rating * 10) % 5 !== 0) {
      return res.status(400).json({
        success: false,
        error: 'La calificación debe ser un múltiplo de 0.5 entre 0.5 y 5'
      });
    }

    // Verificar que la cancha existe
    const cancha = await prisma.cancha.findUnique({
      where: { id: canchaId }
    });

    if (!cancha) {
      return res.status(404).json({
        success: false,
        error: 'Cancha no encontrada'
      });
    }

    // Iniciar transacción
    const result = await prisma.$transaction(async (tx) => {
      // Verificar si el usuario ya calificó esta cancha
      const existingRating = await tx.calificacion.findUnique({
        where: {
          canchaId_usuarioId: {
            canchaId,
            usuarioId
          }
        }
      });

      let calificacion;
      
      if (existingRating) {
        // Actualizar calificación existente
        calificacion = await tx.calificacion.update({
          where: {
            id: existingRating.id
          },
          data: {
            valor: rating,
            estado: 'ACTIVA',
            updatedAt: new Date()
          }
        });
      } else {
        // Crear nueva calificación
        calificacion = await tx.calificacion.create({
          data: {
            canchaId,
            usuarioId,
            valor: rating,
            estado: 'ACTIVA'
          }
        });
      }

      // Recalcular promedio y total
      const calificaciones = await tx.calificacion.findMany({
        where: {
          canchaId,
          estado: 'ACTIVA'
        },
        select: {
          valor: true
        }
      });

      const total = calificaciones.length;
      const suma = calificaciones.reduce((acc, curr) => acc + curr.valor, 0);
      const promedio = total > 0 ? suma / total : 0;

      // Actualizar cancha con nuevo promedio y total
      const canchaActualizada = await tx.cancha.update({
        where: {
          id: canchaId
        },
        data: {
          calificacionPromedio: promedio,
          totalCalificaciones: total
        }
      });

      return {
        calificacion,
        promedio,
        total
      };
    });

    res.status(200).json({
      success: true,
      data: {
        calificacion: result.calificacion,
        promedio: result.promedio,
        total: result.total
      },
      message: 'Calificación guardada correctamente'
    });
  } catch (error) {
    console.error('Error al calificar cancha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calificar cancha',
      details: error.message
    });
  }
};

// Eliminar calificación
const eliminarCalificacion = async (req, res) => {
  const { canchaId } = req.params;
  const usuarioId = req.user.id; // Asumiendo que tienes middleware de autenticación

  try {
    // Iniciar transacción
    const result = await prisma.$transaction(async (tx) => {
      // Verificar si existe la calificación
      const calificacion = await tx.calificacion.findUnique({
        where: {
          canchaId_usuarioId: {
            canchaId,
            usuarioId
          }
        }
      });

      if (!calificacion) {
        return {
          success: false,
          code: 404,
          error: 'Calificación no encontrada'
        };
      }

      // Cambiar estado a ELIMINADA en lugar de borrar físicamente
      await tx.calificacion.update({
        where: {
          id: calificacion.id
        },
        data: {
          estado: 'ELIMINADA',
          updatedAt: new Date()
        }
      });

      // Recalcular promedio y total
      const calificaciones = await tx.calificacion.findMany({
        where: {
          canchaId,
          estado: 'ACTIVA'
        },
        select: {
          valor: true
        }
      });

      const total = calificaciones.length;
      const suma = calificaciones.reduce((acc, curr) => acc + curr.valor, 0);
      const promedio = total > 0 ? suma / total : 0;

      // Actualizar cancha con nuevo promedio y total
      await tx.cancha.update({
        where: {
          id: canchaId
        },
        data: {
          calificacionPromedio: promedio,
          totalCalificaciones: total
        }
      });

      return {
        success: true,
        promedio,
        total
      };
    });

    if (!result.success) {
      return res.status(result.code).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        promedio: result.promedio,
        total: result.total
      },
      message: 'Calificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar calificación',
      details: error.message
    });
  }
};

// Obtener todas las calificaciones del usuario actual
// Cambiado de getCalificacionesUsuario a obtenerCalificacionesUsuario para mantener consistencia
const obtenerCalificacionesUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Obtenido del middleware de autenticación
    
    const calificaciones = await prisma.calificacion.findMany({
      where: {
        usuarioId: usuarioId,
        estado: 'ACTIVA'
      },
      select: {
        id: true,
        canchaId: true,
        valor: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.status(200).json({
      success: true,
      data: calificaciones
    });
  } catch (error) {
    console.error("Error al obtener calificaciones del usuario:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener calificaciones del usuario",
      details: error.message
    });
  }
};

module.exports = {
  obtenerCalificacionUsuario,
  obtenerCalificacionesCancha,
  calificarCancha,
  eliminarCalificacion,
  obtenerCalificacionesUsuario // Cambiado para mantener consistencia
};