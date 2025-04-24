const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crearReserva = async (req, res) => {
    const { 
        fecha, 
        horaInicio, 
        horaFin, 
        canchaId, 
        centroDeportivoId, 
        reservadorId,
        responsableId,
        objetosRentadosIds  // IDs de los objetos a rentar
    } = req.body;

    // Validación de campos obligatorios actualizados
    if (!fecha || !horaInicio || !horaFin || !canchaId || 
        !centroDeportivoId || !reservadorId || !responsableId) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // Verificar existencia de todas las entidades relacionadas
        const [cancha, centroDeportivo, reservador, responsable] = await Promise.all([
            prisma.canchas.findUnique({ where: { id: canchaId } }),
            prisma.centroDeportivo.findUnique({ where: { id: centroDeportivoId } }),
            prisma.usuarios.findUnique({ where: { id: reservadorId } }),
            prisma.usuarios.findUnique({ where: { id: responsableId } }) // Nuevo campo
        ]);

        if (!cancha) return res.status(404).json({ error: 'Cancha no encontrada' });
        if (!centroDeportivo) return res.status(404).json({ error: 'Centro deportivo no encontrado' });
        if (!reservador) return res.status(404).json({ error: 'Usuario reservador no encontrado' });
        if (!responsable) return res.status(404).json({ error: 'Responsable no encontrado' });

        // Crear reserva con todas las relaciones
        const nuevaReserva = await prisma.reserva.create({
            data: {
                fecha: new Date(fecha),
                horaInicio: new Date(horaInicio),
                horaFin: new Date(horaFin),
                centroDeportivo: { connect: { id: centroDeportivoId } },
                cancha: { connect: { id: canchaId } },
                reservador: { connect: { id: reservadorId } },
                responsable: { connect: { id: responsableId } }, // Nueva relación
                objetosRentados: {
                    connect: objetosRentadosIds?.map(id => ({ id })) || [] // Conectar objetos existentes
                }
            },
            include: {
                cancha: true,
                centroDeportivo: true,
                reservador: true,
                responsable: true, // Incluir responsable en la respuesta
                objetosRentados: true // Incluir objetos rentados
            }
        });

        res.json(nuevaReserva);
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ 
            error: 'Error al crear reserva', 
            details: error.message 
        });
    }
};

module.exports = { crearReserva };