const fs = require('fs');

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/node_modules/three', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.cpSync('src', 'dist/src', { recursive: true });
fs.cpSync('node_modules/three', 'dist/node_modules/three', { recursive: true });
console.log('dist built');
