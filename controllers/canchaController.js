const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper para manejar imágenes base64
const saveBase64Image = (base64String, folder) => {
  if (!base64String) return null;
  
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato de imagen no válido');
  }

  const type = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  const extension = type.split('/')[1] || 'png';
  const filename = `${uuidv4()}.${extension}`;
  const uploadPath = path.join(__dirname, '../../public/uploads', folder, filename);

  // Crear directorio si no existe
  if (!fs.existsSync(path.dirname(uploadPath))) {
    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
  }

  fs.writeFileSync(uploadPath, buffer);
  return `/uploads/${folder}/${filename}`;
};

// Helper para eliminar archivos de imagen
const deleteImageFile = (imagePath) => {
  try {
    const fullPath = path.join(__dirname, '../../public', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error al eliminar archivo de imagen:', error);
  }
};

// Obtener canchas
const obtenerCanchas = async (req, res) => {
    try {
        const canchas = await prisma.Cancha.findMany({
            include: {
                centroDeportivo: true // Incluir los datos del centro deportivo
            }
        });
        
        res.status(200).json({
            success: true,
            data: canchas
        });
    } catch (error) {
        console.error('Error al obtener canchas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener canchas',
            details: error.message
        });
    }
};

// Obtener canchas por centro deportivo
const obtenerCanchasPorCentro = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar que el centro deportivo existe
        const centroDeportivo = await prisma.CentroDeportivo.findUnique({
            where: { id }
        });
        
        if (!centroDeportivo) {
            return res.status(404).json({
                success: false,
                error: 'Centro deportivo no encontrado'
            });
        }
        
        const canchas = await prisma.Cancha.findMany({
            where: {
                centroDeportivoId: id
            }
        });
        
        res.status(200).json({
            success: true,
            data: canchas
        });
    } catch (error) {
        console.error('Error al obtener canchas por centro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener canchas',
            details: error.message
        });
    }
};

// Crear nueva cancha
const crearCancha = async (req, res) => {
  const { id: centroDeportivoId } = req.params;
  const { nombre, deporte, alumbrado, jugadores, imagenBase64 } = req.body;

  if (!nombre || !deporte || !jugadores) {
    return res.status(400).json({ 
      success: false,
      error: 'Nombre, deporte y número de jugadores son campos requeridos' 
    });
  }

  try {
    // Verificar que el centro deportivo existe
    const centroExiste = await prisma.CentroDeportivo.findUnique({
      where: { id: centroDeportivoId }
    });

    if (!centroExiste) {
      return res.status(404).json({
        success: false,
        error: 'Centro deportivo no encontrado'
      });
    }

    // Procesar imagen
    let imagenUrl = null;
    try {
      imagenUrl = imagenBase64 ? saveBase64Image(imagenBase64, 'canchas') : null;
    } catch (imageError) {
      return res.status(400).json({
        success: false,
        error: 'Error al procesar la imagen',
        details: imageError.message
      });
    }

    const nuevaCancha = await prisma.Cancha.create({
      data: {
        nombre,
        deporte,
        alumbrado: alumbrado === true || alumbrado === 'true',
        jugadores: parseInt(jugadores),
        imagenUrl,
        centroDeportivo: {
          connect: { id: centroDeportivoId }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...nuevaCancha,
        imagenUrl: imagenUrl ? `${process.env.BASE_URL || ''}${imagenUrl}` : null
      }
    });

  } catch (error) {
    console.error('Error al crear cancha:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al crear cancha',
      details: error.message 
    });
  }
};

// Actualizar cancha
const actualizarCancha = async (req, res) => {
  const { id } = req.params;
  const { nombre, deporte, alumbrado, jugadores, imagenBase64 } = req.body;

  try {
    // Verificar si existe la cancha
    const canchaExistente = await prisma.Cancha.findUnique({ where: { id } });
    if (!canchaExistente) {
      return res.status(404).json({
        success: false,
        error: 'Cancha no encontrada'
      });
    }

    // Procesar imagen
    let imagenUrl = canchaExistente.imagenUrl;

    if (imagenBase64 === '') {
      // Eliminar imagen existente si se envía string vacío
      if (imagenUrl) {
        deleteImageFile(imagenUrl);
        imagenUrl = null;
      }
    } else if (imagenBase64) {
      // Actualizar imagen si se envía nueva
      try {
        // Eliminar imagen anterior si existe
        if (imagenUrl) {
          deleteImageFile(imagenUrl);
        }

        // Guardar nueva imagen
        imagenUrl = saveBase64Image(imagenBase64, 'canchas');
      } catch (imageError) {
        return res.status(400).json({
          success: false,
          error: 'Error al procesar la imagen',
          details: imageError.message
        });
      }
    }

    const canchaActualizada = await prisma.Cancha.update({
      where: { id },
      data: {
        nombre: nombre || canchaExistente.nombre,
        deporte: deporte || canchaExistente.deporte,
        alumbrado: alumbrado !== undefined ? (alumbrado === true || alumbrado === 'true') : canchaExistente.alumbrado,
        jugadores: jugadores ? parseInt(jugadores) : canchaExistente.jugadores,
        imagenUrl,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        ...canchaActualizada,
        imagenUrl: canchaActualizada.imagenUrl ? `${process.env.BASE_URL || ''}${canchaActualizada.imagenUrl}` : null
      }
    });

  } catch (error) {
    console.error('Error al actualizar cancha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cancha',
      details: error.message
    });
  }
};

// Eliminar cancha
const eliminarCancha = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la cancha primero para eliminar su imagen
    const cancha = await prisma.Cancha.findUnique({ where: { id } });
    if (!cancha) {
      return res.status(404).json({
        success: false,
        error: 'Cancha no encontrada'
      });
    }

    // Eliminar imagen asociada si existe
    if (cancha.imagenUrl) {
      deleteImageFile(cancha.imagenUrl);
    }

    // Eliminar la cancha
    await prisma.Cancha.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Cancha eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar cancha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cancha',
      details: error.message
    });
  }
};

module.exports = {
  obtenerCanchas,
  obtenerCanchasPorCentro,
  crearCancha,
  actualizarCancha,
  eliminarCancha
};
