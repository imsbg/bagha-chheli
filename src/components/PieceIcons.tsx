import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Custom Vector SVG Tiger Medallion Icon (Replaces legacy PNG)
 */
export const TigerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="tigerMedallionGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="55%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
        <linearGradient id="tigerRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Outer Medallion Token */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#tigerMedallionGrad)"
        stroke="url(#tigerRimGrad)"
        strokeWidth="3"
      />
      {/* Inner Carved Ring */}
      <circle
        cx="32"
        cy="32"
        r="25"
        stroke="#FEF3C7"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
      {/* Tiger Ears */}
      <circle cx="17" cy="17" r="6.2" fill="#7C2D12" stroke="#FDE68A" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="3.2" fill="#FDBA74" />
      <circle cx="47" cy="17" r="6.2" fill="#7C2D12" stroke="#FDE68A" strokeWidth="1.5" />
      <circle cx="47" cy="17" r="3.2" fill="#FDBA74" />

      {/* Tiger Head Base */}
      <path
        d="M15 30C15 20.5 22.5 15 32 15C41.5 15 49 20.5 49 30C49 41 41.5 49 32 49C22.5 49 15 41 15 30Z"
        fill="#F97316"
        stroke="#7C2D12"
        strokeWidth="1.8"
      />

      {/* White Cheek Ruff */}
      <path
        d="M16 33C16 41 23 47.5 32 47.5C41 47.5 48 41 48 33C45 35 42 36 32 36C22 36 19 35 16 33Z"
        fill="#FFFBEB"
      />

      {/* Forehead Royal Tiger Stripes */}
      <path d="M32 16V24" stroke="#1C1917" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M26 18L29 22" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38 18L35 22" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      {/* Side Cheek Stripes */}
      <path d="M16 27L22 29" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M16 32L21 33" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M48 27L42 29" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M48 32L43 33" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />

      {/* Fierce Amber/Gold Eyes */}
      <ellipse cx="25" cy="29" rx="3.4" ry="2.6" fill="#FEF08A" stroke="#1C1917" strokeWidth="1.5" />
      <circle cx="25.3" cy="29" r="1.4" fill="#1C1917" />
      <ellipse cx="39" cy="29" rx="3.4" ry="2.6" fill="#FEF08A" stroke="#1C1917" strokeWidth="1.5" />
      <circle cx="38.7" cy="29" r="1.4" fill="#1C1917" />

      {/* Muzzle & Nose */}
      <ellipse cx="28.5" cy="39" rx="4.5" ry="3.6" fill="#FEF3C7" stroke="#7C2D12" strokeWidth="1.2" />
      <ellipse cx="35.5" cy="39" rx="4.5" ry="3.6" fill="#FEF3C7" stroke="#7C2D12" strokeWidth="1.2" />
      <polygon points="28.5,35 35.5,35 32,39.5" fill="#E11D48" stroke="#1C1917" strokeWidth="1.2" />
      <path d="M32 39.5V43" stroke="#1C1917" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 43.2Q32 45.5 36 43.2" stroke="#1C1917" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Custom Vector SVG Goat Medallion Icon (Replaces legacy PNG)
 */
export const GoatIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="goatMedallionGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </radialGradient>
        <linearGradient id="goatRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      {/* Outer Medallion Token */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#goatMedallionGrad)"
        stroke="url(#goatRimGrad)"
        strokeWidth="3"
      />
      {/* Inner Carved Ring */}
      <circle
        cx="32"
        cy="32"
        r="25"
        stroke="#D1FAE5"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />

      {/* Curved Goat Horns */}
      <path
        d="M26 20C23 12 15 11 12 16C15 16 19 18 21 23"
        fill="#FDE68A"
        stroke="#78350F"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 20C41 12 49 11 52 16C49 16 45 18 43 23"
        fill="#FDE68A"
        stroke="#78350F"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Side Ears */}
      <ellipse
        cx="15.5"
        cy="26"
        rx="5.5"
        ry="2.6"
        transform="rotate(-22 15.5 26)"
        fill="#FEF3C7"
        stroke="#78350F"
        strokeWidth="1.5"
      />
      <ellipse
        cx="48.5"
        cy="26"
        rx="5.5"
        ry="2.6"
        transform="rotate(22 48.5 26)"
        fill="#FEF3C7"
        stroke="#78350F"
        strokeWidth="1.5"
      />

      {/* Goat Head */}
      <path
        d="M21 26C21 19.5 25.5 16.5 32 16.5C38.5 16.5 43 19.5 43 26C43 35.5 38.5 45.5 32 45.5C25.5 45.5 21 35.5 21 26Z"
        fill="#FFFBEB"
        stroke="#78350F"
        strokeWidth="1.8"
      />

      {/* Forehead Tuft */}
      <path
        d="M28 18Q32 22 36 18"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Goat Eyes */}
      <circle cx="26.5" cy="28.5" r="2.3" fill="#1C1917" />
      <circle cx="25.9" cy="27.9" r="0.7" fill="#FFFFFF" />
      <circle cx="37.5" cy="28.5" r="2.3" fill="#1C1917" />
      <circle cx="36.9" cy="27.9" r="0.7" fill="#FFFFFF" />

      {/* Muzzle & Cute Goatee Beard */}
      <ellipse cx="32" cy="39.5" rx="6" ry="4.5" fill="#FDE68A" stroke="#92400E" strokeWidth="1.3" />
      <path d="M29.5 38.5L32 40.5L34.5 38.5" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 40.5V43" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
      {/* Goatee Beard */}
      <path
        d="M29 45L32 51.5L35 45Z"
        fill="#FDE68A"
        stroke="#78350F"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Brand Logo SVG for Bagha Chheli Header & Hero (Uses the Tiger Face SVG as requested)
 */
