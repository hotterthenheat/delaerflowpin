const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules')) walk(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const colorCounts = {};
walk('src').forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Include colors in any arbitrary tailwind class
  const matches = content.match(/-\[#[0-9a-fA-F]{6}\]/g);
  if (matches) {
    matches.forEach(m => {
      const col = m.toLowerCase();
      colorCounts[col] = (colorCounts[col] || 0) + 1;
    });
  }
});

const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
sorted.forEach(([color, count]) => {
  console.log(`${count}: ${color}`);
});
