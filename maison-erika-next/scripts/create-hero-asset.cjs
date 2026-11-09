const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const heroDir = path.join(__dirname, '..', 'public', 'hero')
if (!fs.existsSync(heroDir)) {
  fs.mkdirSync(heroDir, { recursive: true })
}

const svg = `
<svg width="1200" height="1400" viewBox="0 0 1200 1400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="silkBg" cx="35%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#fffbf7" />
      <stop offset="25%" stop-color="#f8ede6" />
      <stop offset="60%" stop-color="#eddcd4" />
      <stop offset="100%" stop-color="#d6beb4" />
    </radialGradient>

    <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4dd" />
      <stop offset="20%" stop-color="#e4be78" />
      <stop offset="45%" stop-color="#b88a44" />
      <stop offset="70%" stop-color="#f6e0ad" />
      <stop offset="90%" stop-color="#9c6e2b" />
      <stop offset="100%" stop-color="#dfbb72" />
    </linearGradient>

    <linearGradient id="goldGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eed295" />
      <stop offset="35%" stop-color="#a87834" />
      <stop offset="65%" stop-color="#fae7bc" />
      <stop offset="100%" stop-color="#b88942" />
    </linearGradient>

    <radialGradient id="pearlGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#fcf6f2" />
      <stop offset="60%" stop-color="#edd8d2" />
      <stop offset="90%" stop-color="#cfb3ab" />
      <stop offset="100%" stop-color="#ad9188" />
    </radialGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="8" dy="20" stdDeviation="18" flood-color="#42202f" flood-opacity="0.16" />
    </filter>

    <filter id="heavyShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="12" dy="32" stdDeviation="24" flood-color="#301522" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="1400" fill="url(#silkBg)" />

  <!-- Soft organic drapery waves (Champagne Silk) -->
  <path d="M-100,200 C300,50 600,350 1300,100 L1300,1500 L-100,1500 Z" fill="#ecdcd4" opacity="0.45" />
  <path d="M-100,500 C400,380 750,700 1300,450 L1300,1500 L-100,1500 Z" fill="#e2cec5" opacity="0.4" />
  <path d="M-100,850 C300,750 800,1050 1300,800 L1300,1500 L-100,1500 Z" fill="#d4beb3" opacity="0.35" />

  <!-- Ambient Light Vignette -->
  <circle cx="650" cy="580" r="480" fill="#ffffff" opacity="0.25" filter="blur(40px)" />

  <!-- Luxury Marble Pedestal Stage -->
  <ellipse cx="620" cy="960" rx="430" ry="150" fill="#d2bbb0" opacity="0.5" filter="blur(30px)" />
  <ellipse cx="600" cy="940" rx="390" ry="120" fill="#f6ebe4" filter="url(#softShadow)" />
  <ellipse cx="600" cy="940" rx="382" ry="114" fill="none" stroke="url(#goldGrad1)" stroke-width="1.5" opacity="0.75" />

  <!-- Geometric Arc -->
  <path d="M 320,860 C 320,600 880,600 880,860" fill="none" stroke="url(#goldGrad2)" stroke-width="2.5" opacity="0.4" stroke-dasharray="6 6" />

  <!-- Main Jewelry Showcase: Intertwined Luxury Gold Chains -->
  <g filter="url(#heavyShadow)">
    <ellipse cx="580" cy="620" rx="250" ry="300" fill="none" stroke="url(#goldGrad1)" stroke-width="16" transform="rotate(-14 580 620)" />
    <ellipse cx="580" cy="620" rx="250" ry="300" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="30 90" opacity="0.75" transform="rotate(-14 580 620)" />
  </g>

  <!-- Chain 2 (Delicate Orbit) -->
  <g filter="url(#softShadow)">
    <ellipse cx="630" cy="650" rx="300" ry="210" fill="none" stroke="url(#goldGrad2)" stroke-width="8" transform="rotate(24 630 650)" />
  </g>

  <!-- Baroque Natural Pearl Drop -->
  <g filter="url(#heavyShadow)">
    <path d="M 572,830 L 588,830 L 585,860 L 575,860 Z" fill="url(#goldGrad1)" />
    <path d="M 580,855 C 640,865 675,930 655,1000 C 635,1070 525,1070 505,1000 C 485,930 520,865 580,855 Z" fill="url(#pearlGrad)" />
    <ellipse cx="555" cy="915" rx="36" ry="56" fill="#ffffff" opacity="0.65" transform="rotate(-18 555 915)" filter="blur(4px)" />
    <ellipse cx="545" cy="900" rx="14" ry="22" fill="#ffffff" opacity="0.9" transform="rotate(-18 545 900)" />
  </g>

  <!-- Luxury Ring Accent 1 (Gold Dome Ring) -->
  <g filter="url(#softShadow)">
    <ellipse cx="440" cy="880" rx="64" ry="36" fill="url(#goldGrad1)" transform="rotate(-22 440 880)" />
    <ellipse cx="440" cy="880" rx="52" ry="26" fill="#eddcd4" transform="rotate(-22 440 880)" />
    <ellipse cx="435" cy="872" rx="38" ry="12" fill="#ffffff" opacity="0.7" transform="rotate(-22 435 872)" filter="blur(2px)" />
  </g>

  <!-- Luxury Ring Accent 2 (Pavé Band with Floating Solitaire) -->
  <g filter="url(#softShadow)">
    <ellipse cx="760" cy="890" rx="56" ry="30" fill="url(#goldGrad2)" transform="rotate(18 760 890)" />
    <ellipse cx="760" cy="890" rx="44" ry="20" fill="#e8d2c8" transform="rotate(18 760 890)" />
    <circle cx="770" cy="872" r="11" fill="#ffffff" filter="url(#glow)" />
  </g>

  <!-- Editorial Diamond Sparkles -->
  <g fill="#ffffff" filter="url(#glow)">
    <path d="M 420,440 Q 420,465 445,465 Q 420,465 420,490 Q 420,465 395,465 Q 420,465 420,440 Z" />
    <path d="M 780,480 Q 780,500 800,500 Q 780,500 780,520 Q 780,500 760,500 Q 780,500 780,480 Z" transform="scale(1.1) translate(-60 -20)" />
    <path d="M 650,860 Q 650,875 665,875 Q 650,875 650,890 Q 650,875 635,875 Q 650,875 650,860 Z" />
  </g>

  <!-- Editorial Hallmark Stamp -->
  <g opacity="0.8">
    <text x="600" y="1280" text-anchor="middle" font-family="'Playfair Display', serif" font-size="14" letter-spacing="6" fill="#592b40" font-weight="600">MAISON ERIKA · JOYERÍA FINA</text>
    <text x="600" y="1308" text-anchor="middle" font-family="'DM Sans', sans-serif" font-size="10" letter-spacing="4" fill="#9e818a">EDICIÓN LIMITADA · DESDE AGUASCALIENTES</text>
    <line x1="450" y1="1258" x2="750" y2="1258" stroke="#b88a44" stroke-width="1" opacity="0.5" />
  </g>
</svg>
`

const heroPath = path.join(heroDir, 'editorial-jewelry-hero.jpg')
const posterPath = path.join(heroDir, 'editorial-poster.jpg')

sharp(Buffer.from(svg))
  .jpeg({ quality: 92 })
  .toFile(heroPath)
  .then(() => {
    return sharp(heroPath).jpeg({ quality: 82 }).toFile(posterPath)
  })
  .then(() => {
    console.log('Editorial Hero Image and Poster generated successfully!')
  })
  .catch((err) => {
    console.error('Error generating hero images:', err)
  })