export const BaghaChheliLogoSvg: React.FC<IconProps> = ({ className = 'w-7 h-7', size }) => {
  return <TigerIcon className={className} size={size} />;
};

interface BoardPieceSvgProps {
  cx: number;
  cy: number;
  isSelected?: boolean;
  isLastMove?: boolean;
  isTrapped?: boolean;
  isThreatened?: boolean;
  scale?: number;
}

/**
 * Inline SVG <g> Tiger Piece rendered directly on the 5×5 Alquerque SVG Board (0..100 coordinate space)
 */
export const BoardTigerPieceG: React.FC<BoardPieceSvgProps> = ({
  cx,
  cy,
  isSelected = false,
  isTrapped = false,
  scale = 1,
}) => {
  const r = 7.4 * scale;
  return (
    <g transform={`translate(${cx}, ${cy})`} className="transition-transform duration-200">
      {/* Selection Aura */}
      {isSelected && (
        <>
          <circle
            cx={0}
            cy={0}
            r={r + 3.2}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeDasharray="2.2 1.4"
          />
          <circle
            cx={0}
            cy={0}
            r={r + 1.8}
            fill="#38BDF8"
            fillOpacity="0.22"
          />
        </>
      )}

      {/* Trapped Ring Indicator */}
      {isTrapped && (
        <circle
          cx={0}
          cy={0}
          r={r + 2}
          fill="none"
          stroke="#EF4444"
          strokeWidth="1.1"
          strokeDasharray="1.8 1.2"
        />
      )}

      {/* Token Drop Shadow */}
      <circle cx={0} cy={0.9} r={r} fill="#000000" fillOpacity="0.38" />

      {/* Outer Tiger Medallion */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill="url(#boardTigerGrad)"
        stroke={isSelected ? '#38BDF8' : '#FDE68A'}
        strokeWidth={isSelected ? 1.3 : 0.9}
      />

      {/* Inner Tiger Face Vector */}
      <g transform={`scale(${0.21 * scale}) translate(-32, -32)`}>
        {/* Ears */}
        <circle cx="17" cy="17" r="6" fill="#7C2D12" stroke="#FDE68A" strokeWidth="1.8" />
        <circle cx="47" cy="17" r="6" fill="#7C2D12" stroke="#FDE68A" strokeWidth="1.8" />
        {/* Head */}
        <path
          d="M15 30C15 20.5 22.5 15 32 15C41.5 15 49 20.5 49 30C49 41 41.5 49 32 49C22.5 49 15 41 15 30Z"
          fill="#F97316"
          stroke="#7C2D12"
          strokeWidth="2"
        />
        {/* Cheek Ruff */}
        <path
          d="M16 33C16 41 23 47.5 32 47.5C41 47.5 48 41 48 33C45 35 42 36 32 36C22 36 19 35 16 33Z"
          fill="#FFFBEB"
        />
        {/* Stripes */}
        <path d="M32 16V24M26 18L29 22M38 18L35 22" stroke="#1C1917" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M16 28L22 30M48 28L42 30" stroke="#1C1917" strokeWidth="2.6" strokeLinecap="round" />
        {/* Eyes */}
        <ellipse cx="25" cy="29" rx="3.6" ry="2.8" fill="#FEF08A" stroke="#1C1917" strokeWidth="1.5" />
        <circle cx="25.2" cy="29" r="1.5" fill="#1C1917" />
        <ellipse cx="39" cy="29" rx="3.6" ry="2.8" fill="#FEF08A" stroke="#1C1917" strokeWidth="1.5" />
        <circle cx="38.8" cy="29" r="1.5" fill="#1C1917" />
        {/* Muzzle */}
        <ellipse cx="28.5" cy="39" rx="4.5" ry="3.5" fill="#FEF3C7" />
        <ellipse cx="35.5" cy="39" rx="4.5" ry="3.5" fill="#FEF3C7" />
        <polygon points="28.5,35 35.5,35 32,39.5" fill="#E11D48" />
        <path d="M28 43Q32 45.5 36 43" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Trapped Lock Tag */}
      {isTrapped && (
        <g transform={`translate(${r * 0.72}, ${-r * 0.72})`}>
          <circle cx={0} cy={0} r={2.3} fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.4" />
          <path d="M-0.9 -0.9L0.9 0.9M0.9 -0.9L-0.9 0.9" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/**
 * Inline SVG <g> Goat Piece rendered directly on the 5×5 Alquerque SVG Board (0..100 coordinate space)
 */
export const BoardGoatPieceG: React.FC<BoardPieceSvgProps> = ({
  cx,
  cy,
  isSelected = false,
  isThreatened = false,
  scale = 1,
}) => {
  const r = 6.4 * scale;
  return (
    <g transform={`translate(${cx}, ${cy})`} className="transition-transform duration-200">
      {/* Selection Aura */}
      {isSelected && (
        <>
          <circle
            cx={0}
            cy={0}
            r={r + 3}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeDasharray="2.2 1.4"
          />
          <circle cx={0} cy={0} r={r + 1.6} fill="#38BDF8" fillOpacity="0.22" />
        </>
      )}

      {/* Threatened Warning Ring (Smart Hints Mode) */}
      {isThreatened && (
        <circle
          cx={0}
          cy={0}
          r={r + 2.1}
          fill="none"
          stroke="#F43F5E"
          strokeWidth="1.1"
          strokeDasharray="1.8 1.2"
        />
      )}

      {/* Token Drop Shadow */}
      <circle cx={0} cy={0.85} r={r} fill="#000000" fillOpacity="0.35" />

      {/* Outer Goat Medallion */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill="url(#boardGoatGrad)"
        stroke={isSelected ? '#38BDF8' : isThreatened ? '#FDA4AF' : '#A7F3D0'}
        strokeWidth={isSelected ? 1.3 : 0.85}
      />

      {/* Inner Goat Face Vector */}
      <g transform={`scale(${0.185 * scale}) translate(-32, -32)`}>
        {/* Horns */}
        <path
          d="M26 20C23 11 14 10 11 16C15 16 19 18 21 23"
          fill="#FDE68A"
          stroke="#78350F"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M38 20C41 11 50 10 53 16C49 16 45 18 43 23"
          fill="#FDE68A"
          stroke="#78350F"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Ears */}
        <ellipse
          cx="15.5"
          cy="26"
          rx="5.5"
          ry="2.6"
          transform="rotate(-22 15.5 26)"
          fill="#FEF3C7"
          stroke="#78350F"
          strokeWidth="1.8"
        />
        <ellipse
          cx="48.5"
          cy="26"
          rx="5.5"
          ry="2.6"
          transform="rotate(22 48.5 26)"
          fill="#FEF3C7"
          stroke="#78350F"
          strokeWidth="1.8"
        />
        {/* Head */}
        <path
          d="M21 26C21 19.5 25.5 16.5 32 16.5C38.5 16.5 43 19.5 43 26C43 35.5 38.5 45.5 32 45.5C25.5 45.5 21 35.5 21 26Z"
          fill="#FFFBEB"
          stroke="#78350F"
          strokeWidth="2"
        />
        {/* Eyes */}
        <circle cx="26.5" cy="28.5" r="2.6" fill="#1C1917" />
        <circle cx="37.5" cy="28.5" r="2.6" fill="#1C1917" />
        {/* Muzzle */}
        <ellipse cx="32" cy="39.5" rx="6" ry="4.5" fill="#FDE68A" stroke="#92400E" strokeWidth="1.5" />
        <path d="M29.5 38.5L32 40.5L34.5 38.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        {/* Beard */}
        <path d="M29 45L32 51.5L35 45Z" fill="#FDE68A" stroke="#78350F" strokeWidth="1.5" />
      </g>

      {/* Threatened Exclamation Badge */}
      {isThreatened && (
        <g transform={`translate(${r * 0.72}, ${-r * 0.72})`}>
          <circle cx={0} cy={0} r={2.2} fill="#E11D48" stroke="#FFFFFF" strokeWidth="0.4" />
          <text
            x={0}
            y={0.85}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="2.7"
            fontWeight="900"
          >
            !
          </text>
        </g>
      )}
    </g>
  );
};
