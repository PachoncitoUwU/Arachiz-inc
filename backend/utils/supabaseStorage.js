const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const getContentType = (ext) => {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
};

const uploadToSupabase = async (fileBuffer, originalName, folder = '') => {
  if (!supabase) {
    throw new Error('Las claves SUPABASE_URL o SUPABASE_ANON_KEY no están configuradas en el archivo .env de tu backend.');
  }

  try {
    // Se asume que el bucket 'foto-aprendices' está creado y es público en Supabase.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const fileName = folder ? `${folder}/${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;

    console.log('📤 Subiendo archivo a Supabase:', fileName);

    const { data, error } = await supabase.storage
      .from('foto-aprendices')
      .upload(fileName, fileBuffer, {
        contentType: getContentType(ext),
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw new Error('Error subiendo archivo a Supabase Storage: ' + error.message);
    }

    console.log('✅ Archivo subido exitosamente');

    const { data: publicUrlData } = supabase.storage
      .from('foto-aprendices')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Error en uploadToSupabase:', error);
    // Si falla Supabase, devolver la imagen en base64 como fallback
    if (fileBuffer) {
      const base64 = fileBuffer.toString('base64');
      const mimeType = getContentType(path.extname(originalName));
      return `data:${mimeType};base64,${base64}`;
    }
    throw error;
  }
};

module.exports = { uploadToSupabase, isSupabaseConfigured: !!supabase };
