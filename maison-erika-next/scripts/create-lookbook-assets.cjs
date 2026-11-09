const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const looksDir = path.join(__dirname, '..', 'public', 'looks')
if (!fs.existsSync(looksDir)) {
  fs.mkdirSync(looksDir, { recursive: true })
}

// ---------------------------------------------------------------------------
// 1. Look 1: Aretes de diseño / Hoops & Drops
// ---------------------------------------------------------------------------
const svg1 = `
<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg1" cx="40%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#fffcf9" />
      <stop offset="35%" stop-color="#f5e8e1" />
      <stop offset="70%" stop-color="#e8d3c9" />
      <stop offset="100%" stop-color="#cfb6ac" />
    </radialGradient>
    <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff2d6" />
      <stop offset="25%" stop-color="#eac680" />
      <stop offset="50%" stop-color="#b6843c" />
      <stop offset="75%" stop-color="#f7dfa6" />
      <stop offset="100%" stop-color="#9d6d2b" />
    </linearGradient>
    <radialGradient id="pearl1" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#fdf4ef" />
      <stop offset="80%" stop-color="#e2ccc5" />
      <stop offset="100%" stop-color="#b89c93" />
    </radialGradient>
    <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="16" stdDeviation="14" flood-color="#42202f" flood-opacity="0.22" />
    </filter>
  </defs>

  <rect width="800" height="1000" fill="url(#bg1)" />

  <!-- Soft architectural backdrop arch -->
  <path d="M 200,900 L 200,340 A 200,200 0 0,1 600,340 L 600,900 Z" fill="#eddcd3" opacity="0.45" />

  <!-- Pedestal glow -->
  <ellipse cx="400" cy="740" rx="260" ry="80" fill="#dfc6bd" opacity="0.4" />

  <!-- Dramatic Earring Duo -->
  <!-- Big Hoop 1 -->
  <circle cx="340" cy="460" r="160" fill="none" stroke="url(#gold1)" stroke-width="26" filter="url(#shadow1)" />
  <circle cx="340" cy="460" r="150" fill="none" stroke="#fff4de" stroke-width="4" opacity="0.6" />

  <!-- Interlocking smaller organic hoop -->
  <circle cx="450" cy="530" r="110" fill="none" stroke="url(#gold1)" stroke-width="22" filter="url(#shadow1)" />

  <!-- Luminous natural baroque pearl drop -->
  <ellipse cx="450" cy="650" rx="38" ry="48" fill="url(#pearl1)" filter="url(#shadow1)" />
  <ellipse cx="438" cy="635" rx="12" ry="16" fill="#ffffff" opacity="0.75" />

  <!-- Delicate Sparkles -->
  <polygon points="400,300 405,315 420,320 405,325 400,340 395,325 380,320 395,315" fill="#fff9ec" opacity="0.9" />
  <polygon points="520,420 523,430 533,433 523,436 520,446 517,436 507,433 517,430" fill="#fff9ec" opacity="0.8" />
  <polygon points="260,540 263,550 273,553 263,556 260,566 257,556 247,553 257,550" fill="#fff9ec" opacity="0.7" />

  <!-- Subtle watermark initials -->
  <text x="400" y="860" font-family="'Playfair Display', serif" font-size="28" font-style="italic" fill="#8f6c77" opacity="0.35" text-anchor="middle" letter-spacing="4">M A I S O N   E R I K A</text>
</svg>
`

