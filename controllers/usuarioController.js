const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Cambiado a bcryptjs para mayor compatibilidad

// Función para manejar errores de Prisma
const handlePrismaError = (error, res) => {
  console.error('Error de Prisma:', error);
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }
  res.status(500).json({ error: 'Error del servidor', details: error.message });
};

// Controladores
const crearUsuario = async (req, res) => {
  const { correo, nombre, telefono, clave_ine, edad, sexo, estatura, peso, ejercicio_semanal, rol, clave } = req.body;

  if (!correo || !nombre || !telefono || !clave_ine || !rol || !clave) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const hashedClave = await bcrypt.hash(clave, 10);
    const newUser = await prisma.usuarios.create({
      data: { correo, nombre, telefono, clave_ine, edad, sexo, estatura, peso, ejercicio_semanal, rol, clave: hashedClave },
    });
    res.status(201).json(newUser);
  } catch (error) {
    handlePrismaError(error, res);
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany();
    res.json(usuarios);
  } catch (error) {
    handlePrismaError(error, res);
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const user = await prisma.usuarios.findUnique({ where: { id: req.params.id } });
    user ? res.json(user) : res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    handlePrismaError(error, res);
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    await prisma.usuarios.delete({ where: { id: req.params.id } });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    error.code === 'P2025' 
      ? res.status(404).json({ error: 'Usuario no encontrado' })
      : handlePrismaError(error, res);
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const datos = req.body;
    if (datos.clave) {
      datos.clave = await bcrypt.hash(datos.clave, 10);
    }
    const usuario = await prisma.usuarios.update({
      where: { id: req.params.id },
      data: datos
    });
    res.json(usuario);
  } catch (error) {
    handlePrismaError(error, res);
  }
};

const iniciarSesion = async (req, res) => {
  const { correo, clave } = req.body;
  
  if (!correo || !clave) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { correo } });
    if (!usuario || !(await bcrypt.compare(clave, usuario.clave))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto_fallback',
      { expiresIn: '1h' }
    );

    // Excluir la contraseña hash de la respuesta
    const { clave: _, ...userData } = usuario;
    res.json({ token, usuario: userData });
  } catch (error) {
    handlePrismaError(error, res);
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  eliminarUsuario,
  actualizarUsuario,
  iniciarSesion
};