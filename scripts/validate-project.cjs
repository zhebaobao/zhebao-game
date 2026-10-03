const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const context=vm.createContext({window:{},console});
const run=relative=>new vm.Script(read(relative),{filename:relative}).runInContext(context);

run('js/config/module-manifest.js');
const manifest=context.window.ZHEBAO_MODULE_MANIFEST;
const entries=[...manifest.plants,...manifest.levels,...manifest.zombies];
const runtime=manifest.runtime;
const paths=[...entries.map(entry=>entry.src),...runtime,'./js/config/module-manifest.js','./js/bootstrap.js']
  .map(src=>src.replace(/^\.\//,''));
const uniquePaths=new Set(paths);
if(uniquePaths.size!==paths.length)throw new Error('Module manifest contains duplicate paths');

for(const relative of uniquePaths){
  if(!fs.existsSync(path.join(root,relative)))throw new Error('Missing module: '+relative);
  const checked=spawnSync(process.execPath,['--check',path.join(root,relative)],{encoding:'utf8'});
  if(checked.status!==0)throw new Error(checked.stderr||('Syntax check failed: '+relative));
}

for(const entry of entries)run(entry.src.replace(/^\.\//,''));
run('js/config/game-config.js');
const config=context.window.ZHEBAO_CONFIG;
const assertIds=(label,expected,actual)=>{
  const missing=expected.filter(id=>!Object.prototype.hasOwnProperty.call(actual,id));
  if(missing.length)throw new Error(label+' registry missing: '+missing.join(', '));
};
assertIds('Plant',manifest.plants.map(entry=>entry.id),config.PLANT_ARCHETYPES);
assertIds('Level',manifest.levels.map(entry=>entry.id),config.LEVELS);
assertIds('Zombie',manifest.zombies.map(entry=>entry.id),config.ZOMBIE_ARCHETYPES);
if(JSON.stringify(config.LEVEL_IDS)!==JSON.stringify(manifest.levels.map(entry=>entry.id))){
  throw new Error('LEVEL_IDS order differs from the manifest');
}

const html=read('index.html');
for(const required of ['./js/config/module-manifest.js','./js/bootstrap.js']){
  if(!html.includes('src="'+required+'?v='))throw new Error('index.html does not load a versioned '+required);
}
if(/src="\.\/(plants|levels|zombies)\//.test(html)){
  throw new Error('index.html contains registry scripts outside the manifest');
}
console.log('Project validation passed: '+manifest.levels.length+' levels, '+manifest.plants.length+' plants, '+manifest.zombies.length+' zombies.');
