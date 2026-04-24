// Utilidades compartidas para todos los juegos Easter Egg

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const MEDAL = ['🥇','🥈','🥉'];
export const TOP_COLORS = [
  { text:'#7A5500', glow:'rgba(255,200,0,0.5)',   bg:'rgba(255,215,0,0.30)' }, // Oro — fondo sólido, texto oscuro
  { text:'#3D4450', glow:'rgba(160,170,180,0.5)', bg:'rgba(180,190,200,0.35)' }, // Plata — fondo sólido, texto oscuro
  { text:'#6B3000', glow:'rgba(180,100,30,0.5)',  bg:'rgba(205,127,50,0.30)' }, // Bronce — fondo sólido, texto oscuro
];

// Juegos donde menor score = mejor (intentos wordle)
export const LOWER_IS_BETTER = ['wordle'];

const LS = (game, fichaId) => `arachiz_${game}_${fichaId || 'global'}_lb`;

export const getCachedLB = (game, fichaId) => {
  try { return JSON.parse(localStorage.getItem(LS(game, fichaId))) || []; } catch { return []; }
};

export const fetchLB = async (game, fichaId) => {
  try {
    const params = fichaId ? `?fichaId=${fichaId}` : '';
    const res  = await fetch(`${API_URL}/games/${game}/leaderboard${params}`);
    const data = await res.json();
    if (data.scores) {
      localStorage.setItem(LS(game, fichaId), JSON.stringify(data.scores));
      return data.scores;
    }
  } catch {}
  return getCachedLB(game, fichaId);
};

export const saveGameScore = async (game, score) => {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/games/${game}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score }),
    });
  } catch {}
};

// Estilos Liquid Glass reutilizables
export const glassLight = {
  background: 'rgba(255,255,255,0.22)',
  backdropFilter: 'blur(50px) saturate(200%)',
  WebkitBackdropFilter: 'blur(50px) saturate(200%)',
  border: '1.5px solid rgba(255,255,255,0.85)',
  borderRadius: 28,
  boxShadow: '0 30px 80px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,1)',
};

export const glassDark = {
  background: 'rgba(20,20,30,0.55)',
  backdropFilter: 'blur(60px) saturate(180%)',
  WebkitBackdropFilter: 'blur(60px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 28,
  boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 12, overflowY: 'auto',
};
