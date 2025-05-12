const jwt = require('jsonwebtoken');

// Usar el mismo secreto en todos los lugares
const JWT_SECRET = 'mi_secreto_super_seguro_para_desarrollo';

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Acceso no autorizado - Token no proporcionado o formato incorrecto' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    console.log('Verificando token con secreto:', JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Error al verificar token:', error.name, error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expirado' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      error: 'Token inválido' 
    });
  }
};