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

// Crear un nuevo centro deportivo
const crearCentroDeportivo = async (req, res) => {
  const { nombre, ubicacion, imagenBase64 } = req.body;

  if (!nombre || !ubicacion) {
    return res.status(400).json({ 
      success: false,
      error: 'Nombre y ubicación son campos requeridos' 
    });
  }

  try {
    // Procesar imagen
    let imagenUrl = null;
    try {
      imagenUrl = imagenBase64 ? saveBase64Image(imagenBase64, 'centros-deportivos') : null;
    } catch (imageError) {
      return res.status(400).json({
        success: false,
        error: 'Error al procesar la imagen',
        details: imageError.message
      });
    }

    const nuevoCentro = await prisma.centroDeportivo.create({
      data: {
        nombre,
        ubicacion,
        imagenUrl,
        // Metadata de la imagen
        imagenNombre: imagenUrl ? path.basename(imagenUrl) : null,
        imagenTipo: imagenBase64 ? imagenBase64.split(';')[0].split(':')[1] : null,
        imagenTamaño: imagenBase64 ? Buffer.from(imagenBase64.split(',')[1], 'base64').length : null
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...nuevoCentro,
        imagenUrl: imagenUrl ? `${process.env.BASE_URL || ''}${imagenUrl}` : null
      }
    });

  } catch (error) {
    console.error('Error al crear centro deportivo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener todos los centros deportivos
const obtenerCentrosDeportivos = async (req, res) => {
  try {
    const centros = await prisma.centroDeportivo.findMany({
      include: {
        canchas: true,
        reservas: {
          include: {
            cancha: true,
            reservador: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const centrosConImagen = centros.map(centro => ({
      ...centro,
      imagenUrl: centro.imagenUrl ? `${process.env.BASE_URL || ''}${centro.imagenUrl}` : null
    }));

    res.json({
      success: true,
      count: centros.length,
      data: centrosConImagen
    });
  } catch (error) {
    console.error('Error al obtener centros deportivos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener centros deportivos',
      details: error.message
    });
  }
};

// Obtener un centro por ID
const obtenerCentroDeportivoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const centro = await prisma.centroDeportivo.findUnique({
      where: { id },
      include: {
        canchas: true,
        reservas: {
          include: {
            cancha: true,
            reservador: true
          }
        },
        personal: true
      }
    });

    if (!centro) {
      return res.status(404).json({
        success: false,
        error: 'Centro deportivo no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...centro,
        imagenUrl: centro.imagenUrl ? `${process.env.BASE_URL || ''}${centro.imagenUrl}` : null
      }
    });
  } catch (error) {
    console.error('Error al obtener centro deportivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener centro deportivo',
      details: error.message
    });
  }
};

// Actualizar un centro deportivo
const actualizarCentroDeportivo = async (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, imagenBase64 } = req.body;

  try {
    // Verificar si existe el centro
    const centroExistente = await prisma.centroDeportivo.findUnique({ where: { id } });
    if (!centroExistente) {
      return res.status(404).json({
        success: false,
        error: 'Centro deportivo no encontrado'
      });
    }

    // Procesar imagen
    let imagenUrl = centroExistente.imagenUrl;
    let imagenNombre = centroExistente.imagenNombre;
    let imagenTipo = centroExistente.imagenTipo;
    let imagenTamaño = centroExistente.imagenTamaño;

    if (imagenBase64 === '') {
      // Eliminar imagen existente si se envía string vacío
      if (imagenUrl) {
        deleteImageFile(imagenUrl);
        imagenUrl = null;
        imagenNombre = null;
        imagenTipo = null;
        imagenTamaño = null;
      }
    } else if (imagenBase64) {
      // Actualizar imagen si se envía nueva
      try {
        // Eliminar imagen anterior si existe
        if (imagenUrl) {
          deleteImageFile(imagenUrl);
        }

        // Guardar nueva imagen
        imagenUrl = saveBase64Image(imagenBase64, 'centros-deportivos');
        imagenNombre = path.basename(imagenUrl);
        imagenTipo = imagenBase64.split(';')[0].split(':')[1];
        imagenTamaño = Buffer.from(imagenBase64.split(',')[1], 'base64').length;
      } catch (imageError) {
        return res.status(400).json({
          success: false,
          error: 'Error al procesar la imagen',
          details: imageError.message
        });
      }
    }

    const centroActualizado = await prisma.centroDeportivo.update({
      where: { id },
      data: {
        nombre: nombre || centroExistente.nombre,
        ubicacion: ubicacion || centroExistente.ubicacion,
        imagenUrl,
        imagenNombre,
        imagenTipo,
        imagenTamaño,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        ...centroActualizado,
        imagenUrl: centroActualizado.imagenUrl ? `${process.env.BASE_URL || ''}${centroActualizado.imagenUrl}` : null
      }
    });

  } catch (error) {
    console.error('Error al actualizar centro deportivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar centro deportivo',
      details: error.message
    });
  }
};

// Eliminar un centro deportivo
const eliminarCentroDeportivo = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el centro primero para eliminar su imagen
    const centro = await prisma.centroDeportivo.findUnique({ where: { id } });
    if (!centro) {
      return res.status(404).json({
        success: false,
        error: 'Centro deportivo no encontrado'
      });
    }

    // Eliminar imagen asociada si existe
    if (centro.imagenUrl) {
      deleteImageFile(centro.imagenUrl);
    }

    // Eliminar el centro
    await prisma.centroDeportivo.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Centro deportivo eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar centro deportivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar centro deportivo',
      details: error.message
    });
  }
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

module.exports = {
  crearCentroDeportivo,
  obtenerCentrosDeportivos,
  obtenerCentroDeportivoPorId,
  actualizarCentroDeportivo,
  eliminarCentroDeportivo
};