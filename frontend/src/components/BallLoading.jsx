import React from 'react';

export default function BallLoading({ size = 80, text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative" style={{ width: `${size}px`, height: `${size * 2}px` }}>
        {/* Balón rebotando */}
        <img
          src="/b0n-removebg.png"
          alt="Cargando..."
          className="absolute ball-bounce"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: '0',
          }}
        />
        
        {/* Sombra del balón */}
        <div 
          className="absolute ball-shadow"
          style={{
            width: `${size * 0.6}px`,
            height: `${size * 0.15}px`,
            left: `${size * 0.2}px`,
            bottom: '0',
            background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
          }}
        />
        
        {/* Chispas cuando toca el suelo */}
        <div className="absolute splash-container" style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="splash-particle"
              style={{
                '--angle': `${(i * 60) - 150}deg`,
                '--delay': '0s',
              }}
            />
          ))}
        </div>
      </div>

      {text && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% {
            bottom: 0;
            animation-timing-function: ease-out;
          }
          50% {
            bottom: ${size * 1.2}px;
            animation-timing-function: ease-in;
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes shadow-pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.6);
          }
          50% {
            opacity: 0.15;
            transform: scale(1);
          }
        }

        @keyframes splash {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(1);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(cos(var(--angle)) * 30px),
              calc(sin(var(--angle)) * 15px)
            ) scale(0);
          }
        }

        .ball-bounce {
          animation: 
            bounce 0.8s ease-in-out infinite,
            spin 0.8s linear infinite;
        }

        .ball-shadow {
          animation: shadow-pulse 0.8s ease-in-out infinite;
        }

        .splash-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: radial-gradient(circle, #4285F4, #34A853);
          border-radius: 50%;
          animation: splash 0.8s ease-out infinite;
          animation-delay: var(--delay);
          opacity: 0;
        }

        /* Sincronizar las chispas con el rebote */
        .splash-container {
          animation: splash-trigger 0.8s ease-in-out infinite;
        }

        @keyframes splash-trigger {
          0%, 15%, 100% {
            opacity: 0;
          }
          5%, 10% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
