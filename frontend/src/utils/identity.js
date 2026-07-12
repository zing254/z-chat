export function generateIdenticonSvg(publicKey, size = 48) {
  const hash = simpleHash(publicKey);
  const hue = hash % 360;
  const sat = 60 + (hash % 30);
  const light = 45 + (hash % 15);

  const rows = 5;
  const cols = 3;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push((hash >> idx) & 1);
    }
    grid.push(row);
  }

  const mirrored = grid.map(row => [...row, ...row.slice(0, 2).reverse()]);

  const cellSize = size / cols;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="hsl(${hue},${sat}%,${light}%)" rx="8"/>`;

  mirrored.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="hsl(${hue},${sat}%,${light + 25}%)" rx="1"/>`;
      }
    });
  });

  svg += '</svg>';
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function truncatePublicKey(publicKey, chars = 8) {
  const s = typeof publicKey === 'string' ? publicKey : '';
  if (s.length <= chars * 2 + 3) return s;
  return `${s.slice(0, chars)}...${s.slice(-chars)}`;
}

export function generateUserId() {
  return `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}