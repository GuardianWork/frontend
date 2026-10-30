// Runs the unmodified taste inspector with local-mock session setup only.
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import {createMockApiServer} from '../scripts/mock-api.mjs';
const [url, role, out] = process.argv.slice(2);
const parsed = new URL(url);
if (parsed.hostname !== 'localhost' || !['5137','5138','5157','5158','5167','5168'].includes(parsed.port)) throw new Error('Local audit origins only');
const mock=createMockApiServer();
const requestHandler=mock.listeners('request')[0];mock.removeAllListeners('request');
mock.on('request',(req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,Accept');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}requestHandler(req,res);});
await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
const mockOrigin=`http://127.0.0.1:${mock.address().port}`;
const username = role === 'staff' ? 'admin_demo' : role === 'owner' ? 'owner_demo' : 'candidate_demo';
const response = await fetch(`${mockOrigin}/api/auth/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usernameOrEmail:username,password:'Guardian123!'})});
const {data} = await response.json();
if (!data?.accessToken) throw new Error('Mock sign-in unavailable');
const setup = `sessionStorage.setItem('guardianwork_auth_session', ${JSON.stringify(JSON.stringify({...data,expiresAt:Date.now()+800000}))});
const nativeFetch=window.fetch;
window.fetch=(input,init)=>{
 const target=new URL(typeof input==='string'?input:input.url,location.href);
 ${role==='owner' ? `if(target.pathname.includes('/companies/me/verification')||target.pathname.endsWith('/companies/101'))return Promise.resolve(new Response(JSON.stringify({status:200,data:{id:101,name:'Alpha',taxCode:'0101234567',verificationStatus:'VERIFIED',version:1}}),{headers:{'Content-Type':'application/json'}}));` : ''}
 if(target.pathname.includes('/api/'))return nativeFetch(${JSON.stringify(mockOrigin)}+target.pathname+target.search,init);
 return nativeFetch(input,init);
};`;

let source=await fs.readFile('/home/vy/.agents/skills/design-taste-frontend/scripts/inspect.mjs','utf8');
source=source.replaceAll("from './lib/", "from '/home/vy/.agents/skills/design-taste-frontend/scripts/lib/");
source=source.replace("const how = await page.goto(url,",`await page.send('Page.addScriptToEvaluateOnNewDocument', {source:${JSON.stringify(setup)}});\n    const how = await page.goto(url,`);
// The temporary inspector contains local mock tokens; it lives outside review artifacts.
const target=`/tmp/guardian-inspector-${process.pid}.mjs`;
await fs.writeFile(target,source,{mode:0o600});
const child=spawn(process.execPath,[target,url,'--app','--out',out],{stdio:'inherit'});
const code=await new Promise(resolve=>child.on('exit',resolve));await fs.unlink(target);mock.close();process.exitCode=code??1;
