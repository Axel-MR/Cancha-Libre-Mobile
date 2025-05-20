const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Usar un secreto consistente
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro_para_desarrollo';

// Verificar token de autenticación
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // CORRECCIÓN: Usar userId en lugar de id
    // Confirma que el usuario existe en la BD
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.userId } // Cambiado de decoded.id a decoded.userId
    });
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Añadir usuario a la solicitud
    req.user = usuario;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};

// Verificar si el usuario es administrador
const verificarAdmin = (req, res, next) => {
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

module.exports = {
  verificarToken,
  verificarAdmin
};