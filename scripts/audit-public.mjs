import fs from 'node:fs/promises';import path from 'node:path';
const skip=new Set(['.git','node_modules','dist','.vercel','test-results']);
const problems=[],files=[];
async function walk(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){if(skip.has(ent.name))continue;const file=path.join(dir,ent.name);if(ent.isSymbolicLink())problems.push(`Unexpected symlink: ${file}`);else if(ent.isDirectory())await walk(file);else files.push(file);}}
await walk('.');
const rules=[['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['database connection',new RegExp('postgres(?:ql)?'+':\\/\\/[^\\s"\'<>]+')],['GitHub token',new RegExp('gh[pousr]'+'_[A-Za-z0-9]{30,}')],['service key',new RegExp('sk'+'-(?:live-|proj-)?[A-Za-z0-9_-]{32,}')],['personal machine path',new RegExp('/(?:Users|home)'+'/[A-Za-z][^\\s"\'<>]+')],['legacy platform content',new RegExp('uns'+'lop|design'+'-observed','i')]];
for(const file of files){if(/(^|\/)\.env(?!\.example$)|\.(?:tape|wav|mov|mp4|pem|key)$/.test(file))problems.push(`Private/runtime artifact: ${file}`);if(!/\.(?:m?js|css|md|json|ya?ml|html|txt|svg)$/.test(file))continue;const body=await fs.readFile(file,'utf8');for(const [name,re]of rules)if(re.test(body))problems.push(`${name}: ${file}`);}
for(const file of ['public/fonts/dmsans-OFL.txt','public/fonts/ibmplexmono-OFL.txt','public/fonts/barlowcondensed-OFL.txt','LICENSE','ASSETS.md'])try{await fs.access(file);}catch{problems.push(`Missing license: ${file}`);}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}else console.log(`Public audit passed for ${files.length} source/assets files. No matching credentials, private paths, recording artifacts or legacy platform content.`);
