const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Controlador para registro de usuarios
exports.crearUsuario = async (req, res) => {
  try {
    // 1. Validación básica
    if (!req.body.correo || !req.body.clave || !req.body.nombre || !req.body.telefono || !req.body.clave_ine) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos obligatorios son requeridos'
      });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(req.body.clave, 10);

    // 3. Crear el usuario
    const usuario = await prisma.usuarios.create({
      data: {
        correo: req.body.correo,
        clave: hashedPassword,
        nombre: req.body.nombre,
        telefono: req.body.telefono,
        clave_ine: req.body.clave_ine,
        edad: req.body.edad || null,
        sexo: req.body.sexo || null,
        estatura: req.body.estatura || null,
        peso: req.body.peso || null,
        ejercicio_semanal: req.body.ejercicio_semanal || null,
        rol: req.body.rol || 'usuario',
        reservasHechas: 0,
        faltas: 0,
        avatarUrl: null
      }
    });

    // 4. Generar token JWT
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'fallback_secret_para_desarrollo',
      { expiresIn: '7d' }
    );

    // 5. Responder con formato estandarizado
    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito',
      token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        telefono: usuario.telefono
      },
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejo de errores específicos de Prisma
    if (error.code === 'P2002') {
      const conflictField = error.meta?.target?.includes('correo') ? 'correo' : 'clave_ine';
      return res.status(400).json({
        success: false,
        error: `El ${conflictField} ya está registrado`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Controlador para login de usuarios
exports.login = async (req, res) => {
  try {
    const { correo, clave } = req.body;
    
    // 1. Validación de entrada
    if (!correo?.trim() || !clave?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Correo y contraseña son requeridos' 
      });
    }

    // 2. Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { correo },
      select: {
        id: true,
        correo: true,
        clave: true,
        nombre: true,
        rol: true,
        telefono: true
      }
    });

    if (!usuario) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    // 3. Verificar contraseña
    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    // 4. Generar token JWT con secreto fijo
    const JWT_SECRET = 'mi_secreto_super_seguro_para_desarrollo';
    console.log('Secreto usado para generación:', JWT_SECRET);

    const token = jwt.sign(
      { 
        userId: usuario.id, 
        rol: usuario.rol 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Excluir la contraseña de la respuesta
    const { clave: _, ...usuarioSinClave } = usuario;
    
    // 6. Responder con el mismo formato que el registro
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      usuario: usuarioSinClave,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};