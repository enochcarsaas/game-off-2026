// Game Off 2026 core. Uses global THREE (inlined by build.js).
const $=s=>document.querySelector(s);
const cv=$('#c');
// ---------- settings ----------
const SET=Object.assign({vol:0.8,music:0.6,quality:'auto'},JSON.parse(localStorage.getItem('go26set')||'{}'));
const saveSet=()=>localStorage.setItem('go26set',JSON.stringify(SET));
// ---------- renderer w/ capped res + auto quality ----------
const R=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'});
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFShadowMap;
const QL=[{px:0.6,sh:false,cap:720},{px:0.85,sh:true,cap:900},{px:1,sh:true,cap:1080}];
let qi=SET.quality==='auto'?(matchMedia('(pointer:coarse)').matches?1:2):+SET.quality;
function resize(){const q=QL[qi],w=innerWidth,h=innerHeight;let pr=Math.min(devicePixelRatio||1,2)*q.px;
 const lim=q.cap/Math.min(w,h);if(pr>lim)pr=Math.max(lim,0.5);R.setPixelRatio(pr);R.setSize(w,h,false);R.shadowMap.enabled=q.sh;sun.castShadow=q.sh;
 cam.aspect=w/h;cam.fov=w<h?70:55;cam.updateProjectionMatrix()}
// ---------- scene, toon style ----------
const scene=new THREE.Scene();const SKY=0x2a1f4d;scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,18,55);
const cam=new THREE.PerspectiveCamera(55,1,0.1,120);
scene.add(new THREE.HemisphereLight(0x9fb8ff,0x3a2040,1.1));
const sun=new THREE.DirectionalLight(0xffe2b0,2.2);sun.position.set(8,16,6);sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,far:50});scene.add(sun,sun.target);
const ramp=new THREE.DataTexture(new Uint8Array([90,160,255]),3,1,THREE.RedFormat);ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const toon=c=>new THREE.MeshToonMaterial({color:c,gradientMap:ramp});
const mesh=(g,c,sh=true)=>{const m=new THREE.Mesh(g,toon(c));m.castShadow=sh;m.receiveShadow=true;return m};
// greybox level
const ARENA=16;
const ground=mesh(new THREE.CylinderGeometry(ARENA,ARENA+1,1,40),0x4b3a78,false);ground.position.y=-0.5;scene.add(ground);
const solids=[];// static AABB blocks {x,z,hx,hz,h}
function block(x,z,hx,hz,h,c){const m=mesh(new THREE.BoxGeometry(hx*2,h,hz*2),c);m.position.set(x,h/2,z);scene.add(m);solids.push({x,z,hx,hz,h})}
[[6,0,1,3,2],[-6,0,1,3,2],[0,7,3,1,1.2],[0,-7,3,1,1.2],[9,9,1.2,1.2,3],[-9,-9,1.2,1.2,3],[-9,9,1.2,1.2,3],[9,-9,1.2,1.2,3]].forEach(b=>block(...b,0x6d5aa8));
for(let i=0;i<14;i++){const a=i/14*6.283,r=ARENA+3+Math.random()*6,h=2+Math.random()*6;const m=mesh(new THREE.ConeGeometry(1.5+Math.random(),h,5),0x3a2c66,false);m.position.set(Math.cos(a)*r,h/2-0.5,Math.sin(a)*r);scene.add(m)}
// player
const P={p:new THREE.Vector3(),v:new THREE.Vector3(),r:0.6,dash:0,dcd:0,hp:3,inv:0,face:0};
const pm=new THREE.Group();const body=mesh(new THREE.IcosahedronGeometry(0.6,1),0xffc94d);body.position.y=0.6;pm.add(body);
const eye=mesh(new THREE.BoxGeometry(0.5,0.15,0.1),0x221133,false);eye.position.set(0,0.75,0.55);pm.add(eye);scene.add(pm);
// pickups & enemies
const sparks=[],foes=[];const sparkG=new THREE.OctahedronGeometry(0.3),foeG=new THREE.DodecahedronGeometry(0.55);
function spawnSpark(){const m=mesh(sparkG,0x5cf2ff,false);m.material.emissive=new THREE.Color(0x1a8aa0);const a=Math.random()*6.283,r=2+Math.random()*(ARENA-4);m.position.set(Math.cos(a)*r,0.6,Math.sin(a)*r);scene.add(m);sparks.push(m)}
function spawnFoe(){const m=mesh(foeG,0xff4d6d);const a=Math.random()*6.283;m.position.set(Math.cos(a)*(ARENA-1.5),0.55,Math.sin(a)*(ARENA-1.5));scene.add(m);foes.push({m,v:new THREE.Vector3(),hp:1,spd:2.2+G.t*0.04})}
// particles (pooled instanced)
const PN=300,pg=new THREE.InstancedMesh(new THREE.BoxGeometry(0.15,0.15,0.15),new THREE.MeshBasicMaterial({color:0xffffff}),PN);pg.frustumCulled=false;scene.add(pg);
const parts=Array.from({length:PN},()=>({life:0,p:new THREE.Vector3(),v:new THREE.Vector3()}));let pIdx=0;const tmpM=new THREE.Matrix4(),col=new THREE.Color();
function burst(pos,c,n=14,s=6){col.set(c);for(let i=0;i<n;i++){const q=parts[pIdx=(pIdx+1)%PN];q.life=0.5+Math.random()*0.4;q.p.copy(pos);q.v.set((Math.random()-.5)*s,Math.random()*s,(Math.random()-.5)*s);pg.setColorAt(pIdx,col)}pg.instanceColor.needsUpdate=true}
// ---------- audio hook (files from Game Music in audio/) ----------
const AU={ctx:null,buf:{},gain:null,mg:null,music:null,
 init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.gain=this.ctx.createGain();this.mg=this.ctx.createGain();this.gain.connect(this.ctx.destination);this.mg.connect(this.gain);this.setVol();
  (window.AUDIO_FILES||[]).forEach(f=>this.load(f))}catch(e){}},
 async load(f){const n=f.replace(/\.\w+$/,'');try{const r=await fetch('audio/'+f);if(!r.ok)return;this.buf[n]=await this.ctx.decodeAudioData(await r.arrayBuffer());if(n==='music')this.playMusic()}catch(e){}},
 play(n,rate=1){const b=this.buf[n];if(!b||!this.ctx)return;const s=this.ctx.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(this.gain);s.start()},
 playMusic(){if(this.music||!this.buf.music)return;const s=this.ctx.createBufferSource();s.buffer=this.buf.music;s.loop=true;s.connect(this.mg);s.start();this.music=s},
 setVol(){if(this.gain){this.gain.gain.value=SET.vol;this.mg.gain.value=SET.music}},
 suspend(){this.ctx&&this.ctx.suspend()},resume(){this.ctx&&this.ctx.resume()}};
