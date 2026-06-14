/**
 * Ruta secreta: /arachiz-slides-2025
 * Acceso: doble clic en "Arachiz" en la página AboutUs
 * No aparece en ningún menú ni navbar
 */
import React, { useEffect, useRef } from 'react';

export default function Slides() {
  const iframeRef = useRef(null);

  // Cargar model-viewer si no está
  useEffect(() => {
    if (!document.querySelector('script[data-mv]')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      s.setAttribute('data-mv', '1');
      document.head.appendChild(s);
    }
    // Forzar fondo claro igual que la presentación
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', inset: 0 }}>
      <iframe
        ref={iframeRef}
        src="/presentacion-embed.html"
        title="Arachiz Slides"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="camera; microphone; xr-spatial-tracking"
      />
    </div>
  );
}
