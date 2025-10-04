//@ts-nocheck
// TODO maybe i'll worry about type checking later
// Generate a consistent UUID based on browser fingerprint
async function generateBrowserUUID() {
  const fingerprint = await collectFingerprint();
  const uuid = await fingerprintToUUID(fingerprint);
  return uuid;
}

// Collect various browser/device characteristics
async function collectFingerprint() {
  const data = {
    // Screen properties
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    },
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Language
    language: navigator.language,
    languages: navigator.languages.join(','),
    
    // Platform
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    
    // Hardware
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory || 'unknown',
    
    // Canvas fingerprint (very distinctive)
    canvas: getCanvasFingerprint(),
    
    // WebGL fingerprint
    webgl: getWebGLFingerprint(),
    
    // Fonts (simplified check)
    fonts: await checkFonts(),
    
    // Audio fingerprint
    audio: await getAudioFingerprint()
  };
  
  return JSON.stringify(data);
}

// Canvas fingerprinting
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas FP', 4, 17);
    
    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

// WebGL fingerprinting
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    };
  } catch (e) {
    return 'webgl-error';
  }
}

// Check for common fonts
async function checkFonts() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
  const available = [];
  
  for (const font of testFonts) {
    if (await isFontAvailable(font, baseFonts)) {
      available.push(font);
    }
  }
  
  return available.join(',');
}

// Helper to detect font availability
async function isFontAvailable(font, baseFonts) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const text = 'mmmmmmmmmmlli';
  
  ctx.font = '72px ' + baseFonts[0];
  const baseWidth = ctx.measureText(text).width;
  
  ctx.font = '72px ' + font + ', ' + baseFonts[0];
  const testWidth = ctx.measureText(text).width;
  
  return baseWidth !== testWidth;
}

// Audio fingerprinting
async function getAudioFingerprint() {
  try {
    const context = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    
    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);
    
    const buffer = await context.startRendering();
    const output = buffer.getChannelData(0);
    
    // Get a sample of the audio fingerprint
    let hash = 0;
    for (let i = 4500; i < 5000; i++) {
      hash += Math.abs(output[i]);
    }
    
    return hash.toString();
  } catch (e) {
    return 'audio-error';
  }
}

// Convert fingerprint string to UUID v5 format
async function fingerprintToUUID(fingerprint) {
  // Use SubtleCrypto to create a hash
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convert to hex and format as UUID
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Format as UUID v5 (RFC 4122)
  return [
    hashHex.substring(0, 8),
    hashHex.substring(8, 12),
    '5' + hashHex.substring(13, 16), // Version 5
    ((parseInt(hashHex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hashHex.substring(18, 20),
    hashHex.substring(20, 32)
  ].join('-');
}

// Store and retrieve UUID (using both localStorage and cookies)
function storeUserUUID(uuid) {
  // Store in localStorage (primary - faster access)
  localStorage.setItem('user_fingerprint', uuid);
  
  // Also store in cookie as backup (more persistent)
  document.cookie = `user_fingerprint=${uuid}; max-age=31536000; path=/; SameSite=Strict`;
  
  console.log('UUID stored in both localStorage and cookie');
}

function getStoredUUID() {
  // Try localStorage first (faster)
  let uuid = localStorage.getItem('user_fingerprint');
  
  if (uuid) {
    // console.log('UUID retrieved from localStorage');
    // Ensure cookie is also set (in case it was cleared)
    if (!document.cookie.includes('user_fingerprint=')) {
      document.cookie = `user_fingerprint=${uuid}; max-age=31536000; path=/; SameSite=Strict`;
    }
    return uuid;
  }
  
  // Fallback to cookie if localStorage was cleared
  const match = document.cookie.match(/user_fingerprint=([^;]+)/);
  if (match) {
    uuid = match[1];
    console.log('UUID retrieved from cookie (localStorage was empty)');
    // Restore to localStorage
    localStorage.setItem('user_fingerprint', uuid);
    return uuid;
  }
  
  console.log('No stored UUID found');
  return null;
}

// Main function to get or generate UUID
export async function getUserUUID() {
  // Check if we already have a stored UUID
  let uuid = getStoredUUID();
  
  if (!uuid) {
    // Generate new UUID based on fingerprint
    uuid = await generateBrowserUUID();
    storeUserUUID(uuid);
    console.log('Generated new UUID:', uuid);
  } else {
    // console.log('Using stored UUID:', uuid);
  }
  
  return uuid;
}

// Example usage:
// Get the user's UUID
// getUserUUID().then(uuid => {
//   console.log('User UUID:', uuid);
  
//   // Use this UUID to check if user already submitted
//   // For example, send to your backend:
//   // fetch('/check-submission', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ userUUID: uuid })
//   // });
// });