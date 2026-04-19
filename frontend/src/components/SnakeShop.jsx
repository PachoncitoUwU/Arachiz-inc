import { useState, useEffect } from 'react';

const RARITY = {
  common:    { label:'Común',     color:'#64748b', glow:'rgba(100,116,139,0.5)', bg:'rgba(100,116,139,0.15)' },
  rare:      { label:'Rara',      color:'#3b82f6', glow:'rgba(59,130,246,0.5)',  bg:'rgba(59,130,246,0.15)'  },
  epic:      { label:'Épica',     color:'#a855f7', glow:'rgba(168,85,247,0.5)',  bg:'rgba(168,85,247,0.15)'  },
  legendary: { label:'Legendaria',color:'#f59e0b', glow:'rgba(245,158,11,0.6)',  bg:'rgba(245,158,11,0.15)'  },
  mythic:    { label:'Mítica',    color:'#ef4444', glow:'rgba(239,68,68,0.6)',   bg:'rgba(239,68,68,0.15)'   },
};

// Skins locales — se usan si el backend no responde
const LOCAL_SKINS = [
  { id:'local-1',  name:'Clásica',            description:'La serpiente de toda la vida.',                                    price:0,     rarity:'common',    headColor:'#00ff88', bodyColor:'#00cc6a', pattern:'solid',    trailEffect:'none',      eyeStyle:'normal', isDefault:true  },
  { id:'local-2',  name:'Océano',             description:'Azul profundo como el mar.',                                       price:1500,  rarity:'common',    headColor:'#0ea5e9', bodyColor:'#0284c7', pattern:'solid',    trailEffect:'none',      eyeStyle:'normal', isDefault:false },
  { id:'local-3',  name:'Lava',               description:'Rojo ardiente. Peligrosa y apasionada.',                           price:1500,  rarity:'common',    headColor:'#ef4444', bodyColor:'#dc2626', pattern:'solid',    trailEffect:'none',      eyeStyle:'normal', isDefault:false },
  { id:'local-4',  name:'Amatista',           description:'Morado profundo con brillo cristalino.',                           price:2000,  rarity:'common',    headColor:'#a855f7', bodyColor:'#7c3aed', pattern:'solid',    trailEffect:'none',      eyeStyle:'normal', isDefault:false },
  { id:'local-5',  name:'Naranja Neón',       description:'Vibrante y llamativa.',                                            price:2000,  rarity:'common',    headColor:'#fb923c', bodyColor:'#ea580c', pattern:'solid',    trailEffect:'none',      eyeStyle:'normal', isDefault:false },
  { id:'local-6',  name:'Hielo Ártico',       description:'Cristales de hielo que dejan un rastro helado.',                   price:3500,  rarity:'rare',      headColor:'#e0f7ff', bodyColor:'#7dd3fc', pattern:'ice',      trailEffect:'ice',       eyeStyle:'normal', isDefault:false },
  { id:'local-7',  name:'Degradado Solar',    description:'Transición de colores cálidos del amanecer al atardecer.',         price:4000,  rarity:'rare',      headColor:'#fbbf24', bodyColor:'#f97316', pattern:'gradient', trailEffect:'sparkles',  eyeStyle:'normal', isDefault:false },
  { id:'local-8',  name:'Neón Verde',         description:'Brilla en la oscuridad. Efecto neón puro.',                        price:4500,  rarity:'rare',      headColor:'#00ff88', bodyColor:'#00cc6a', pattern:'neon',     trailEffect:'sparkles',  eyeStyle:'normal', isDefault:false },
  { id:'local-9',  name:'Neón Rosa',          description:'Rosa eléctrico con aura brillante. Estilo cyberpunk.',             price:4500,  rarity:'rare',      headColor:'#f472b6', bodyColor:'#ec4899', pattern:'neon',     trailEffect:'hearts',    eyeStyle:'cute',   isDefault:false },
  { id:'local-10', name:'Estrellas',          description:'Deja un rastro de estrellas doradas a su paso.',                   price:5000,  rarity:'rare',      headColor:'#fbbf24', bodyColor:'#d97706', pattern:'solid',    trailEffect:'stars',     eyeStyle:'normal', isDefault:false },
  { id:'local-11', name:'Dragón de Fuego',    description:'Llamas que consumen todo a su paso. Poder puro.',                  price:7000,  rarity:'epic',      headColor:'#ffd700', bodyColor:'#ff4500', pattern:'fire',     trailEffect:'fire',      eyeStyle:'angry',  isDefault:false },
  { id:'local-12', name:'Arcoíris',           description:'Todos los colores del espectro en una sola serpiente.',            price:8000,  rarity:'epic',      headColor:'#ff0080', bodyColor:'#0080ff', pattern:'rainbow',  trailEffect:'sparkles',  eyeStyle:'cute',   isDefault:false },
  { id:'local-13', name:'Galaxia',            description:'El cosmos en tu serpiente. Morado profundo con estrellas.',        price:9000,  rarity:'epic',      headColor:'#c084fc', bodyColor:'#4a148c', pattern:'galaxy',   trailEffect:'stars',     eyeStyle:'normal', isDefault:false },
  { id:'local-14', name:'Rayo',               description:'Velocidad eléctrica. Deja rayos a su paso.',                       price:10000, rarity:'epic',      headColor:'#fde047', bodyColor:'#ca8a04', pattern:'neon',     trailEffect:'lightning', eyeStyle:'laser',  isDefault:false },
  { id:'local-15', name:'Neón Azul Eléctrico',description:'Azul eléctrico que ilumina la oscuridad.',                         price:10000, rarity:'epic',      headColor:'#60a5fa', bodyColor:'#2563eb', pattern:'neon',     trailEffect:'lightning', eyeStyle:'laser',  isDefault:false },
  { id:'local-16', name:'Serpiente Dorada',   description:'Oro puro. Solo los mejores merecen esta skin.',                    price:15000, rarity:'legendary', headColor:'#ffd700', bodyColor:'#ffb300', pattern:'gold',     trailEffect:'sparkles',  eyeStyle:'normal', isDefault:false },
  { id:'local-17', name:'Fénix',              description:'Renace de las llamas. Degradado épico de fuego y oro.',            price:20000, rarity:'legendary', headColor:'#ffd700', bodyColor:'#ff4500', pattern:'fire',     trailEffect:'fire',      eyeStyle:'laser',  isDefault:false },
  { id:'local-18', name:'Cosmos Infinito',    description:'Galaxia + arcoíris. La skin más hermosa del universo.',            price:22000, rarity:'legendary', headColor:'#c084fc', bodyColor:'#1a0030', pattern:'galaxy',   trailEffect:'void',      eyeStyle:'laser',  isDefault:false },
  { id:'local-19', name:'☠️ El Vacío',        description:'Oscuridad absoluta. Solo los más valientes se atreven.',           price:35000, rarity:'mythic',    headColor:'#c084fc', bodyColor:'#0d0020', pattern:'void',     trailEffect:'void',      eyeStyle:'laser',  isDefault:false },
  { id:'local-20', name:'💎 Diamante Puro',   description:'Brillo inigualable que ciega a los enemigos. La skin más lujosa.', price:40000, rarity:'mythic',    headColor:'#e0ffff', bodyColor:'#00ffff', pattern:'ice',      trailEffect:'sparkles',  eyeStyle:'normal', isDefault:false },
  { id:'local-21', name:'👿 Inframundo',      description:'Fuego oscuro, sombras y terror.',                                  price:45000, rarity:'mythic',    headColor:'#4a0404', bodyColor:'#1a0000', pattern:'fire',     trailEffect:'fire',      eyeStyle:'angry',  isDefault:false },
  { id:'local-22', name:'🌸 Sakura Mística',  description:'Deja flores de cerezo a su paso. Elegancia pura.',                 price:48000, rarity:'mythic',    headColor:'#ffb7c5', bodyColor:'#ff69b4', pattern:'gradient', trailEffect:'hearts',    eyeStyle:'cute',   isDefault:false },
  { id:'local-23', name:'👑 Serpiente Suprema',description:'La skin definitiva. Arcoíris + fuego + rayos. Eres una leyenda.',price:50000, rarity:'mythic',    headColor:'#ffd700', bodyColor:'#ff0080', pattern:'rainbow',  trailEffect:'lightning', eyeStyle:'laser',  isDefault:false },
];
// Preview SVG de la serpiente para cada skin
function SkinPreview({ skin }) {
  const id = `s${skin.id || skin.name.replace(/\s/g,'')}`;

  // Puntos del cuerpo en forma de S
  const pts = [
    [100,30],[100,50],[100,70],[85,85],[70,90],[55,85],[45,70],[45,55],[55,42],[70,38],[85,42],
  ];

  let fillBody = skin.bodyColor;
  let fillHead = skin.headColor;
  let filter = '';

  const defs = [];

  if (skin.pattern === 'gradient') {
    defs.push(
      <linearGradient key="g" id={`${id}g`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={skin.headColor}/>
        <stop offset="100%" stopColor={skin.bodyColor}/>
      </linearGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'rainbow') {
    defs.push(
      <linearGradient key="g" id={`${id}g`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#ff0080"/>
        <stop offset="20%"  stopColor="#ff8000"/>
        <stop offset="40%"  stopColor="#ffff00"/>
        <stop offset="60%"  stopColor="#00ff80"/>
        <stop offset="80%"  stopColor="#0080ff"/>
        <stop offset="100%" stopColor="#8000ff"/>
      </linearGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'galaxy') {
    defs.push(
      <radialGradient key="g" id={`${id}g`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#c084fc"/>
        <stop offset="40%"  stopColor="#4a148c"/>
        <stop offset="100%" stopColor="#0d0d1a"/>
      </radialGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'fire') {
    defs.push(
      <linearGradient key="g" id={`${id}g`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%"   stopColor="#ff0000"/>
        <stop offset="50%"  stopColor="#ff6b00"/>
        <stop offset="100%" stopColor="#ffd700"/>
      </linearGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'ice') {
    defs.push(
      <linearGradient key="g" id={`${id}g`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#e0f7ff"/>
        <stop offset="50%"  stopColor="#7dd3fc"/>
        <stop offset="100%" stopColor="#0ea5e9"/>
      </linearGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'neon') {
    defs.push(
      <filter key="f" id={`${id}f`}>
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    );
    filter = `url(#${id}f)`;
  } else if (skin.pattern === 'gold') {
    defs.push(
      <linearGradient key="g" id={`${id}g`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#ffd700"/>
        <stop offset="40%"  stopColor="#ffb300"/>
        <stop offset="100%" stopColor="#ff8c00"/>
      </linearGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  } else if (skin.pattern === 'void') {
    defs.push(
      <radialGradient key="g" id={`${id}g`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#1a0030"/>
        <stop offset="60%"  stopColor="#0d0020"/>
        <stop offset="100%" stopColor="#000000"/>
      </radialGradient>
    );
    fillBody = `url(#${id}g)`;
    fillHead = `url(#${id}g)`;
  }

  const eyeColor = skin.eyeStyle === 'laser' ? '#ff0000' : skin.eyeStyle === 'angry' ? '#ff4444' : '#000';

  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <defs>{defs}</defs>
      
      {/* Cuerpo continuo en lugar de círculos superpuestos */}
      <polyline 
        points={pts.map(p => p.join(',')).join(' ')} 
        fill="none" 
        stroke={fillBody} 
        strokeWidth="18" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter={filter}
      />
      {skin.pattern === 'neon' && (
        <polyline 
          points={pts.map(p => p.join(',')).join(' ')} 
          fill="none" 
          stroke={skin.bodyColor} 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      )}

      {/* Cabeza */}
      <circle cx={pts[0][0]} cy={pts[0][1]} r={12} fill={fillHead} filter={filter} />

      {/* Ojos */}
      <circle cx={94} cy={24} r={4} fill="white"/>
      <circle cx={106} cy={24} r={4} fill="white"/>
      <circle cx={94} cy={24} r={2.5} fill={eyeColor}/>
      <circle cx={106} cy={24} r={2.5} fill={eyeColor}/>
      {skin.eyeStyle === 'laser' && <>
        <line x1={94} y1={24} x2={75} y2={10} stroke="#ff0000" strokeWidth={2.5} opacity={0.8}/>
        <line x1={106} y1={24} x2={125} y2={10} stroke="#ff0000" strokeWidth={2.5} opacity={0.8}/>
      </>}
      
      {/* Trail effects simplificado para que no sature */}
      {skin.trailEffect === 'sparkles' && <>
        <circle cx={42} cy={55} r={2.5} fill="#ffe000" opacity={0.8}/>
        <circle cx={38} cy={70} r={2} fill="#ffe000" opacity={0.6}/>
        <circle cx={50} cy={80} r={1.5} fill="#fff" opacity={0.7}/>
      </>}
      {skin.trailEffect === 'fire' && <>
        <path d="M42,55 Q45,50 48,55 Q45,60 42,55" fill="#ff4500" opacity={0.8}/>
        <path d="M38,70 Q40,66 42,70 Q40,74 38,70" fill="#ff8c00" opacity={0.6}/>
        <path d="M50,80 Q52,77 54,80 Q52,83 50,80" fill="#ffd700" opacity={0.7}/>
      </>}
      {skin.trailEffect === 'ice' && <>
        <circle cx={42} cy={55} r={2} fill="#7dd3fc" opacity={0.8}/>
        <circle cx={38} cy={70} r={1.5} fill="#e0f7ff" opacity={0.7}/>
        <circle cx={50} cy={80} r={1} fill="#ffffff" opacity={0.9}/>
      </>}
      {skin.trailEffect === 'stars' && <>
        <polygon points="42,52 43,54 45,55 43,56 42,58 41,56 39,55 41,54" fill="#fbbf24" opacity={0.8}/>
        <polygon points="38,68 39,69 40,70 39,71 38,72 37,71 36,70 37,69" fill="#fef3c7" opacity={0.6}/>
        <polygon points="50,78 50.5,79 51.5,80 50.5,81 50,82 49.5,81 48.5,80 49.5,79" fill="#fbbf24" opacity={0.7}/>
      </>}
      {skin.trailEffect === 'hearts' && <>
        <text x={36} y={62} fontSize={10} fill="#ff69b4" opacity={0.9}>♥</text>
        <text x={44} y={76} fontSize={8} fill="#ff69b4" opacity={0.6}>♥</text>
      </>}
      {skin.trailEffect === 'lightning' && <>
        <polyline points="40,50 44,55 42,56 46,62" fill="none" stroke="#fde047" strokeWidth="1.5" opacity={0.8}/>
        <polyline points="36,68 39,72 37,73 40,78" fill="none" stroke="#fef08a" strokeWidth="1" opacity={0.6}/>
      </>}
      {skin.trailEffect === 'void' && <>
        <circle cx={44} cy={68} r={4} fill="#1a0030" opacity={0.8}/>
        <circle cx={44} cy={68} r={2} fill="#c084fc" opacity={0.5}/>
      </>}
    </svg>
  );
}

export default function SnakeShop({ onClose, onEquipSkin }) {
  const [allSkins,  setAllSkins]  = useState([]);
  const [userSkins, setUserSkins] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // all | owned | free

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token   = localStorage.getItem('token');

  useEffect(() => { loadSkins(); }, []);

  const loadSkins = async () => {
    try {
      setLoading(true);
      const [skinsRes, userRes] = await Promise.all([
        fetch(`${API_URL}/skins/all`),
        fetch(`${API_URL}/skins/my-skins`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const skinsData = await skinsRes.json();
      const userData  = await userRes.json();
      // Si el backend devuelve skins, usarlas; si no, usar las locales
      setAllSkins(skinsData.skins?.length ? skinsData.skins : LOCAL_SKINS);
      setUserSkins(userData.userSkins || []);
    } catch (e) {
      console.error(e);
      setAllSkins(LOCAL_SKINS); // fallback local
    }
    finally { setLoading(false); }
  };

  // localStorage fallback para skins desbloqueadas sin backend
  const LS_KEY = 'arachiz_unlocked_skins';
  const getLocalUnlocked = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
  const addLocalUnlocked = (skinId) => {
    const list = getLocalUnlocked();
    if (!list.includes(skinId)) { list.push(skinId); localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  };

  const owned    = (id) => userSkins.some(us => us.skinId === id) || getLocalUnlocked().includes(id);
  const equipped = (id) => userSkins.some(us => us.skinId === id && us.equipped);

  const handleEquip = async (skinId) => {
    try {
      // Si es skin local (backend no disponible), solo actualizar UI
      if (skinId.startsWith('local-')) {
        const skin = allSkins.find(s => s.id === skinId);
        if (skin && onEquipSkin) onEquipSkin(skin);
        // Marcar como equipada localmente
        setUserSkins(prev => prev.map(us => ({ ...us, equipped: false })));
        return;
      }
      await fetch(`${API_URL}/skins/equip`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ skinId }),
      });
      await loadSkins();
      const skin = allSkins.find(s => s.id === skinId);
      if (skin && onEquipSkin) onEquipSkin(skin);
    } catch (e) { console.error(e); }
  };

  const handleBuy = async (skin) => {
    if (processing) return;
    setProcessing(true);
    try {
      // Intentar desbloquear en el backend
      const res = await fetch(`${API_URL}/skins/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skinId: skin.id }),
      });
      if (res.ok) {
        // Si el backend respondió bien, recargar skins del servidor
        await loadSkins();
      } else {
        // Fallback: guardar en localStorage y refrescar UI
        addLocalUnlocked(skin.id);
        await loadSkins();
      }
    } catch (e) {
      // Sin conexión al backend — guardar local
      addLocalUnlocked(skin.id);
      await loadSkins();
    } finally {
      setProcessing(false);
    }
  };

  const visible = allSkins.filter(s => {
    if (filter === 'owned') return owned(s.id);
    if (filter === 'free')  return s.price === 0;
    return true;
  });

  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ color:'white', fontSize:18, fontWeight:700 }}>Cargando tienda...</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(5,5,20,0.92)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:16, overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'linear-gradient(160deg,#0f0f23 0%,#1a0a2e 50%,#0a1628 100%)',
        borderRadius:28, padding:'28px 24px', maxWidth:900, width:'100%',
        maxHeight:'92vh', overflowY:'auto',
        border:'1px solid rgba(168,85,247,0.3)',
        boxShadow:'0 0 80px rgba(168,85,247,0.2), 0 40px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:28, fontWeight:900, background:'linear-gradient(90deg,#a855f7,#3b82f6,#00ff88)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              🐍 Tienda de Skins
            </h2>
            <p style={{ margin:'6px 0 0', color:'rgba(255,255,255,0.45)', fontSize:13 }}>
              Personaliza tu serpiente con skins únicas
            </p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, color:'white', padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            ✕ Cerrar
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['all','Todas'],['owned','Mis skins'],['free','Gratis']].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ background: filter===val ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)', border: filter===val ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)', borderRadius:20, color:'white', padding:'6px 16px', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' }}>
              {label}
            </button>
          ))}
          <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:12, alignSelf:'center' }}>
            {visible.length} skins
          </span>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.3)', fontSize:15 }}>
            {filter === 'owned' ? 'Aún no tienes skins. ¡Compra una!' : 'No hay skins disponibles'}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 }}>
            {visible.map(skin => {
              const r   = RARITY[skin.rarity] || RARITY.common;
              const own = owned(skin.id);
              const eq  = equipped(skin.id);

              return (
                <div key={skin.id} style={{
                  background: eq ? 'rgba(0,255,136,0.07)' : 'rgba(255,255,255,0.04)',
                  borderRadius:20, padding:18,
                  border: eq ? '1.5px solid #00ff88' : `1.5px solid ${r.color}44`,
                  boxShadow: eq ? '0 0 30px rgba(0,255,136,0.25)' : `0 0 20px ${r.glow}`,
                  transition:'all 0.25s', cursor:'default', position:'relative',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow = eq ? '0 8px 40px rgba(0,255,136,0.35)' : `0 8px 40px ${r.glow}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow = eq ? '0 0 30px rgba(0,255,136,0.25)' : `0 0 20px ${r.glow}`; }}
                >
                  {/* Badges */}
                  <div style={{ position:'absolute', top:12, right:12, display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
                    <span style={{ background:r.color, color:'white', padding:'3px 10px', borderRadius:10, fontSize:10, fontWeight:800, textTransform:'uppercase', boxShadow:`0 0 12px ${r.glow}` }}>
                      {r.label}
                    </span>
                    {eq && <span style={{ background:'#00ff88', color:'#000', padding:'3px 10px', borderRadius:10, fontSize:10, fontWeight:800 }}>✓ EQUIPADA</span>}
                    {own && !eq && <span style={{ background:'rgba(255,255,255,0.15)', color:'white', padding:'3px 10px', borderRadius:10, fontSize:10, fontWeight:700 }}>Desbloqueada</span>}
                  </div>

                  {/* Preview */}
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:12, marginTop:8 }}>
                    <SkinPreview skin={skin}/>
                  </div>

                  {/* Info */}
                  <h3 style={{ margin:'0 0 5px', fontSize:16, fontWeight:800, color:'white' }}>{skin.name}</h3>
                  <p style={{ margin:'0 0 14px', fontSize:12, color:'rgba(255,255,255,0.45)', lineHeight:1.4 }}>{skin.description}</p>

                  {/* Precio + botón */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:17, fontWeight:900, color: skin.price === 0 ? '#00ff88' : '#fbbf24' }}>
                      {skin.price === 0 ? 'GRATIS' : `$${skin.price.toLocaleString()}`}
                    </span>

                    {own ? (
                      eq ? (
                        <span style={{ background:'rgba(0,255,136,0.15)', color:'#00ff88', padding:'8px 16px', borderRadius:12, fontSize:13, fontWeight:700 }}>✓ En uso</span>
                      ) : (
                        <button onClick={() => handleEquip(skin.id)}
                          style={{ background:'linear-gradient(135deg,#a855f7,#6366f1)', border:'none', borderRadius:12, color:'white', padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:700, transition:'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                          Equipar
                        </button>
                      )
                    ) : (
                      <button onClick={() => skin.price === 0 ? handleEquip(skin.id) : handleBuy(skin)}
                        disabled={processing}
                        style={{ background: skin.price === 0 ? 'linear-gradient(135deg,#00ff88,#00cc6a)' : 'linear-gradient(135deg,#f093fb,#f5576c)', border:'none', borderRadius:12, color: skin.price === 0 ? '#000' : 'white', padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:700, opacity: processing ? 0.6 : 1, transition:'all 0.2s' }}
                        onMouseEnter={e => { if (!processing) e.currentTarget.style.transform='scale(1.05)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                        {skin.price === 0 ? 'Obtener' : processing ? 'Desbloqueando...' : '🔓 Obtener'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
