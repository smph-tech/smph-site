import puppeteer from 'puppeteer-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = '/home/claude/r3d';
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json'};
const srv = http.createServer((req,res)=>{ const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p,(e,d)=>{ if(e){res.writeHead(404);res.end();return;} res.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'}); res.end(d);}); }).listen(8765);
const jobs = process.argv.slice(2).map(a=>{const [s,w,h]=a.split(':'); return {s,w:+(w||1000),h:+(h||1000)};});
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']});
for (const j of jobs){
  const pg = await b.newPage(); pg.on('console',m=>console.log('console:',m.text())); pg.on('pageerror',e=>console.log('err:',e.message));
  await pg.setViewport({width:j.w,height:j.h});
  await pg.goto(`http://localhost:8765/scene.html?s=${j.s}&w=${j.w}&h=${j.h}`);
  await pg.waitForFunction('window.__done===true',{timeout:90000});
  await pg.screenshot({path:`${root}/out/${j.s}.png`, omitBackground:true});
  console.log('rendered', j.s); await pg.close();
}
await b.close(); srv.close();