// ---------- input: keyboard/mouse + touch stick ----------
const IN={k:{},sx:0,sy:0,dash:false,tid:null,ox:0,oy:0,used:{key:0,touch:0,mouse:0}};
addEventListener('keydown',e=>{IN.k[e.code]=1;IN.used.key++;if(e.code==='Space'||e.code==='ShiftLeft')IN.dash=true;if(e.code==='Escape'||e.code==='KeyP')togglePause()});
addEventListener('keyup',e=>IN.k[e.code]=0);
cv.addEventListener('mousedown',e=>{if(e.button===0){IN.dash=true;IN.used.mouse++}});
const stick=$('#stick'),knob=$('#knob');
cv.addEventListener('touchstart',e=>{e.preventDefault();AU.init();for(const t of e.changedTouches){IN.used.touch++;
 if(t.clientX<innerWidth*0.55&&IN.tid===null){IN.tid=t.identifier;IN.ox=t.clientX;IN.oy=t.clientY;stick.style.display='block';stick.style.left=t.clientX+'px';stick.style.top=t.clientY+'px';knob.style.transform='translate(-50%,-50%)'}else IN.dash=true}},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===IN.tid){let dx=t.clientX-IN.ox,dy=t.clientY-IN.oy;const L=Math.hypot(dx,dy),M=55;if(L>M){dx*=M/L;dy*=M/L}IN.sx=dx/M;IN.sy=dy/M;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}},{passive:false});
const tend=e=>{for(const t of e.changedTouches)if(t.identifier===IN.tid){IN.tid=null;IN.sx=IN.sy=0;stick.style.display='none'}};
cv.addEventListener('touchend',tend);cv.addEventListener('touchcancel',tend);
function moveVec(){let x=(IN.k.KeyD||IN.k.ArrowRight?1:0)-(IN.k.KeyA||IN.k.ArrowLeft?1:0),z=(IN.k.KeyS||IN.k.ArrowDown?1:0)-(IN.k.KeyW||IN.k.ArrowUp?1:0);
 x+=IN.sx;z+=IN.sy;const L=Math.hypot(x,z);return L>1?[x/L,z/L]:[x,z]}
