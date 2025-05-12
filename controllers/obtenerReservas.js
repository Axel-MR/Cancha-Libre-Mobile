// Función para obtener las reservas disponibles
const obtenerReservasDisponibles = async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Cambiar el filtro para buscar por estado en lugar de reservadorId
        const reservas = await prisma.Reserva.findMany({
            where: {
                estado: 'DISPONIBLE', // Filtrar por estado en lugar de reservadorId
                fecha: {
                    gte: hoy
                }
            },
            include: {
                cancha: true,
                centroDeportivo: true
            }
        });
        
        console.log(`Se encontraron ${reservas.length} reservas disponibles`);
        
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