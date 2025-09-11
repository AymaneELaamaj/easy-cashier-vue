import React from 'react';

type Props = {
  /** taille du carré en px */
  size?: number;
  /** mettre les coins arrondis */
  rounded?: boolean;
  /** afficher le libellé à droite (ex: EasyPOS Cantine) */
  label?: string;
};

export default function BrandVideoLogo({
  size = 36,
  rounded = true,
  label,
}: Props) {
  const box: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded ? 10 : 0,
    overflow: 'hidden',
  };

  // petite astuce fallback image si la vidéo ne charge pas
  const onVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const img = v.nextElementSibling as HTMLImageElement | null;
    v.style.display = 'none';
    if (img) img.style.display = 'block';
  };

  return (
    <a href="/" className="flex items-center gap-2" aria-label="Accueil EasyPOS">
      <div
        className="brand-logo shadow-sm ring-1 ring-black/5 bg-black/5"
        style={box}
      >
        <video
          className="block w-full h-full object-cover"
          src="/video/Negative-mask-effect.mp4"
          poster="/icons/icon-192.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={onVideoError}
        />
        {/* Fallback si vidéo KO ou si l’utilisateur préfère réduire les animations */}
        <img
          src="/icons/icon-192.png"
          alt="EasyPOS"
          style={{ display: 'none', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {label ? (
        <span className="hidden sm:block font-semibold tracking-tight">
          {label}
        </span>
      ) : null}

      {/* Accessibilité : si l’utilisateur préfère réduire le mouvement */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .brand-logo video { display: none; }
          .brand-logo img { display: block; }
        }
      `}</style>
    </a>
  );
}
