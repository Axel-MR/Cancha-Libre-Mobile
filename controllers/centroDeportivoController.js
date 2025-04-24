const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear un nuevo centro deportivo con soporte para imágenes
const crearCentroDeportivo = async (req, res) => {
  const { nombre, ubicacion, canchasIds, personalIds } = req.body;

  if (!nombre || !ubicacion) {
    return res.status(400).json({ error: 'Nombre y ubicación son requeridos' });
  }

  try {
    // Verificar existencia de canchas y personal si se proporcionan
    if (canchasIds) {
      const canchasExistentes = await prisma.canchas.count({
        where: { id: { in: canchasIds } }
      });
      if (canchasExistentes !== canchasIds.length) {
        return res.status(404).json({ error: 'Alguna cancha no existe' });
      }
    }

    if (personalIds) {
      const personalExistente = await prisma.usuarios.count({
        where: { id: { in: personalIds }, rol: 'PERSONAL' }
      });
      if (personalExistente !== personalIds.length) {
        return res.status(404).json({ error: 'Algún personal no existe o no tiene rol válido' });
      }
    }

    // Procesar la imagen si existe
    const imagenUrl = req.file ? `/uploads/centros-deportivos/${req.file.filename}` : null;

    const nuevoCentro = await prisma.centroDeportivo.create({
      data: {
        nombre,
        ubicacion,
        imagenUrl, // Añadido el campo de imagen
        canchas: canchasIds ? { connect: canchasIds.map(id => ({ id })) } : undefined,
        personal: personalIds ? { connect: personalIds.map(id => ({ id })) } : undefined
      },
      include: {
        canchas: true,
        personal: true
      }
    });

    res.status(201).json(nuevoCentro);
  } catch (error) {
    // Eliminar la imagen subida si hubo un error
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../public', req.file.path);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo temporal:', err);
      });
    }
    
    res.status(500).json({ 
      error: 'Error al crear centro deportivo',
      details: error.message
    });
  }
};

// Obtener todos los centros deportivos (actualizado para incluir imagen)
const obtenerCentrosDeportivos = async (req, res) => {
  try {
    const centros = await prisma.centroDeportivo.findMany({
      include: {
        canchas: true,
        personal: true,
        reservas: true
      }
    });
    
    // Transformar URLs de imagen si es necesario
    const centrosConImagen = centros.map(centro => ({
      ...centro,
      imagenUrl: centro.imagenUrl ? `${process.env.BASE_URL}${centro.imagenUrl}` : null
    }));

    res.json(centrosConImagen);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener centros', details: error.message });
  }
};

// Obtener un centro por ID (actualizado para incluir imagen)
const obtenerCentroDeportivoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const centro = await prisma.centroDeportivo.findUnique({
      where: { id },
      include: {
        canchas: true,
        personal: true,
        reservas: {
          include: {
            cancha: true,
            reservador: true
          }
        }
      }
    });

    if (!centro) return res.status(404).json({ error: 'Centro no encontrado' });
    
    // Añadir URL completa de la imagen
    const centroConImagen = {
      ...centro,
      imagenUrl: centro.imagenUrl ? `${process.env.BASE_URL}${centro.imagenUrl}` : null
    };

    res.json(centroConImagen);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener centro', details: error.message });
  }
};

// Actualizar un centro deportivo con soporte para imágenes
const actualizarCentroDeportivo = async (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, canchasIds, personalIds } = req.body;

  try {
    // Verificar existencia del centro
    const centroExistente = await prisma.centroDeportivo.findUnique({ where: { id } });
    if (!centroExistente) return res.status(404).json({ error: 'Centro no encontrado' });

    // Procesar nueva imagen si se subió
    const nuevaImagenUrl = req.file ? `/uploads/centros-deportivos/${req.file.filename}` : undefined;

    const centroActualizado = await prisma.centroDeportivo.update({
      where: { id },
      data: {
        nombre,
        ubicacion,
        imagenUrl: nuevaImagenUrl !== undefined ? nuevaImagenUrl : centroExistente.imagenUrl,
        canchas: canchasIds ? { set: canchasIds.map(id => ({ id })) } : undefined,
        personal: personalIds ? { set: personalIds.map(id => ({ id })) } : undefined
      },
      include: {
        canchas: true,
        personal: true
      }
    });

    // Eliminar imagen anterior si se subió una nueva
    if (req.file && centroExistente.imagenUrl) {
      const fs = require('fs');
      const path = require('path');
      const oldImagePath = path.join(__dirname, '../../public', centroExistente.imagenUrl);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('Error al eliminar imagen anterior:', err);
      });
    }

    res.json({
      ...centroActualizado,
      imagenUrl: centroActualizado.imagenUrl ? `${process.env.BASE_URL}${centroActualizado.imagenUrl}` : null
    });
  } catch (error) {
    // Eliminar la imagen subida si hubo un error
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../public', req.file.path);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo temporal:', err);
      });
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar centro', 
      details: error.message 
    });
  }
};

// Eliminar un centro deportivo (actualizado para eliminar imagen asociada)
const eliminarCentroDeportivo = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el centro primero para eliminar su imagen
    const centro = await prisma.centroDeportivo.findUnique({ where: { id } });
    if (!centro) return res.status(404).json({ error: 'Centro no encontrado' });

    // Eliminar el centro
    await prisma.centroDeportivo.delete({
      where: { id },
      include: {
        canchas: true,
        reservas: true
      }
    });

    // Eliminar la imagen asociada si existe
    if (centro.imagenUrl) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../public', centro.imagenUrl);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error al eliminar imagen del centro:', err);
      });
    }

    res.json({ message: 'Centro eliminado correctamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Centro no encontrado' });
    } else {
      res.status(500).json({ 
        error: 'Error al eliminar centro', 
        details: error.message 
      });
    }
  }
};

module.exports = {
  crearCentroDeportivo,
  obtenerCentrosDeportivos,
  obtenerCentroDeportivoPorId,
  actualizarCentroDeportivo,
  eliminarCentroDeportivo
};