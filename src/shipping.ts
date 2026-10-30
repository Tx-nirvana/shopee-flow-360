import { defaultConfig, cloneConfig, validateConfig, type SimulationConfig } from './parameters'
export type Status = 'Carregando' | 'Aguardando' | 'Liberada' | 'Atrasada' | 'Pronta'
export type Scenario = 'base' | 'optimized' | 'peak'
export type Stage = 'esteira' | 'balcão' | 'rua' | 'doca'
export type DelayEvidence=Record<Stage,number>
export type Dock = { delay:DelayEvidence; id:number; route:string; truck:string; progress:number; status:Status; loaded:number; capacity:number; inbound:number; pending:number; staged:number; planned:number; departedAt:number|null }
export type Transfer = { id:number; dockId:number; volumes:number; started:number; arrives:number }
export type SimEvent = { id:number; time:number; title:string; detail:string; kind:'success'|'warning'|'info' }
export type Simulation = { config:SimulationConfig; seconds:number; docks:Dock[]; shipped:number; departures:number; events:SimEvent[]; incidentUntil:number; counterUntil:number; transfers:Transfer[]; checked:number; priority:number|null; nextId:number }
export const routes=['São Paulo · SP','Campinas · SP','Curitiba · PR','Rio de Janeiro · RJ','Belo Horizonte · MG','Sorocaba · SP','Ribeirão Preto · SP','Santos · SP']
export const settings={base:{label:'Operação atual',rate:0.65,checking:36},optimized:{label:'Fluxo otimizado',rate:0.65,checking:56},peak:{label:'Balcão sobrecarregado',rate:0.65,checking:18}}
export const TURN_MINUTES=720
export const clock=(minutes:number)=>!Number.isFinite(minutes)?'Sem conclusão':`${String((8+Math.floor(minutes/60))%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`
export function initialState(config:SimulationConfig=defaultConfig()):Simulation{
 const errors=validateConfig(config);if(errors.length)throw new Error(errors.join(" "));
 const loads=[544,336,728,184,0,448,120,0],staged=[160,240,12,200,80,160,120,80];
 return {config:cloneConfig(config),seconds:0,shipped:0,departures:0,incidentUntil:0,counterUntil:0,checked:0,priority:null,nextId:1,transfers:[],events:[{id:0,time:0,title:'Shipping Diário iniciado',detail:'Esteira → balcão → ruas (stage out) → caminhões → expedidos · volumes fictícios',kind:'info'}],docks:routes.map((route,i)=>({delay:{esteira:0,'balcão':0,rua:0,doca:0},id:i+1,route,truck:`SHP-${2401+i*17}`,progress:Math.floor(loads[i]*config.capacities[i]/800)/config.capacities[i]*100,status:loads[i]?'Carregando':'Aguardando',loaded:Math.floor(loads[i]*config.capacities[i]/800),capacity:config.capacities[i],inbound:Math.max(0,config.capacities[i]-Math.floor(loads[i]*config.capacities[i]/800)-Math.floor(staged[i]*config.capacities[i]/800)-Math.floor(80*config.capacities[i]/800)),pending:Math.min(Math.floor(80*config.capacities[i]/800),config.capacities[i]-Math.floor(loads[i]*config.capacities[i]/800)-Math.floor(staged[i]*config.capacities[i]/800)),staged:Math.floor(staged[i]*config.capacities[i]/800),planned:config.planned[i],departedAt:null}))}
}
function event(s:Simulation,title:string,detail:string,kind:SimEvent['kind']='info'){s.events=[{id:s.nextId++,time:s.seconds,title,detail,kind},...s.events].slice(0,40)}
function copy(s:Simulation):Simulation{return {...s,docks:s.docks.map(d=>({...d,delay:{...d.delay}})),transfers:s.transfers.map(t=>({...t})),events:[...s.events]}}
export function prioritize(s:Simulation,dockId:number):Simulation{const d=s.docks.find(d=>d.id===dockId);if(!d||d.departedAt!==null||d.pending+d.inbound===0||s.priority===dockId)return s;const next=copy(s);next.priority=dockId;event(next,`Balcão prioriza rua ${String(dockId).padStart(2,'0')}`,`${d.route} · conferência antecipada dentro da capacidade do balcão`);return next}
export function addIncident(s:Simulation):Simulation{if(s.incidentUntil>s.seconds||s.docks[3].departedAt!==null)return s;const next=copy(s);next.incidentUntil=s.seconds+60;next.docks[3].status='Atrasada';event(next,'Retenção na doca 04','Carregamento suspenso por 60 min simulados','warning');return next}
export function holdCounter(s:Simulation):Simulation{if(s.counterUntil>s.seconds||s.docks.every(d=>d.pending+d.inbound===0))return s;const next=copy(s);next.counterUntil=s.seconds+20;event(next,'Balcão em conferência adicional','Novos volumes retidos por 20 min; cargas nas ruas continuam para os caminhões','warning');return next}
export function inTransit(s:Simulation,id?:number){return s.transfers.filter(t=>id===undefined||t.dockId===id).reduce((n,t)=>n+t.volumes,0)}
export function summary(s:Simulation){return {planned:s.docks.reduce((n,d)=>n+d.capacity,0),inbound:s.docks.reduce((n,d)=>n+d.inbound,0),pending:s.docks.reduce((n,d)=>n+d.pending,0),transit:inTransit(s),staged:s.docks.reduce((n,d)=>n+d.staged,0),loaded:s.docks.filter(d=>d.departedAt===null).reduce((n,d)=>n+d.loaded,0),onTime:s.docks.filter(d=>d.departedAt!==null&&d.departedAt<=d.planned).length}}
export type ForecastRange={optimistic:number;likely:number;pessimistic:number}
const forecastCache=new WeakMap<Simulation,Partial<Record<Scenario,Record<number,ForecastRange>>>>()
// Conditional projections: current priority and active holds remain; no new interventions.
export function forecastRanges(s:Simulation,scenario:Scenario):Record<number,ForecastRange>{
 const cached=forecastCache.get(s)?.[scenario];if(cached)return cached;
 const results:Record<number,ForecastRange>={};for(const d of s.docks)results[d.id]={optimistic:Infinity,likely:Infinity,pessimistic:Infinity};
 for(const [key,factor] of [['optimistic',1.2],['likely',1],['pessimistic',0.8]] as const){
  let projected=copy(s);projected.config=cloneConfig(s.config);
  projected.config.checking=Math.max(1,Math.floor((s.config.checking??settings[scenario].checking)*factor));
  projected.config.dockRates=s.config.dockRates.map(v=>Math.max(1,Math.floor(v*factor)));
  const limit=Math.max(s.seconds,...s.docks.map(d=>d.planned))+10080;
  while(projected.departures<projected.docks.length&&projected.seconds<limit)projected=tick(projected,scenario,true);
  for(const d of projected.docks)results[d.id][key]=d.departedAt??Infinity;
 }
 forecastCache.set(s,{...forecastCache.get(s),[scenario]:results});return results;
}
export function forecast(s:Simulation,d:Dock,scenario:Scenario):number{return forecastRanges(s,scenario)[d.id].likely}
export function shippingStatus(s:Simulation,d:Dock,scenario:Scenario){if(d.departedAt!==null)return d.departedAt>d.planned?'Saiu atrasado':'Saiu no prazo';if(s.seconds>=d.planned)return 'Atrasada';if(d.loaded===d.capacity)return 'Pronta';return forecast(s,d,scenario)>d.planned?'Em risco':'No prazo'}
export function tick(s:Simulation,scenario:Scenario,afterTurn=false):Simulation{
 if(s.seconds>=TURN_MINUTES&&!afterTurn)return s;
 const next=copy(s);next.seconds++;const now=next.seconds;
 for(const t of next.transfers.filter(t=>t.arrives<=now)){next.docks[t.dockId-1].staged+=t.volumes}
 next.transfers=next.transfers.filter(t=>t.arrives>now);
 // The rear conveyor supplies each counter position before checking starts.
 for(const d of next.docks){const received=Math.min(8,d.inbound);d.inbound-=received;d.pending+=received}
 let budget=now<next.counterUntil?0:(next.config.checking??settings[scenario].checking);
 const ordered=[...next.docks].sort((a,b)=>Number(b.id===next.priority)-Number(a.id===next.priority)||a.planned-b.planned);
 for(const d of ordered){const count=Math.min(budget,d.pending);if(count<=0)continue;d.pending-=count;budget-=count;next.checked+=count;next.transfers.push({id:next.nextId++,dockId:d.id,volumes:count,started:now,arrives:now+next.config.transferMinutes});if(d.pending+d.inbound===0){event(next,`Balcão concluiu ${d.route.split(' · ')[0]}`,`Rua ${String(d.id).padStart(2,'0')} · últimos volumes a caminho do stage out`,'success');if(next.priority===d.id)next.priority=null}}
 for(const d of next.docks){
  if(d.departedAt!==null)continue;
  if(now>d.planned){const stage:Stage=d.id===4&&now<next.incidentUntil?'doca':now<next.counterUntil&&d.pending+d.inbound>0?'balcão':d.staged>0?'doca':d.pending>0?'balcão':d.inbound>0?'esteira':'rua';d.delay[stage]++;}
  if(d.id===4&&now<next.incidentUntil){d.status='Atrasada'}else{
   const amount=Math.min(d.staged,d.capacity-d.loaded,Math.max(1,s.config.dockRates[d.id-1]));
   d.staged-=amount;d.loaded+=amount;d.progress=d.loaded/d.capacity*100;
   d.status=d.loaded===d.capacity?'Pronta':amount>0?'Carregando':'Aguardando';
   if(d.loaded===d.capacity&&now>=d.planned){d.status='Liberada';d.departedAt=now;next.shipped+=d.capacity;next.departures++;event(next,`Doca ${String(d.id).padStart(2,'0')} · caminhão expedido`,`${d.route} · ${d.capacity} volumes · ${now>d.planned?'saída atrasada':'saída no prazo'}`,now>d.planned?'warning':'success')}
  }
  if(now===d.planned&&d.departedAt===null)event(next,`Corte de ${d.route.split(' · ')[0]} não atendido`,`${d.capacity-d.loaded} volumes pendentes de carga; ${d.pending} ainda no balcão`,'warning');
 }
 return next;
}
export function project(scenario:Scenario,minutes=TURN_MINUTES,config:SimulationConfig=defaultConfig()){let s=initialState(config);for(let i=0;i<minutes;i++)s=tick(s,scenario);return {volumes:s.shipped,departures:s.departures,onTime:summary(s).onTime,pending:summary(s).pending}}
