const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt'); // Para hashear contraseñas

// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
  const { correo, nombre, telefono, clave_ine, edad, sexo, estatura, peso, ejercicio_semanal, rol, clave } = req.body;

  // Validación básica de campos obligatorios
  if (!correo || !nombre || !telefono || !clave_ine || !rol || !clave) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Hashear la contraseña antes de guardarla
    const hashedClave = await bcrypt.hash(clave, 10);

    const newUser = await prisma.usuarios.create({
      data: {
        correo,
        nombre,
        telefono,
        clave_ine,
        edad,
        sexo,
        estatura,
        peso,
        ejercicio_semanal,
        rol,
        clave: hashedClave, // Guardar la contraseña hasheada
      },
    });
    console.log('Usuario creado exitosamente:', newUser);
    res.json(newUser);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};

// Obtener un usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.usuarios.findUnique({
      where: { id: id }, 
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario', details: error.message });
  }
};

// Eliminar un usuario
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.usuarios.delete({
      where: { id: id }, 
    });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario', details: error.message });
  }
};

// Actualizar un usuario por ID
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const datosActualizados = req.body;

  try {
    // Si se actualiza la contraseña, hashearla
    if (datosActualizados.clave) {
      datosActualizados.clave = await bcrypt.hash(datosActualizados.clave, 10);
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: id },
      data: datosActualizados,
    });

    res.json(usuarioActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
    }
  }
};


// Iniciar sesión
const iniciarSesion = async (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Buscar al usuario por correo
    const usuario = await prisma.usuarios.findUnique({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar la contraseña hasheada
    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { userId: usuario.id, rol: usuario.rol }, // Payload (datos del usuario)
      'secreto', 
      { expiresIn: '1h' }
    );

    // Devolver el token en la respuesta
    res.json({ message: 'Inicio de sesión exitoso', usuario, token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
};

// Exportar las funciones
module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  iniciarSesion,
};