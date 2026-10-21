// node build.js -> dist/index.html (single file, three inlined as global)
const fs=require('fs');let three=fs.readFileSync('vendor/three-0.170.0.module.min.js','utf8');
const m=three.match(/export\s*\{([^}]*)\};?\s*$/);if(!m)throw 'no export';
three=three.slice(0,m.index)+'const THREE={'+m[1].split(',').map(s=>{const [a,b]=s.trim().split(/\s+as\s+/);return (b||a)+':'+a}).join(',')+'};';
const af={};for(const f of fs.readdirSync('audio').filter(f=>/\.(ogg|mp3)$/.test(f))){const n=f.replace(/\.\w+$/,'');if(!af[n]||f.endsWith('.mp3'))af[n]=f}
const game='window.AUDIO_FILES='+JSON.stringify(Object.values(af))+';\n'+fs.readFileSync('src/game.js','utf8');
const html=fs.readFileSync('src/index.html','utf8').replace('<!--SCRIPT-->',()=>'<script type="module">\n'+three+'\n{\n'+game+'\n}\n</script>');
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',html);console.log('dist/index.html',(html.length/1024).toFixed(0)+' KB');