// ---------------------------------------------------------------------------
// 2. Look 2: Collar & Gargantilla de Perlas
// ---------------------------------------------------------------------------
const svg2 = `
<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg2" cx="50%" cy="35%" r="85%">
      <stop offset="0%" stop-color="#faf5f0" />
      <stop offset="40%" stop-color="#f2e4dc" />
      <stop offset="75%" stop-color="#dec6bc" />
      <stop offset="100%" stop-color="#c4a59a" />
    </radialGradient>
    <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff4da" />
      <stop offset="30%" stop-color="#e2bd72" />
      <stop offset="60%" stop-color="#a8762f" />
      <stop offset="100%" stop-color="#dcb265" />
    </linearGradient>
    <radialGradient id="pearl2" cx="32%" cy="30%" r="68%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="45%" stop-color="#fdf4ee" />
      <stop offset="85%" stop-color="#dcbeba" />
      <stop offset="100%" stop-color="#a88982" />
    </radialGradient>
    <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="14" stdDeviation="12" flood-color="#361726" flood-opacity="0.2" />
    </filter>
  </defs>

  <rect width="800" height="1000" fill="url(#bg2)" />

  <!-- Silk drape curves in background -->
  <path d="M -50,200 Q 300,350 850,150 L 850,900 L -50,900 Z" fill="#ebdad1" opacity="0.4" />
  <path d="M -50,450 Q 400,600 850,400 L 850,900 L -50,900 Z" fill="#e0c8be" opacity="0.3" />

  <!-- Outer Layered Fine Chain -->
  <path d="M 180,180 Q 400,620 620,180" fill="none" stroke="url(#gold2)" stroke-width="8" stroke-dasharray="14,4" filter="url(#shadow2)" />
  <circle cx="400" cy="510" r="18" fill="url(#gold2)" filter="url(#shadow2)" />

  <!-- Inner Pearl Necklace Arc -->
  <path d="M 220,160 Q 400,480 580,160" fill="none" stroke="none" id="pearlArc" />

  <!-- Individual Pearls on arc -->
  <!-- Left side -->
  <circle cx="230" cy="180" r="16" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="250" cy="220" r="17" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="275" cy="260" r="19" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="305" cy="300" r="21" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="345" cy="330" r="23" fill="url(#pearl2)" filter="url(#shadow2)" />
  <!-- Center Main Pearl -->
  <circle cx="400" cy="350" r="28" fill="url(#pearl2)" filter="url(#shadow2)" />
  <ellipse cx="392" cy="340" rx="9" ry="12" fill="#ffffff" opacity="0.8" />
  <!-- Right side -->
  <circle cx="455" cy="330" r="23" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="495" cy="300" r="21" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="525" cy="260" r="19" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="550" cy="220" r="17" fill="url(#pearl2)" filter="url(#shadow2)" />
  <circle cx="570" cy="180" r="16" fill="url(#pearl2)" filter="url(#shadow2)" />

  <!-- Gold Medallion Charm Hanging from Center Pearl -->
  <line x1="400" y1="378" x2="400" y2="430" stroke="url(#gold2)" stroke-width="6" />
  <circle cx="400" cy="460" r="30" fill="url(#gold2)" filter="url(#shadow2)" />
  <circle cx="400" cy="460" r="24" fill="#693b4a" opacity="0.85" />
  <text x="400" y="468" font-family="'Playfair Display', serif" font-size="20" font-weight="bold" fill="#fae8c0" text-anchor="middle">ME</text>

  <!-- Sparkles -->
  <polygon points="400,280 404,292 416,296 404,300 400,312 396,300 384,296 396,292" fill="#ffffff" opacity="0.95" />
  <polygon points="480,480 483,490 493,493 483,496 480,506 477,496 467,493 477,490" fill="#ffffff" opacity="0.8" />

  <text x="400" y="860" font-family="'Playfair Display', serif" font-size="28" font-style="italic" fill="#8f6c77" opacity="0.35" text-anchor="middle" letter-spacing="4">L U X E   P E A R L S</text>
</svg>
`

