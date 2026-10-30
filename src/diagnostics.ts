import { inTransit, settings, summary, type Simulation, type Scenario, type Stage, type Dock } from './shipping'
export function bottleneck(s:Simulation,scenario:Scenario):{stage:Stage|null;detail:string}{
 const t=summary(s);if(s.departures===s.docks.length)return {stage:null,detail:'Todas as cargas foram expedidas.'};
 if(s.incidentUntil>s.seconds)return {stage:'doca',detail:'Doca 04 retida até o fim da intervenção.'};
 if(s.counterUntil>s.seconds&&t.inbound+t.pending>0)return {stage:'balcão',detail:'Conferência suspensa; a esteira continua abastecendo.'};
 const pressure:[Stage,number][]=[['esteira',Math.max(...s.docks.map(d=>d.inbound/8))],['balcão',t.pending/(s.config.checking??settings[scenario].checking)],['rua',inTransit(s)>0?Math.max(0,...s.transfers.map(t=>t.arrives-s.seconds)):0],['doca',Math.max(...s.docks.filter(d=>d.departedAt===null).map(d=>d.staged/s.config.dockRates[d.id-1]),0)]];
 const [stage,minutes]=pressure.sort((a,b)=>b[1]-a[1])[0];return minutes>0?{stage,detail:'Maior pressão estimada: '+stage+' ('+Math.ceil(minutes)+' min para escoar o estoque atual).'}:{stage:null,detail:'Sem fila ativa. Caminhões completos aguardam os horários.'};
}
export function delayCause(d:Dock):string{
 const entries=Object.entries(d.delay).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 return entries.length?entries.map(([stage,n])=>stage+': '+n+' min').join(' · '):'Sem espera após o horário previsto.';
}
export function turnReport(s:Simulation){
 const delayed=s.docks.filter(d=>d.departedAt!==null?d.departedAt>d.planned:s.seconds>=d.planned);
 const totals:Record<Stage,number>={esteira:0,'balcão':0,rua:0,doca:0};for(const d of s.docks)for(const stage of Object.keys(totals) as Stage[])totals[stage]+=d.delay[stage];
 const dominant=Object.entries(totals).sort((a,b)=>b[1]-a[1])[0];return {delayed,dominant:dominant[1]>0?dominant[0]:null,pending:summary(s).planned-s.shipped};
}
