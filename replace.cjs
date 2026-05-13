const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'src/data/scriptData.ts'),
    path.join(__dirname, 'talk-script-flow.html')
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace "転送してください" with "引き継ぎしてください" globally for subText
    content = content.replace(/(確認のうえ|確認의うえ)、(.*?)へ転送してください。/g, '$1、$2へ引き継ぎしてください。');
    content = content.replace(/状況を確認のうえ、(.*?)へ転送してください。/g, '状況を確認のうえ、$1へ引き継ぎしてください。');
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
