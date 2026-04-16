import { useState, useEffect } from 'react';

const RARITY_COLORS = {
  common: { bg: '#94a3b8', glow: '#cbd5e1', text: 'Común' },
  rare: { bg: '#3b82f6', glow: '#60a5fa', text: 'Rara' },
  epic: { bg: '#a855f7', glow: '#c084fc', text: 'Épica' },
  legendary: { bg: '#f59e0b', glow: '#fbbf24', text: 'Legendaria' },
  mythic: { bg: '#ef4444', glow: '#f87171', text: 'Mítica' }
};

export default function SnakeShop({ onClose, onEquipSkin, currentUser }) {
  const [allSkins, setAllSkins] = useState([]);
  const [userSkins, setUserSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadSkins();
  }, []);

  const loadSkins = async () => {
    try {
      setLoading(true);
      
      // Cargar todas las skins disponibles
      const skinsRes = await fetch(`${API_URL}/skins/all`);
      const skinsData = await skinsRes.json();
      
      // Cargar las skins del usuario
      const userSkinsRes = await fetch(`${API_URL}/skins/my-skins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userSkinsData = await userSkinsRes.json();
      
      setAllSkins(skinsData.skins || []);
      setUserSkins(userSkinsData.userSkins || []);
    } catch (error) {
      console.error('Error loading skins:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasSkin = (skinId) => {
    return userSkins.some(us => us.skinId === skinId);
  };

  const isEquipped = (skinId) => {
    return userSkins.some(us => us.skinId === skinId && us.equipped);
  };

  const handleEquip = async (skinId) => {
    try {
      const res = await fetch(`${API_URL}/skins/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skinId })
      });

      if (res.ok) {
        await loadSkins();
        const skin = allSkins.find(s => s.id === skinId);
        if (skin && onEquipSkin) {
          onEquipSkin(skin);
        }
      }
    } catch (error) {
      console.error('Error equipping skin:', error);
    }
  };

  const handleBuy = async (skin) => {
    if (processingPayment) return;
    
    setProcessingPayment(true);
    try {
      const res = await fetch(`${API_URL}/skins/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skinId: skin.id })
      });

      const data = await res.json();
      
      if (res.ok) {
        // Abrir Mercado Pago en una nueva ventana
        const paymentWindow = window.open(
          data.initPoint,
          '_blank',
          'width=800,height=600'
        );
        
        // Opcional: Polling para verificar el estado del pago
        const checkInterval = setInterval(async () => {
          if (paymentWindow.closed) {
            clearInterval(checkInterval);
            setProcessingPayment(false);
            await loadSkins();
          }
        }, 1000);
      } else {
        alert(data.error || 'Error al procesar el pago');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error buying skin:', error);
      alert('Error al procesar el pago');
      setProcessingPayment(false);
    }
  };

  const renderSkinPreview = (skin) => {
    const size = 200;
    const segments = 8;
    const segmentSize = 20;
    
    return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          {skin.pattern === 'gradient' && (
            <linearGradient id={`grad-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={skin.headColor} />
              <stop offset="100%" stopColor={skin.bodyColor} />
            </linearGradient>
          )}
          {skin.pattern === 'rainbow' && (
            <linearGradient id={`grad-${skin.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff0080" />
              <stop offset="25%" stopColor="#ff8000" />
              <stop offset="50%" stopColor="#ffff00" />
              <stop offset="75%" stopColor="#00ff80" />
              <stop offset="100%" stopColor="#0080ff" />
            </linearGradient>
          )}
          {skin.pattern === 'galaxy' && (
            <radialGradient id={`grad-${skin.id}`}>
              <stop offset="0%" stopColor="#4a148c" />
              <stop offset="50%" stopColor="#1a237e" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          )}
        </defs>
        
        {/* Cuerpo de la serpiente */}
        {Array.from({ length: segments }).map((_, i) => {
          const x = 100 + Math.cos((i / segments) * Math.PI * 2) * 60;
          const y = 100 + Math.sin((i / segments) * Math.PI * 2) * 60;
          
          let fill = skin.bodyColor;
          if (skin.pattern === 'gradient' || skin.pattern === 'rainbow' || skin.pattern === 'galaxy') {
            fill = `url(#grad-${skin.id})`;
          } else if (skin.pattern === 'neon') {
            fill = skin.bodyColor;
          }
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={segmentSize / 2}
              fill={fill}
              stroke={skin.pattern === 'neon' ? '#ffffff' : 'none'}
              strokeWidth={skin.pattern === 'neon' ? 2 : 0}
              opacity={0.9}
            />
          );
        })}
        
        {/* Cabeza */}
        <circle
          cx={100}
          cy={40}
          r={segmentSize}
          fill={skin.headColor}
          stroke={skin.pattern === 'neon' ? '#ffffff' : 'none'}
          strokeWidth={skin.pattern === 'neon' ? 2 : 0}
        />
        
        {/* Ojos */}
        <circle cx={95} cy={35} r={4} fill="#ffffff" />
        <circle cx={105} cy={35} r={4} fill="#ffffff" />
        <circle cx={95} cy={35} r={2} fill="#000000" />
        <circle cx={105} cy={35} r={2} fill="#000000" />
        
        {/* Efecto de rastro */}
        {skin.trailEffect === 'sparkles' && (
          <>
            <circle cx={80} cy={120} r={3} fill="#ffff00" opacity={0.6} />
            <circle cx={120} cy={130} r={2} fill="#ffff00" opacity={0.4} />
            <circle cx={90} cy={150} r={2.5} fill="#ffff00" opacity={0.5} />
          </>
        )}
        {skin.trailEffect === 'fire' && (
          <>
            <circle cx={100} cy={160} r={5} fill="#ff6b35" opacity={0.7} />
            <circle cx={95} cy={165} r={4} fill="#ff9a3c" opacity={0.6} />
            <circle cx={105} cy={165} r={3} fill="#ffd700" opacity={0.5} />
          </>
        )}
        {skin.trailEffect === 'stars' && (
          <>
            <text x={75} y={145} fontSize={16} fill="#ffff00" opacity={0.7}>⭐</text>
            <text x={115} y={155} fontSize={12} fill="#ffff00" opacity={0.5}>✨</text>
          </>
        )}
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999
      }}>
        <div style={{ color: 'white', fontSize: 24 }}>Cargando tienda...</div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: 20, overflow: 'auto'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 24, padding: 30, maxWidth: 1200, width: '100%',
          maxHeight: '90vh', overflow: 'auto', position: 'relative',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#ffffff', textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>
              🐍 Tienda de Skins
            </h2>
            <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: 14 }}>
              Desbloquea skins épicas y personaliza tu serpiente
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12,
              color: '#ffffff', padding: '10px 20px', cursor: 'pointer',
              fontSize: 16, fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Grid de skins */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20
        }}>
          {allSkins.map(skin => {
            const owned = hasSkin(skin.id);
            const equipped = isEquipped(skin.id);
            const rarity = RARITY_COLORS[skin.rarity] || RARITY_COLORS.common;

            return (
              <div
                key={skin.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 20,
                  border: `2px solid ${equipped ? '#00ff88' : rarity.bg}`,
                  boxShadow: equipped ? '0 0 30px rgba(0,255,136,0.4)' : `0 0 20px ${rarity.glow}40`,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 40px ${rarity.glow}60`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = equipped ? '0 0 30px rgba(0,255,136,0.4)' : `0 0 20px ${rarity.glow}40`;
                }}
              >
                {/* Badge de rareza */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: rarity.bg,
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  boxShadow: `0 0 15px ${rarity.glow}`
                }}>
                  {rarity.text}
                </div>

                {equipped && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: '#00ff88',
                    color: '#000000',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    ✓ EQUIPADA
                  </div>
                )}

                {/* Preview de la skin */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
                  {renderSkinPreview(skin)}
                </div>

                {/* Info */}
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                  {skin.name}
                </h3>
                <p style={{ margin: '0 0 15px', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                  {skin.description}
                </p>

                {/* Precio y botón */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>
                    {skin.price === 0 ? 'GRATIS' : `$${skin.price.toLocaleString()} COP`}
                  </div>
                  
                  {owned ? (
                    equipped ? (
                      <button
                        style={{
                          background: '#00ff88',
                          border: 'none',
                          borderRadius: 12,
                          color: '#000000',
                          padding: '10px 20px',
                          cursor: 'default',
                          fontSize: 14,
                          fontWeight: 700
                        }}
                      >
                        ✓ En uso
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(skin.id)}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          borderRadius: 12,
                          color: '#ffffff',
                          padding: '10px 20px',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 700,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        Equipar
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleBuy(skin)}
                      disabled={processingPayment || skin.price === 0}
                      style={{
                        background: skin.price === 0 ? '#94a3b8' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#ffffff',
                        padding: '10px 20px',
                        cursor: skin.price === 0 ? 'default' : 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        opacity: processingPayment ? 0.6 : 1
                      }}
                      onMouseEnter={e => {
                        if (skin.price > 0 && !processingPayment) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {processingPayment ? 'Procesando...' : '💳 Comprar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