// ---------- game state ----------
const G={state:'menu',t:0,score:0,combo:1,ctime:0,best:+localStorage.getItem('go26best')||0,shake:0,stop:0,spawnT:0,paused:false};
const ui={score:$('#score'),combo:$('#combo'),hp:$('#hp'),time:$('#time'),menu:$('#menu'),over:$('#over'),pause:$('#pause'),set:$('#settings'),pop:$('#pops')};
function pop(txt,pos,c='#fff'){const v=pos.clone();v.y+=1;v.project(cam);const d=document.createElement('div');d.className='pop';d.textContent=txt;d.style.color=c;d.style.left=(v.x*.5+.5)*innerWidth+'px';d.style.top=(-v.y*.5+.5)*innerHeight+'px';ui.pop.appendChild(d);setTimeout(()=>d.remove(),700)}
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
function start(){AU.init();AU.resume();AU.play('ui');
 foes.splice(0).forEach(f=>scene.remove(f.m));sparks.splice(0).forEach(s=>scene.remove(s));
 Object.assign(G,{state:'play',t:0,score:0,combo:1,ctime:0,spawnT:0,paused:false});Object.assign(P,{hp:3,inv:1,dash:0,dcd:0});P.p.set(0,0,0);P.v.set(0,0,0);
 for(let i=0;i<8;i++)spawnSpark();ui.menu.hidden=ui.over.hidden=true;hud()}
function gameOver(){G.state='over';AU.play('over');if(G.score>G.best){G.best=G.score;localStorage.setItem('go26best',G.best)}
 $('#final').textContent=G.score;$('#bestv').textContent=G.best;setTimeout(()=>ui.over.hidden=false,500)}
function hud(){ui.score.textContent=G.score;ui.combo.textContent='x'+G.combo;ui.hp.textContent='♥'.repeat(Math.max(0,P.hp));ui.time.textContent=Math.floor(G.t)+'s'}
function hurt(){if(P.inv>0||P.dash>0)return;P.hp--;P.inv=1.2;G.combo=1;G.shake=0.6;G.stop=0.12;AU.play('hurt');burst(P.p.clone().setY(.6),0xffc94d,24,9);hud();bump(ui.hp);if(P.hp<=0)gameOver()}
// ---------- fixed-step physics ----------
const DT=1/60;
function collide(p,r){for(const s of solids){const cx=Math.max(s.x-s.hx,Math.min(p.x,s.x+s.hx)),cz=Math.max(s.z-s.hz,Math.min(p.z,s.z+s.hz));const dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);
 if(d<r){if(d>1e-4){p.x=cx+dx/d*r;p.z=cz+dz/d*r}else p.x+=r}}const L=Math.hypot(p.x,p.z),M=ARENA-r;if(L>M){p.x*=M/L;p.z*=M/L}}