// ---------------------------------------------------------------------------
// 3. Look 3: Anillos Apilados / Ring Stacking
// ---------------------------------------------------------------------------
const svg3 = `
<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg3" cx="60%" cy="40%" r="85%">
      <stop offset="0%" stop-color="#fffdfb" />
      <stop offset="35%" stop-color="#f8ede8" />
      <stop offset="70%" stop-color="#ebd5cb" />
      <stop offset="100%" stop-color="#d1b6aa" />
    </radialGradient>
    <linearGradient id="roseGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe6de" />
      <stop offset="25%" stop-color="#e8af9e" />
      <stop offset="50%" stop-color="#be7562" />
      <stop offset="75%" stop-color="#f5c7ba" />
      <stop offset="100%" stop-color="#9a5241" />
    </linearGradient>
    <linearGradient id="gold3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5dc" />
      <stop offset="30%" stop-color="#e7c47d" />
      <stop offset="60%" stop-color="#b8853b" />
      <stop offset="100%" stop-color="#dfb768" />
    </linearGradient>
    <filter id="shadow3" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="6" dy="18" stdDeviation="16" flood-color="#42202f" flood-opacity="0.22" />
    </filter>
  </defs>

  <rect width="800" height="1000" fill="url(#bg3)" />

  <!-- Marble pedestal slab -->
  <polygon points="120,680 680,680 740,790 60,790" fill="#e5d0c6" opacity="0.5" />
  <polygon points="60,790 740,790 740,840 60,840" fill="#cca89c" opacity="0.4" />

  <!-- Ring 1: Organic twisted band (Rose Gold) -->
  <ellipse cx="400" cy="520" rx="150" ry="60" fill="none" stroke="url(#roseGold)" stroke-width="26" filter="url(#shadow3)" />
  <ellipse cx="400" cy="520" rx="142" ry="54" fill="none" stroke="#fff0ea" stroke-width="4" opacity="0.7" />

  <!-- Ring 2: Solitaire with diamond solitaire highlight -->
  <ellipse cx="400" cy="450" rx="140" ry="52" fill="none" stroke="url(#gold3)" stroke-width="20" filter="url(#shadow3)" />
  <!-- Sparkling gemstone setting -->
  <polygon points="400,380 422,398 416,420 384,420 378,398" fill="#ffffff" filter="url(#shadow3)" />
  <polygon points="400,380 412,400 400,418 388,400" fill="#e6f4f8" opacity="0.8" />
  <polygon points="400,380 400,418 388,400" fill="#cce5ee" opacity="0.5" />

  <!-- Ring 3: Pave Eternity Band (stacked below) -->
  <ellipse cx="400" cy="590" rx="160" ry="65" fill="none" stroke="url(#gold3)" stroke-width="18" stroke-dasharray="10,6" filter="url(#shadow3)" />

  <!-- Gem spark flares -->
  <polygon points="400,360 405,372 418,377 405,382 400,394 395,382 382,377 395,372" fill="#ffffff" />
  <circle cx="400" cy="377" r="4" fill="#ffffff" />

  <polygon points="480,540 483,548 491,551 483,554 480,562 477,554 469,551 477,548" fill="#ffffff" opacity="0.8" />

  <text x="400" y="860" font-family="'Playfair Display', serif" font-size="28" font-style="italic" fill="#8f6c77" opacity="0.35" text-anchor="middle" letter-spacing="4">R I N G   S T A C K I N G</text>
</svg>
`

