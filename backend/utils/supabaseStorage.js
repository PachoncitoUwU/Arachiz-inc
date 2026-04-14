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

  // Pre-check / create bucket if it doesn't exist
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets && !buckets.find(b => b.name === 'foto-aprendices')) {
    await supabase.storage.createBucket('foto-aprendices', { public: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const fileName = folder ? `${folder}/${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;

  const { data, error } = await supabase.storage
    .from('foto-aprendices')
    .upload(fileName, fileBuffer, {
      contentType: getContentType(ext),
      upsert: false
    });

  if (error) throw new Error('Error subiendo archivo a Supabase Storage: ' + error.message);

  const { data: publicUrlData } = supabase.storage
    .from('foto-aprendices')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

module.exports = { uploadToSupabase, isSupabaseConfigured: !!supabase };
