'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  type: string;
  category: string;
  text: string;
  icon?: string;
  url?: string;
  openInNewTab: boolean;
  displayMode: 'CONTINUOUS' | 'ROTATE' | 'CAROUSEL';
  config: {
    backgroundColor?: string;
    textColor?: string;
    speed?: number; // en segundos para una vuelta o segundos de rotación
    fontSize?: string;
    height?: number;
    showIcon?: boolean;
    separator?: string;
  };
}

interface AnnouncementBarProps {
  onHeightChange: (height: number) => void;
}

export default function AnnouncementBar({ onHeightChange }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(true);

  // Fetch announcements
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
          if (data.length > 0) {
            const height = data[0]?.config?.height || 40;
            onHeightChange(height);
          } else {
            onHeightChange(0);
          }
        } else {
          onHeightChange(0);
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
        onHeightChange(0);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, [onHeightChange]);

  // Rotar anuncios si el modo es ROTATE
  useEffect(() => {
    if (announcements.length <= 1) return;

    const firstAnn = announcements[0];
    if (firstAnn.displayMode !== 'ROTATE') return;

    const intervalSeconds = firstAnn.config?.speed || 5;

    const timer = setInterval(() => {
      // Desvanecer salida
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setFade(true); // Desvanecer entrada
      }, 500); // Duración de transición de desvanecimiento
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [announcements]);

  if (loading || announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex] || announcements[0];
  const mode = currentAnn.displayMode || 'CONTINUOUS';

  // Configuración de estilo
  const bg = currentAnn.config?.backgroundColor || '#111111';
  const textCol = currentAnn.config?.textColor || '#D4AF37';
  const size = currentAnn.config?.fontSize || '11px';
  const barHeight = currentAnn.config?.height || 40;
  const showIcon = currentAnn.config?.showIcon !== false;
  const sep = currentAnn.config?.separator || '·';

  // Renderizar un anuncio individual
  const renderItem = (ann: Announcement, index: number | string) => {
    const content = (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 select-none">
        {showIcon && ann.icon && <span className="text-xs">{ann.icon}</span>}
        <span>{ann.text}</span>
      </span>
    );

    if (ann.url) {
      if (ann.openInNewTab) {
        return (
          <a
            key={`${ann.id}-${index}`}
            href={ann.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors duration-200"
          >
            {content}
          </a>
        );
      } else {
        return (
          <Link
            key={`${ann.id}-${index}`}
            href={ann.url}
            className="hover:text-white transition-colors duration-200"
          >
            {content}
          </Link>
        );
      }
    }

    return <span key={`${ann.id}-${index}`}>{content}</span>;
  };

  // Estilo inline inyectado dinámicamente para soporte de keyframes de marquee
  const marqueeKeyframeName = `marquee-${currentAnn.id}`;
  const speedSecs = currentAnn.config?.speed || 15;

  return (
    <div
      style={{
        backgroundColor: bg,
        color: textCol,
        fontSize: size,
        height: `${barHeight}px`,
        lineHeight: `${barHeight}px`,
      }}
      className="w-full relative overflow-hidden border-b border-white/5 font-mono uppercase tracking-[0.15em] font-semibold text-center"
    >
      <style>{`
        @keyframes ${marqueeKeyframeName} {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ann-marquee-container {
          display: flex;
          width: max-content;
          animation: ${marqueeKeyframeName} ${speedSecs}s linear infinite;
        }
        .ann-marquee-container:hover {
          animation-play-state: paused;
        }
        .fade-transition {
          transition: opacity 0.5s ease-in-out;
        }
      `}</style>

      {/* Modo 1 y 3: Continuo / Carrusel (Marquee) */}
      {(mode === 'CONTINUOUS' || mode === 'CAROUSEL') && (
        <div className="flex items-center h-full">
          <div className="ann-marquee-container">
            {/* Duplicar anuncios para generar un bucle infinito sin saltos */}
            {Array.from({ length: 4 }).flatMap((_, loopIdx) =>
              announcements.flatMap((ann, index) => [
                renderItem(ann, `${loopIdx}-${index}`),
                <span key={`sep-${loopIdx}-${index}`} className="opacity-40">{sep}</span>,
              ])
            )}
          </div>
        </div>
      )}

      {/* Modo 2: Rotación (Fade transition) */}
      {mode === 'ROTATE' && (
        <div
          style={{ opacity: fade ? 1 : 0 }}
          className="fade-transition flex items-center justify-center w-full h-full"
        >
          {renderItem(currentAnn, currentIndex)}
        </div>
      )}
    </div>
  );
}
