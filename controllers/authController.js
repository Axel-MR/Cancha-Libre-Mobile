const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.login = async (req, res) => {
  console.log('📥 Solicitud POST a /login recibida');
  console.log('Cuerpo de la solicitud:', req.body);

  try {
    const { correo, clave } = req.body;
    
    // Validación mejorada
    if (!correo?.trim() || !clave?.trim()) {
      console.log('❌ Faltan credenciales');
      return res.status(400).json({ 
        success: false,
        message: 'Correo y contraseña son requeridos' 
      });
    }

    // Buscar usuario incluyendo solo campos necesarios
    const usuario = await prisma.usuarios.findUnique({
      where: { correo },
      select: {
        id: true,
        correo: true,
        clave: true, // Necesario para comparar
        nombre: true,
        rol: true
      }
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado:', correo);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Comparación segura de contraseñas
    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      console.log('❌ Contraseña incorrecta para:', correo);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'fallback_secret', // Usa un valor por defecto solo para desarrollo
      { expiresIn: '7d' }
    );

    console.log('✅ Login exitoso para:', correo);
    
    // Excluir la contraseña del objeto de usuario
    const { clave: _, ...usuarioSinClave } = usuario;
    
    res.json({
      success: true,
      token,
      usuario: usuarioSinClave,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('🔥 Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};