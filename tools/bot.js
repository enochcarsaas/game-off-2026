// node tools/bot.js  -> headless checks: errors, fps, keyboard+touch, desktop+iPhone
const { chromium } = require('/usr/local/lib/pnpm/5/.pnpm/playwright-core@1.59.1/node_modules/playwright-core');
const url='file://'+require('path').resolve(__dirname,'../dist/index.html');let fail=0;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for(const [name,vp,mob] of [['desktop',{width:1280,height:800},false],['iphone',{width:390,height:844},true]]){
 const ctx=await b.newContext({viewport:vp,hasTouch:mob,isMobile:mob,deviceScaleFactor:mob?3:1});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/audio\/|ERR_FILE_NOT_FOUND/.test(m.text())&&errs.push(m.text()));
 await p.goto(url);await p.waitForTimeout(500);
 if(mob)await p.tap('#play');else await p.click('#play');await p.waitForTimeout(300);
 const st=await p.evaluate(()=>__go.state());
 // keyboard
 const k0=await p.evaluate(()=>__go.P.p.x);await p.keyboard.down('KeyD');await p.waitForTimeout(600);await p.keyboard.up('KeyD');
 const k1=await p.evaluate(()=>__go.P.p.x);await p.keyboard.press('Space');await p.waitForTimeout(100);const kd=await p.evaluate(()=>__go.P.dcd>0);
 // touch stick via CDP
 const cdp=await ctx.newCDPSession(p);const z0=await p.evaluate(()=>__go.P.p.z);
 const T=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
 await T('touchStart',100,500);for(let i=1;i<=5;i++){await T('touchMove',100,500-i*12);await p.waitForTimeout(40)}await p.waitForTimeout(500);await T('touchEnd');
 const z1=await p.evaluate(()=>__go.P.p.z);await p.waitForTimeout(600);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:vp.width-60,y:500,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.waitForTimeout(60);const td=await p.evaluate(()=>__go.P.dcd>0);
 // fps over 3s
 const fps=await p.evaluate(()=>new Promise(r=>{let n=0,t0=performance.now();(function f(){n++;performance.now()-t0<3000?requestAnimationFrame(f):r(n/3)})()}));
 // pause on visibility
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
 const paused=await p.evaluate(()=>__go.G.paused);
 const r={state:st,keyMove:+(k1-k0).toFixed(2),keyDash:kd,touchMove:+(z1-z0).toFixed(2),touchDash:td,fps:+fps.toFixed(1),quality:await p.evaluate(()=>__go.quality()),paused,errors:errs};
 const ok=st==='play'&&r.keyMove>1&&kd&&r.touchMove<-1&&td&&paused&&!errs.length&&fps>=25;if(!ok)fail=1;
 console.log(name,ok?'PASS':'FAIL',JSON.stringify(r));
 await p.screenshot({path:'tools/shot-'+name+'.png'});await ctx.close()}
await b.close();process.exit(fail)})();
