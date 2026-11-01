import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':['index.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript'],'/game.js':['game.js','text/javascript'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json']};
for (const name of ['sw.js','pwa.js']) files['/'+name]=[name,'text/javascript'];
for (const size of [180,192,512]) files[`/icons/icon-${size}.png`]=[`icons/icon-${size}.png`,'image/png'];
http.createServer(async(req,res)=>{const item=files[new URL(req.url,'http://localhost').pathname];if(!item){res.writeHead(404);res.end('Not found');return;}try{res.setHeader('Content-Type',item[1]);res.setHeader('Cache-Control','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(new URL(item[0],import.meta.url)));}catch{res.writeHead(500);res.end('Server error');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0');
