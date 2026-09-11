import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export function calculate(input){
 const rows=[];
 for(const quantity of input.quantities)for(const scenario of ['low','base','high']){
  const factor=input.quantityFactors[quantity];
  const components=input.components.reduce((n,c)=>n+c[scenario]*(c.scalable===false?1:factor),0);
  const labor=input.factoryLabor[scenario]*factor;
  const factory=(components+labor)/(1-input.scrapRate[scenario]);
  const landed=factory*(1+input.dutyReserve[scenario])+input.inboundFreight[scenario];
  const nre=input.nre.reduce((n,c)=>n+(scenario==='base'?(c.base??c.hours*c.hourlyRate):c[scenario]),0);
  const production=landed*quantity,operations=input.launchOperations[scenario];
  const contingency=(production+nre+operations)*input.contingency;
  const cashRequired=production+nre+operations+contingency;
  const grossRequired=cashRequired/(1-input.fees-input.supportReserve);
  const grossAtPrice=quantity*input.price;
  rows.push({quantity,scenario,components,labor,factory,landed,nre,production,operations,contingency,cashRequired,grossRequired,minimumPrice:grossRequired/quantity,roundedFundingGoal:Math.ceil(grossRequired/50000)*50000,grossAtPrice,netAtPrice:grossAtPrice*(1-input.fees-input.supportReserve),surplusAtPrice:grossAtPrice*(1-input.fees-input.supportReserve)-cashRequired,unitContributionBeforeNre:input.price*(1-input.fees-input.supportReserve)-landed});
 }
 const frames=4*2*48000*300,loopBytes=frames*4;
 const memory={loopBytes,undoBytes:loopBytes,osBytes:512*1024**2,workspaceBytes:128*1024**2,totalBytes:loopBytes*2+640*1024**2,capacityBytes:2*1024**3};memory.headroomBytes=memory.capacityBytes-memory.totalBytes;
 const inertia=.5*.18*.1**2,omega=30*2*Math.PI/60;
 return {asOf:input.asOf,currency:input.currency,price:input.price,rows,memory,mechanics:{discMassKg:.18,radiusMeters:.1,inertiaKgM2:inertia,maxRpm:30,spinupSeconds:.5,idealAccelerationTorqueNm:inertia*omega/.5,oneNewtonHandTorqueNm:.1},caution:input.status};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const input=JSON.parse(await fs.readFile(new URL('../docs/hardware/cost-inputs.json',import.meta.url),'utf8')),out=calculate(input);
 const dir=new URL('../docs/hardware/',import.meta.url);
 await fs.writeFile(new URL('cost-results.json',dir),JSON.stringify(out,null,2)+'\n');
 const keys=Object.keys(out.rows[0]);await fs.writeFile(new URL('cost-results.csv',dir),keys.join(',')+'\n'+out.rows.map(r=>keys.map(k=>typeof r[k]==='number'?r[k].toFixed(2):r[k]).join(',')).join('\n')+'\n');
 console.table(out.rows.map(r=>({units:r.quantity,case:r.scenario,landed:Math.round(r.landed),NRE:r.nre,minPrice:Math.ceil(r.minimumPrice),grossGoal:r.roundedFundingGoal,surplusAtPrice:Math.round(r.surplusAtPrice)})));
}
