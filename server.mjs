import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
const root=path.resolve('dist'), dataDir=path.resolve(process.env.DATA_DIR||'.local');
await fs.mkdir(dataDir,{recursive:true,mode:0o700});
const auth=JSON.parse(await fs.readFile(path.join(dataDir,'auth.json'),'utf8'));
let state;try{state=JSON.parse(await fs.readFile(path.join(dataDir,'bookings.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state={dates:{},bookings:[]};}
const sessions=new Map(),attempts=new Map();let queue=Promise.resolve();
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d&&d>=today()&&Date.parse(d)<=Date.now()+366*86400000;
const status=d=>state.bookings.some(b=>b.date===d&&b.status==='confirmed')?'booked':state.dates[d]||'available';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
async function mutate(fn){const task=queue.then(async()=>{const previous=structuredClone(state);try{const result=fn();await fs.writeFile(path.join(dataDir,'bookings.tmp'),JSON.stringify(state),{mode:0o600});await fs.rename(path.join(dataDir,'bookings.tmp'),path.join(dataDir,'bookings.json'));return result;}catch(e){state=previous;throw e;}});queue=task.catch(()=>{});return task;}
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
 try{
  const url=new URL(req.url,'http://localhost');let route=decodeURIComponent(url.pathname).replace(/^\/Icecream(?=\/|$)/,'')||'/';
  if(!route.startsWith('/api/')){if(route==='/admin'){res.writeHead(302,{Location:'admin/'});return res.end();}const file=path.resolve(root,'.'+route+(route.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))fail(403,'Forbidden');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});return res.end(body);}
  const ip=req.socket.remoteAddress;const secure=process.env.SECURE_COOKIE==='1';
  let body={};if(!['GET','HEAD'].includes(req.method)){if(req.headers.origin){const expected=(secure?'https':'http')+'://'+req.headers.host;if(req.headers.origin!==expected)fail(403,'Invalid origin');}let raw='';for await(const part of req){raw+=part;if(Buffer.byteLength(raw)>16384)fail(413,'Request too large');}try{body=JSON.parse(raw||'{}');}catch{fail(400,'Invalid JSON');}}
  const token=(req.headers.cookie||'').match(/(?:^|; )ais_session=([^;]+)/)?.[1];const session=sessions.get(token);const signedIn=session&&session.expires>Date.now();
  if(route==='/api/login'&&req.method==='POST'){
   for(const [key,value] of attempts)if(value.until<Date.now())attempts.delete(key);
   const key=req.headers['x-real-ip']||ip;const attempt=attempts.get(key)||{count:0,until:Date.now()+900000};if(attempt.count>=8)fail(429,'Too many attempts. Try again in 15 minutes.');attempt.count++;attempts.set(key,attempt);
   const hash=scryptSync(String(body.password||'').slice(0,200),auth.salt,64);if(!timingSafeEqual(hash,Buffer.from(auth.hash,'hex')))fail(401,'Incorrect password');attempts.delete(key);
   for(const [key,value] of sessions)if(value.expires<Date.now())sessions.delete(key);
   const id=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');sessions.set(id,{csrf,expires:Date.now()+43200000});res.setHeader('Set-Cookie',`ais_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure?'; Secure':''}`);return send(200,{csrf});
  }
  if(route==='/api/availability'&&req.method==='GET'){const dates={...state.dates};state.bookings.filter(b=>b.status==='confirmed').forEach(b=>dates[b.date]='booked');return send(200,{today:today(),dates});}
  if(route==='/api/bookings'&&req.method==='POST'){
   const text=(key,max)=>typeof body[key]==='string'?body[key].trim().slice(0,max):'';
   const booking={id:randomBytes(8).toString('hex'),date:body.date,name:text('name',100),phone:text('phone',50),occasion:text('occasion',80),location:text('location',180),guests:Number(body.guests),status:'pending',created:new Date().toISOString()};
   if(!validDate(booking.date)||!booking.name||!/[0-9]{5}/.test(booking.phone.replace(/[\s()+-]/g,''))||!booking.location||!booking.occasion||!Number.isInteger(booking.guests)||booking.guests<1||booking.guests>100000)fail(400,'Please complete all event details and choose a valid date.');
   await mutate(()=>{if(status(booking.date)!=='available')fail(409,'This date is no longer available. Please choose another.');if(state.bookings.some(b=>b.phone===booking.phone&&b.date===booking.date&&b.status==='pending'))fail(409,'You already have a pending request for this date.');if(state.bookings.filter(b=>b.created>new Date(Date.now()-60000).toISOString()).length>=20)fail(429,'Please try again in a minute.');state.bookings.push(booking);});return send(201,{id:booking.id});
  }
  if(!signedIn)fail(401,'Please sign in.');
  if(req.method!=='GET'&&req.headers['x-csrf-token']!==session.csrf)fail(403,'Please refresh and try again.');
  if(route==='/api/session'&&req.method==='GET')return send(200,{csrf:session.csrf});
  if(route==='/api/logout'&&req.method==='POST'){sessions.delete(token);res.setHeader('Set-Cookie','ais_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+(secure?'; Secure':''));return send(200,{ok:true});}
  if(route==='/api/admin/bookings'&&req.method==='GET')return send(200,{bookings:state.bookings.slice().reverse()});
  if(route==='/api/admin/availability'&&req.method==='PUT'){if(!validDate(body.date)||!['available','unavailable','booked'].includes(body.status))fail(400,'Choose a valid future date and status.');await mutate(()=>{if(state.bookings.some(b=>b.date===body.date&&b.status==='confirmed'))fail(409,'Cancel the confirmed booking before changing this date.');if(body.status==='available')delete state.dates[body.date];else state.dates[body.date]=body.status;});return send(200,{ok:true});}
  if(route.startsWith('/api/admin/bookings/')&&req.method==='PATCH'){await mutate(()=>{const booking=state.bookings.find(b=>b.id===route.split('/').pop());if(!booking)fail(404,'Request not found');if(!['confirmed','declined','cancelled'].includes(body.status))fail(400,'Invalid status');if(body.status==='confirmed'&&(booking.status!=='pending'||!validDate(booking.date)||status(booking.date)!=='available'))fail(409,'Date unavailable or request already processed.');booking.status=body.status;});return send(200,{ok:true});}
  fail(404,'Not found');
 }catch(e){send(typeof e.code==='number'?e.code:e.code==='ENOENT'?404:500,{error:typeof e.code==='number'?e.message:e.code==='ENOENT'?'Not found':'Unable to complete request. Please try again.'});}
}).listen(Number(process.env.PORT||3333),'127.0.0.1',()=>console.log('Aiscreme ready'));
