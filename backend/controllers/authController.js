const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { uploadToSupabase, isSupabaseConfigured } = require('../utils/supabaseStorage');

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
    
    // Si es instructor, desbloquear todas las skins automáticamente
    if (userType === 'instructor') {
      try {
        const allSkins = await prisma.snakeSkin.findMany();
        
        // Crear UserSkin para cada skin disponible
        const userSkinsData = allSkins.map(skin => ({
          userId: newUser.id,
          skinId: skin.id,
          equipped: skin.isDefault // Equipar la skin por defecto
        }));
        
        await prisma.userSkin.createMany({
          data: userSkinsData,
          skipDuplicates: true
        });
        
        console.log(`✅ Todas las skins desbloqueadas para el instructor: ${newUser.fullName}`);
      } catch (skinError) {
        console.error('Error desbloqueando skins para instructor:', skinError);
        // No fallar el registro si hay error con las skins
      }
    }
    
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
      select: {
        id: true, fullName: true, email: true, document: true,
        userType: true, createdAt: true, avatarUrl: true,
        fichasApr: { select: { id: true }, take: 1 },
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { fichasApr, ...rest } = user;
    res.json({ user: { ...rest, fichaId: fichasApr?.[0]?.id || null } });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF81 - Actualizar perfil (nombre + avatar)
const updateProfile = async (req, res) => {
  const { fullName, avatarBase64 } = req.body;
  
  try {
    const data = {};
    if (fullName && fullName.trim()) data.fullName = fullName.trim();
    
    // Si envían la imagen en base64 (ya redimensionada desde el frontend)
    if (avatarBase64) {
      data.avatarUrl = avatarBase64;
    }
    
    // Si usan archivo local/Supabase tradicional (multer)
    if (req.file) {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: 'Faltan las variables SUPABASE_URL y SUPABASE_ANON_KEY en backend/.env' });
      }
      data.avatarUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, 'avatars');
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, fullName: true, email: true, document: true, userType: true, avatarUrl: true }
    });
    res.json({ message: 'Perfil actualizado', user });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Faltan datos' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// Se eliminó updateUserAvatar por solicitud del usuario

module.exports = { register, login, getMe, updateProfile, changePassword };
