const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { userType, fullName, document, email, password } = req.body;
  
  if (!userType || !fullName || !document || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { document }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El documento o correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        userType,
        fullName,
        document,
        email,
        password: hashedPassword
      }
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Usuario registrado con éxito', user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, userType: user.userType, email: user.email },
      process.env.JWT_SECRET || 'supersecretarachiz',
      { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Inicio de sesión exitoso', token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = {
  register,
  login
};
