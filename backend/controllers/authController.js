const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// RF01 - Registro
const register = async (req, res) => {
  const { userType, fullName, document, email, password } = req.body;
  if (!userType || !fullName || !document || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!['instructor', 'aprendiz'].includes(userType)) {
    return res.status(400).json({ error: 'Tipo de usuario inválido' });
  }
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { document }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'El documento o correo ya está registrado' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { userType, fullName, document, email, password: hashedPassword }
    });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Usuario registrado con éxito', user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

// RF02 - Login (por documento o email)
const login = async (req, res) => {
  const { email, document, password } = req.body;
  if (!password || (!email && !document)) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: email ? { email } : { document }
    });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, userType: user.userType, email: user.email, fullName: user.fullName },
      process.env.JWT_SECRET || 'supersecretarachiz',
      { expiresIn: '8h' }
    );
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Inicio de sesión exitoso', token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

// RF75 - Obtener perfil actual
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, fullName: true, email: true, document: true, userType: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

module.exports = { register, login, getMe };
