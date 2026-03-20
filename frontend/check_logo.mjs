import sharp from 'sharp';
const meta = await sharp('./public/logo.png').metadata();
console.log('channels:', meta.channels, '| hasAlpha:', meta.hasAlpha, '| size:', meta.width, 'x', meta.height);
