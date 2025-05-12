const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para obtener todas las canchas
const getAllCanchas = async (req, res) => {
  try {
    const canchas = await prisma.cancha.findMany();
    return res.status(200).json({
      success: true,
      data: canchas
    });
  } catch (error) {
    console.error('Error al obtener canchas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener canchas'
    });
  }
};

// Función para crear una reserva
const crearReserva = async (req, res) => {
  try {
    console.log("Datos recibidos en crearReserva:", JSON.stringify(req.body));

    const { fecha, horaInicio, horaFin, canchaId, centroDeportivoId, reservadorId, estado } = req.body;

    if (!fecha || !horaInicio || !horaFin || !canchaId || !centroDeportivoId) {
      console.log("Faltan datos requeridos:", { fecha, horaInicio, horaFin, canchaId, centroDeportivoId });
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos para crear la reserva'
      });
    }

    let fechaObj, horaInicioObj, horaFinObj;

    try {
      fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) throw new Error(`Fecha inválida: ${fecha}`);

      horaInicioObj = new Date(horaInicio);
      if (isNaN(horaInicioObj.getTime())) throw new Error(`Hora inicio inválida: ${horaInicio}`);

      horaFinObj = new Date(horaFin);
      if (isNaN(horaFinObj.getTime())) throw new Error(`Hora fin inválida: ${horaFin}`);

      console.log("Fechas convertidas:", {
        fechaObj: fechaObj.toISOString(),
        horaInicioObj: horaInicioObj.toISOString(),
        horaFinObj: horaFinObj.toISOString()
      });
    } catch (error) {
      console.error("Error al convertir fechas:", error);
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido',
        details: error.message
      });
    }

    console.log("Intentando crear reserva con:", {
      fecha: fechaObj,
      horaInicio: horaInicioObj,
      horaFin: horaFinObj,
      canchaId,
      centroDeportivoId,
      reservadorId: reservadorId || null,
      estado: estado || 'RESERVADO'
    });

    const nuevaReserva = await prisma.Reserva.create({
      data: {
        fecha: fechaObj,
        horaInicio: horaInicioObj,
        horaFin: horaFinObj,
        canchaId,
        centroDeportivoId,
        reservadorId: reservadorId || null,
        estado: estado || 'RESERVADO'
      }
    });

    console.log("Reserva creada exitosamente:", nuevaReserva);

    return res.status(201).json({
      success: true,
      data: nuevaReserva
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear la reserva',
      details: error.message
    });
  }
};

// Función para obtener todas las reservas
const obtenerReservas = async (req, res) => {
  try {
    const reservas = await prisma.Reserva.findMany({
      include: {
        cancha: true,
        centroDeportivo: true,
        reservador: true
      }
    });

    res.status(200).json({
      success: true,
      data: reservas
    });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas',
      details: error.message
    });
  }
};

// Función para obtener las reservas disponibles
const obtenerReservasDisponibles = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const reservas = await prisma.Reserva.findMany({
      where: {
        reservadorId: null,
        fecha: {
          gte: hoy
        }
      },
      include: {
        cancha: true,
        centroDeportivo: true
      }
    });

    res.status(200).json({
      success: true,
      data: reservas
    });
  } catch (error) {
    console.error('Error al obtener reservas disponibles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reservas disponibles',
      details: error.message
    });
  }
};

// Función para actualizar una reserva
const actualizarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { reservadorId, estado } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID de la reserva'
      });
    }

    console.log(`Actualizando reserva ${id} con:`, { reservadorId, estado });

    const reservaActualizada = await prisma.Reserva.update({
      where: { id },
      data: {
        reservadorId,
        estado
      }
    });

    console.log("Reserva actualizada exitosamente:", reservaActualizada);

    return res.status(200).json({
      success: true,
      data: reservaActualizada
    });
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar la reserva',
      details: error.message
    });
  }
};

// Función para obtener las reservas de un usuario específico
const obtenerReservasUsuario = async (req, res) => {
  try {
      const userId = req.user.userId; // Obtener el ID del usuario del token
      
      const reservas = await prisma.Reserva.findMany({
          where: {
              reservadorId: userId
          },
          include: {
              cancha: true,
              centroDeportivo: true,
              objetosRentados: true
          },
          orderBy: {
              fecha: 'desc'
          }
      });
      
      res.status(200).json({
          success: true,
          data: reservas
      });
  } catch (error) {
      console.error('Error al obtener reservas del usuario:', error);
      res.status(500).json({
          success: false,
          error: 'Error al obtener reservas del usuario',
          details: error.message
      });
  }
};

// Exporta todas las funciones
module.exports = {
  crearReserva,
  obtenerReservas,
  obtenerReservasDisponibles,
  actualizarReserva,
  obtenerReservasUsuario,
  getAllCanchas
};
