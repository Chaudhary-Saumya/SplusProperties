import React from 'react';
import mainCoinImg from '../assets/MainCoin.png';

/**
 * Premium Production-Level Gold Coin Component
 * Uses high-resolution Kharsan 24K Gold Coin image asset (`MainCoin.png`).
 */
export const GoldCoin = ({
  size = 24,
  className = '',
  animated = false,
  glow = false,
  style = {}
}) => {
  // Compute size in px if numeric or passed as preset
  let widthHeight = size;
  if (typeof size === 'string') {
    switch (size) {
      case 'xs': widthHeight = 14; break;
      case 'sm': widthHeight = 18; break;
      case 'md': widthHeight = 24; break;
      case 'lg': widthHeight = 32; break;
      case 'xl': widthHeight = 44; break;
      case '2xl': widthHeight = 56; break;
      case 'hero': widthHeight = 72; break;
      default: widthHeight = parseInt(size, 10) || 24;
    }
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none relative ${
        animated ? 'hover:scale-110 transition-transform duration-300' : ''
      } ${className}`}
      style={{ width: widthHeight, height: widthHeight, ...style }}
      title="Kharsan Properties Gold Coin"
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-amber-400/40 blur-md pointer-events-none scale-110"
          aria-hidden="true"
        />
      )}
      <img
        src={mainCoinImg}
        alt="Kharsan Gold Coin"
        className={`w-full h-full object-contain relative z-10 drop-shadow-sm ${
          animated ? 'active:scale-95' : ''
        }`}
        style={{ width: widthHeight, height: widthHeight }}
        loading="eager"
      />
    </div>
  );
};

/**
 * Convenient Coin Badge Component showing Gold Coin icon alongside count/text
 */
export const CoinBadge = ({
  coins,
  size = 'md',
  className = '',
  textClassName = '',
  prefix = '',
  suffix = 'Coins',
  showSuffix = false
}) => {
  let iconSize = 18;
  if (size === 'xs') iconSize = 13;
  if (size === 'sm') iconSize = 15;
  if (size === 'md') iconSize = 18;
  if (size === 'lg') iconSize = 24;
  if (size === 'xl') iconSize = 36;
  if (size === 'hero') iconSize = 52;
  if (typeof size === 'number') iconSize = size;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <GoldCoin size={iconSize} animated />
      <span className={textClassName}>
        {prefix}{typeof coins === 'number' ? coins.toLocaleString() : coins}{showSuffix ? ` ${suffix}` : ''}
      </span>
    </span>
  );
};

export default GoldCoin;
