import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('PWAのアイコンと配信ファイルが存在する',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){
   const bytes=await readFile(new URL('../'+icon.src,import.meta.url));
   assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
   const size=Number(icon.sizes.split('x')[0]);
   assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
 }
});
test('初回保存後はオフラインで画面とゲームを取得でき、更新は明示操作で適用する',async()=>{
 const handlers={},stored=new Map(),deleted=[];let pending,claimed=false,skipped=false;
 const self={location:{href:'https://game.example/CardGame/sw.js'},clients:{claim:async()=>{claimed=true;}},skipWaiting:()=>{skipped=true;},addEventListener:(type,fn)=>{handlers[type]=fn;}};
 const caches={open:async()=>({addAll:async paths=>{for(const request of paths){assert.equal(request.cache,'reload');const path=request.url;const file=new URL(path).pathname.replace('/CardGame/','');stored.set(path,await readFile(new URL('../'+(file||'index.html'),import.meta.url),'utf8'));}}}),keys:async()=>['torupass-/CardGame/-v1','torupass-/CardGame/-v5','torupass-/OtherGame/-v1','other-app'],delete:async key=>{deleted.push(key);},match:async req=>stored.get(typeof req==='string'?req:req.url)};
 const context=vm.createContext({self,caches,URL,Request,fetch:async()=>{throw new Error('offline');}});
 vm.runInContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
 handlers.install({waitUntil:p=>pending=p});await pending;
 assert.equal(skipped,false);
 handlers.activate({waitUntil:p=>pending=p});await pending;
 assert.deepEqual(deleted,['torupass-/CardGame/-v1']);assert.equal(claimed,true);
 for(const [path,mode,expected] of [['/','navigate','<html'],['/game.js','cors','createGame'],['/app.js?v=5','cors','human']]){
   handlers.fetch({request:{method:'GET',url:'https://game.example/CardGame'+path,mode},respondWith:p=>pending=p});
   assert.ok((await pending).includes(expected));
 }
 handlers.message({data:{type:'ACTIVATE_UPDATE'}});assert.equal(skipped,true);
});
