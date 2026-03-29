const fs = require('fs');
let content = fs.readFileSync('agent-tools.ts', 'utf8');
// Replace literal backslash-backtick with just backtick
content = content.replace(/\\`/g, '`');
fs.writeFileSync('agent-tools.ts', content);
console.log('Fixed ' + content.split('\n').length + ' lines');