function step(dt){G.t+=dt;P.inv-=dt;P.dcd-=dt;G.ctime-=dt;if(G.ctime<=0&&G.combo>1){G.combo=1;hud()}
 const [mx,mz]=moveVec();if(mx||mz)P.face=Math.atan2(mx,mz);
 if(IN.dash&&P.dcd<=0){P.dash=0.18;P.dcd=0.55;AU.play('dash');const f=(mx||mz)?[mx,mz]:[Math.sin(P.face),Math.cos(P.face)];P.v.set(f[0]*22,0,f[1]*22);G.shake=Math.max(G.shake,.15);burst(P.p.clone().setY(.4),0xffffff,8,3)}
 IN.dash=false;
 if(P.dash>0){P.dash-=dt}else{const acc=60,max=7.5;P.v.x+=(mx*max-P.v.x)*Math.min(1,acc*dt/max);P.v.z+=(mz*max-P.v.z)*Math.min(1,acc*dt/max)}
 P.p.addScaledVector(P.v,dt);collide(P.p,P.r);
 G.spawnT-=dt;if(G.spawnT<=0){spawnFoe();G.spawnT=Math.max(0.6,2.4-G.t*0.03)}
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];if(s.position.distanceTo(P.p.clone().setY(.6))<1){scene.remove(s);sparks.splice(i,1);G.score+=10*G.combo;G.combo=Math.min(G.combo+1,20);G.ctime=2;AU.play('pickup',1+G.combo*0.03);burst(s.position,0x5cf2ff,10,5);pop('+'+10*(G.combo-1),s.position,'#5cf2ff');spawnSpark();hud();bump(ui.combo)}}
 for(let i=foes.length-1;i>=0;i--){const f=foes[i],fp=f.m.position;const d=P.p.clone().sub(fp).setY(0);const L=d.length();
  f.v.lerp(d.normalize().multiplyScalar(f.spd),0.05);fp.addScaledVector(f.v,dt);fp.y=.55;collide(fp,.55);
  for(const o of foes)if(o!==f){const dd=fp.clone().sub(o.m.position).setY(0),l=dd.length();if(l<1.1&&l>0)fp.addScaledVector(dd,(1.1-l)/l*0.5)}
  if(L<1.15){if(P.dash>0){scene.remove(f.m);foes.splice(i,1);G.score+=25*G.combo;G.stop=0.06;G.shake=Math.max(G.shake,.3);AU.play('kill');burst(fp,0xff4d6d,22,8);pop('SMASH +'+25*G.combo,fp,'#ff4d6d');hud()}else hurt()}}
}
// ---------- loop ----------
let acc=0,last=performance.now(),fpsA=60,lowT=0;const camPos=new THREE.Vector3(0,14,12),look=new THREE.Vector3();
window.__go={fps:()=>fpsA,state:()=>G.state,G,P,IN,start,quality:()=>qi,foes:()=>foes.length,sparks:()=>sparks.length};
function frame(now){requestAnimationFrame(frame);let dt=Math.min((now-last)/1000,0.1);last=now;
 fpsA+=(1/Math.max(dt,1e-3)-fpsA)*0.05;
 if(SET.quality==='auto'&&!G.paused&&!document.hidden){if(fpsA<40&&qi>0){lowT+=dt;if(lowT>2){qi--;lowT=0;resize()}}else lowT=0}
 if(G.state==='play'&&!G.paused){if(G.stop>0){G.stop-=dt}else{acc+=dt;while(acc>=DT){step(DT);acc-=DT}}if(Math.floor(G.t)!=+ui.time.textContent.slice(0,-1))hud()}
 // visuals
 const tt=now/1000;pm.position.copy(P.p);pm.rotation.y+= (P.face-pm.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI>0?0.2:-0.2;pm.rotation.y=P.face;
 const sp=Math.hypot(P.v.x,P.v.z);body.scale.set(1+sp*.012,1-sp*.015+Math.sin(tt*12)*.02,1+sp*.012);pm.visible=!(P.inv>0&&Math.floor(tt*20)%2);
 sparks.forEach((s,i)=>{s.rotation.y=tt*2+i;s.position.y=.6+Math.sin(tt*3+i)*.15});foes.forEach(f=>{f.m.rotation.x+=f.v.z*dt;f.m.rotation.z-=f.v.x*dt});
 for(let i=0;i<PN;i++){const q=parts[i];if(q.life>0){q.life-=dt;q.v.y-=18*dt;q.p.addScaledVector(q.v,dt);if(q.p.y<0){q.p.y=0;q.v.y*=-.4}}const s=Math.max(q.life,0)*2;tmpM.makeScale(s,s,s).setPosition(q.p);pg.setMatrixAt(i,tmpM)}pg.instanceMatrix.needsUpdate=true;
 // camera
 const tgt=P.p.clone().add(new THREE.Vector3(P.v.x*.15,cam.aspect<1?17:13,cam.aspect<1?11:10));camPos.lerp(tgt,1-Math.exp(-6*dt));look.lerp(P.p,1-Math.exp(-10*dt));
 cam.position.copy(camPos);G.shake=Math.max(0,G.shake-dt*2);const s=G.shake*G.shake*0.8;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.lookAt(look);
 sun.position.copy(P.p).add(new THREE.Vector3(8,16,6));sun.target.position.copy(P.p);
 R.render(scene,cam)}
// ---------- pause / visibility / settings ----------
function togglePause(force){if(G.state!=='play')return;G.paused=force!==undefined?force:!G.paused;ui.pause.hidden=!G.paused;G.paused?AU.suspend():AU.resume();last=performance.now()}
document.addEventListener('visibilitychange',()=>{if(document.hidden){togglePause(true);AU.suspend()}});
addEventListener('blur',()=>togglePause(true));
$('#play').onclick=start;$('#again').onclick=start;$('#resume').onclick=()=>togglePause(false);$('#pbtn').onclick=e=>{e.stopPropagation();togglePause()};
document.querySelectorAll('.openset').forEach(b=>b.onclick=()=>{ui.set.hidden=false;AU.init()});$('#closeset').onclick=()=>{ui.set.hidden=true;AU.play('ui')};
const vol=$('#vol'),mus=$('#mus'),qs=$('#qual');vol.value=SET.vol;mus.value=SET.music;qs.value=SET.quality;
vol.oninput=()=>{SET.vol=+vol.value;AU.setVol();saveSet()};mus.oninput=()=>{SET.music=+mus.value;AU.setVol();saveSet()};
qs.onchange=()=>{SET.quality=qs.value;qi=qs.value==='auto'?qi:+qs.value;saveSet();resize()};
$('#bestm').textContent=G.best;
addEventListener('resize',resize);resize();hud();requestAnimationFrame(frame);
