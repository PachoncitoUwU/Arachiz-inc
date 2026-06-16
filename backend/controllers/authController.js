const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');
const { uploadToSupabase, isSupabaseConfigured } = require('../utils/supabaseStorage');
const templates = require('../utils/emailTemplates');

// Transporter compartido para correos de auth
const createAuthTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });
};

// Enviar correo de bienvenida al registrarse (no bloquea el registro si falla)
const sendWelcomeEmail = async (userType, fullName, email) => {
  try {
    const transporter = createAuthTransporter();
    if (!transporter) return;
    const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const templateFn = userType === 'instructor'
      ? templates.welcomeInstructor
      : templates.welcomeAprendiz;
    await transporter.sendMail({
      from: `"Arachiz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '¡Bienvenido a Arachiz! Tu cuenta está lista 🎉',
      html: templateFn(fullName, loginLink)
    });
    console.log(`[Auth] Correo de bienvenida enviado a ${email}`);
  } catch (err) {
    console.error('[Auth] Error enviando correo de bienvenida:', err.message);
  }
};

// RF01 - Registro
const register = async (req, res) => {
  const { userType, fullName, document, email, password } = req.body;
  if (!userType || !fullName || !document || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!['instructor', 'aprendiz', 'administrador'].includes(userType)) {
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
    
    // Si es instructor o administrador, desbloquear todas las skins automáticamente
    if (userType === 'instructor' || userType === 'administrador') {
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
        
        console.log(`✅ Todas las skins desbloqueadas para ${userType}: ${newUser.fullName}`);
      } catch (skinError) {
        console.error(`Error desbloqueando skins para ${userType}:`, skinError);
        // No fallar el registro si hay error con las skins
      }
    }
    
    const { password: _, ...userWithoutPassword } = newUser;

    // Enviar correo de bienvenida (solo para registro manual, no importación masiva)
    if (userType === 'aprendiz' || userType === 'instructor') {
      sendWelcomeEmail(userType, fullName, email); // fire-and-forget, no bloquea
    }

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
        fichasInst: { select: { fichaId: true }, take: 1 },
      }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { fichasApr, fichasInst, ...rest } = user;
    
    // Obtener fichaId: primero de aprendiz, si no existe, de instructor
    const fichaId = fichasApr?.[0]?.id || fichasInst?.[0]?.fichaId || null;
    
    res.json({ user: { ...rest, fichaId } });
  } catch (err) {
    res.status(500).json({ error: 'Error: ' + err.message });
  }
};

// RF81 - Actualizar perfil (nombre + avatar)
const updateProfile = async (req, res) => {
  const { fullName, document, avatarBase64, deleteAvatar } = req.body;
  
  try {
    const data = {};
    if (fullName && fullName.trim()) data.fullName = fullName.trim();
    if (document && document.trim()) data.document = document.trim();
    
    // Si solicitan eliminar el avatar
    if (deleteAvatar === 'true') {
      data.avatarUrl = null;
    }
    // Si envían la imagen en base64 (ya redimensionada desde el frontend)
    else if (avatarBase64) {
      data.avatarUrl = avatarBase64;
    }
    // Si usan archivo local/Supabase tradicional (multer)
    else if (req.file) {
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

// RF - Completar perfil de Google
const completeProfile = async (req, res) => {
  const { userType, document } = req.body;
  if (!userType || !document) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  
  try {
    // Validar que el usuario actual tenga un documento temporal (Google)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.document.startsWith('GOOGLE-')) {
      return res.status(400).json({ error: 'Este perfil ya fue completado o no es válido para esta acción' });
    }

    // Validar que el nuevo documento no exista
    const existingDoc = await prisma.user.findFirst({
      where: { document, id: { not: user.id } }
    });
    
    if (existingDoc) {
      return res.status(400).json({ error: 'El documento ya está registrado por otro usuario' });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { userType, document }
    });

    // Si es instructor o administrador, desbloquear todas las skins automáticamente
    if (userType === 'instructor' || userType === 'administrador') {
      try {
        const allSkins = await prisma.snakeSkin.findMany();
        const userSkinsData = allSkins.map(skin => ({
          userId: updatedUser.id,
          skinId: skin.id,
          equipped: skin.isDefault
        }));
        
        await prisma.userSkin.createMany({
          data: userSkinsData,
          skipDuplicates: true
        });
      } catch (skinError) {
        console.error(`Error desbloqueando skins para ${userType}:`, skinError);
      }
    }

    // Generar nuevo token con los datos actualizados
    const token = jwt.sign(
      { id: updatedUser.id, userType: updatedUser.userType, email: updatedUser.email, fullName: updatedUser.fullName },
      process.env.JWT_SECRET || 'supersecretarachiz',
      { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'Perfil completado con éxito', token, user: userWithoutPassword });

    // Enviar correo de bienvenida ahora que tenemos el userType real
    if (updatedUser.userType === 'aprendiz' || updatedUser.userType === 'instructor') {
      sendWelcomeEmail(updatedUser.userType, updatedUser.fullName, updatedUser.email);
    }

  } catch (err) {
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, completeProfile };
