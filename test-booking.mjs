import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ais-test-'));await fs.copyFile('.local/auth.json',path.join(dir,'auth.json'));
let child,cookie='',csrf='';const base='http://127.0.0.1:3344/Icecream/api/';
async function start(){child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3344',DATA_DIR:dir},stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('Server stopped')));});}
async function call(route,method='GET',body,auth=false){const r=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie,'X-CSRF-Token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};}
try{
 await start();assert.equal((await call('admin/bookings')).status,401);assert.equal((await call('login','POST',{password:'wrong'})).status,401);
 const password=process.env.TEST_ADMIN_PASSWORD;if(!password)throw Error('Set TEST_ADMIN_PASSWORD');const login=await call('login','POST',{password});assert.equal(login.status,200);cookie=login.cookie.split(';')[0];csrf=login.data.csrf;
 const date=new Date(Date.now()+10*86400000).toISOString().slice(0,10);assert.equal((await call('admin/availability','PUT',{date,status:'unavailable'},true)).status,200);
 const booking={date,name:'Test customer',phone:'0123456789',guests:100,occasion:'Wedding',location:'Test venue'};
 assert.equal((await call('bookings','POST',booking)).status,409);assert.equal((await call('admin/availability','PUT',{date,status:'available'},true)).status,200);
 assert.equal((await call('bookings','POST',{...booking,date:'2020-01-01'})).status,400);
 const a=await call('bookings','POST',booking),b=await call('bookings','POST',{...booking,phone:'0198765432'});assert.equal(a.status,201);assert.equal(b.status,201);
 const results=await Promise.all([a,b].map(x=>call('admin/bookings/'+x.data.id,'PATCH',{status:'confirmed'},true)));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const publicData=await call('availability');assert.equal(publicData.data.dates[date],'booked');assert.ok(!JSON.stringify(publicData).includes('Test customer'));
 const saved=csrf;csrf='wrong';assert.equal((await call('admin/availability','PUT',{date,status:'available'},true)).status,403);csrf=saved;
 child.kill();await new Promise(r=>child.once('exit',r));await start();assert.equal((await call('availability')).data.dates[date],'booked');assert.equal((await call('session','GET',null,true)).status,401);
 assert.equal((await fetch('http://127.0.0.1:3344/Icecream/admin/')).status,200);console.log('PASS: authentication, CSRF, unavailable dates, validation, booking conflict, privacy, persistence and admin route');
}finally{child?.kill();await new Promise(r=>setTimeout(r,200));await fs.rm(dir,{recursive:true,force:true});}