// ---------------------------------------------------------------------------
// 4. Look 4: Unboxing de Lujo & Empaque de Regalo Maison Erika
// ---------------------------------------------------------------------------
const svg4 = `
<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg4" cx="50%" cy="35%" r="85%">
      <stop offset="0%" stop-color="#fff8f5" />
      <stop offset="35%" stop-color="#faece6" />
      <stop offset="70%" stop-color="#e9d2c8" />
      <stop offset="100%" stop-color="#cca89b" />
    </radialGradient>
    <linearGradient id="gold4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff6df" />
      <stop offset="30%" stop-color="#e5c076" />
      <stop offset="60%" stop-color="#ad7b32" />
      <stop offset="100%" stop-color="#ddb463" />
    </linearGradient>
    <linearGradient id="boxPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf3f0" />
      <stop offset="50%" stop-color="#f3dcd4" />
      <stop offset="100%" stop-color="#e0beba" />
    </linearGradient>
    <linearGradient id="ribbonWine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c344b" />
      <stop offset="50%" stop-color="#551e30" />
      <stop offset="100%" stop-color="#3b1220" />
    </linearGradient>
    <filter id="shadow4" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="8" dy="24" stdDeviation="18" flood-color="#381724" flood-opacity="0.25" />
    </filter>
  </defs>

  <rect width="800" height="1000" fill="url(#bg4)" />

  <!-- Velvet platform -->
  <ellipse cx="400" cy="730" rx="300" ry="100" fill="#dfc4b9" opacity="0.45" />

  <!-- Jewelry Gift Box Base -->
  <g filter="url(#shadow4)">
    <!-- Box Bottom Body -->
    <rect x="250" y="440" width="300" height="230" rx="16" fill="url(#boxPink)" />
    <!-- Box Lid angled slightly -->
    <rect x="235" y="410" width="330" height="60" rx="12" fill="#fae8e2" stroke="url(#gold4)" stroke-width="3" />
  </g>

  <!-- Luxury Wine/Burgundy Silk Ribbon (Vertical) -->
  <rect x="375" y="410" width="50" height="260" fill="url(#ribbonWine)" opacity="0.95" />
  <!-- Horizontal Ribbon -->
  <rect x="250" y="520" width="300" height="40" fill="url(#ribbonWine)" opacity="0.95" />

  <!-- Gold Bow on Top of Lid -->
  <g filter="url(#shadow4)">
    <!-- Left Loop -->
    <path d="M 400,410 C 330,340 310,380 370,410 Z" fill="url(#gold4)" />
    <!-- Right Loop -->
    <path d="M 400,410 C 470,340 490,380 430,410 Z" fill="url(#gold4)" />
    <!-- Knot -->
    <circle cx="400" cy="410" r="18" fill="#fff1d0" stroke="url(#gold4)" stroke-width="4" />
    <!-- Ribbon Tails -->
    <path d="M 390,420 Q 360,490 330,510" fill="none" stroke="url(#gold4)" stroke-width="14" stroke-linecap="round" />
    <path d="M 410,420 Q 440,490 470,510" fill="none" stroke="url(#gold4)" stroke-width="14" stroke-linecap="round" />
  </g>

  <!-- Wax Seal with Monogram ME -->
  <g filter="url(#shadow4)">
    <circle cx="400" cy="540" r="42" fill="url(#gold4)" />
    <circle cx="400" cy="540" r="34" fill="#581f32" />
    <text x="400" y="548" font-family="'Playfair Display', serif" font-size="24" font-weight="bold" fill="#fae8c0" text-anchor="middle">ME</text>
  </g>

  <!-- Card sticking out: "Hecho con amor" -->
  <g filter="url(#shadow4)">
    <polygon points="460,330 570,360 550,440 440,410" fill="#ffffff" />
    <text x="495" y="380" font-family="'Playfair Display', serif" font-size="12" font-style="italic" fill="#6b3a4a" transform="rotate(15 495 380)">Con amor ♡</text>
  </g>

  <!-- Sparkles -->
  <polygon points="270,370 274,382 286,386 274,390 270,402 266,390 254,386 266,382" fill="#ffffff" opacity="0.9" />
  <polygon points="560,560 563,570 573,573 563,576 560,586 557,576 547,573 557,570" fill="#ffffff" opacity="0.8" />

  <text x="400" y="860" font-family="'Playfair Display', serif" font-size="28" font-style="italic" fill="#8f6c77" opacity="0.35" text-anchor="middle" letter-spacing="4">U N B O X I N G   E X P E R I E N C E</text>
</svg>
`

async function generateAll() {
  console.log('Generando Lookbook Assets...')

  await sharp(Buffer.from(svg1))
    .jpeg({ quality: 92 })
    .toFile(path.join(looksDir, 'look-1-aretes.jpg'))
  console.log('✓ Creado look-1-aretes.jpg')

  await sharp(Buffer.from(svg2))
    .jpeg({ quality: 92 })
    .toFile(path.join(looksDir, 'look-2-collar.jpg'))
  console.log('✓ Creado look-2-collar.jpg')

  await sharp(Buffer.from(svg3))
    .jpeg({ quality: 92 })
    .toFile(path.join(looksDir, 'look-3-anillos.jpg'))
  console.log('✓ Creado look-3-anillos.jpg')

  await sharp(Buffer.from(svg4))
    .jpeg({ quality: 92 })
    .toFile(path.join(looksDir, 'look-4-unboxing.jpg'))
  console.log('✓ Creado look-4-unboxing.jpg')

  console.log('Todos los assets del lookbook generados con éxito.')
}

generateAll().catch(err => {
  console.error('Error generando assets:', err)
  process.exit(1)
})
