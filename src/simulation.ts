export type Status = 'Carregando' | 'Aguardando' | 'Liberada' | 'Atrasada'
export type Dock = { id: number; route: string; truck: string; progress: number; status: Status; loaded: number; capacity: number }
export type Scenario = 'base' | 'optimized' | 'peak'
export type SimEvent = { id: number; time: number; title: string; detail: string; kind: 'success' | 'warning' | 'info' }
export type Simulation = { seconds: number; docks: Dock[]; shipped: number; departures: number; events: SimEvent[]; incidentUntil: number }
export const routes = ['São Paulo · SP', 'Campinas · SP', 'Curitiba · PR', 'Rio de Janeiro · RJ', 'Belo Horizonte · MG', 'Sorocaba · SP', 'Ribeirão Preto · SP', 'Santos · SP']
export function initialState(): Simulation { return { seconds: 0, shipped: 12840, departures: 24, incidentUntil: 0, events: [{ id: 0, time: 0, title: 'Turno em operação', detail: 'Oito docas sincronizadas · cenário demonstrativo', kind: 'info' }], docks: routes.map((route,i) => ({id:i+1, route, truck:`SHP-${2401+i*17}`, progress:[68,42,91,23,0,56,15,0][i], status: i===4?'Aguardando':i===7?'Liberada':'Carregando', loaded:Math.round([68,42,91,23,0,56,15,0][i]*8), capacity:800})) } }
export const settings = { base:{label:'Operação atual', rate:0.65, arrival:14}, optimized:{label:'Fluxo otimizado',rate:0.94,arrival:9}, peak:{label:'Pico de demanda',rate:0.55,arrival:6} }
export function addIncident(s: Simulation): Simulation { if(s.incidentUntil>s.seconds)return s; return {...s,incidentUntil:s.seconds+60,docks:s.docks.map(d=>d.id===4?{...d,status:'Atrasada'}:d),events:[{id:s.seconds+100000,time:s.seconds,title:'Retenção na doca 04',detail:'Conferência adicional · impacto de 60 min simulados',kind:'warning' as const},...s.events].slice(0,20)} }
export function tick(s: Simulation, scenario: Scenario): Simulation {
 const seconds=s.seconds+1; let shipped=s.shipped; let departures=s.departures; let events=[...s.events];
 const docks=s.docks.map(d=>{ let next={...d};
  if(d.id===4 && s.incidentUntil>seconds)return {...d,status:'Atrasada' as Status};
  if(d.status==='Liberada'){ if(seconds%settings[scenario].arrival===d.id%settings[scenario].arrival){next.status='Aguardando';next.progress=0;next.loaded=0} return next }
  if(d.status==='Aguardando'){next.status='Carregando';return next}
  next.status='Carregando';next.progress=Math.min(100,d.progress+settings[scenario].rate*(0.86+d.id*0.035));next.loaded=Math.floor(next.progress/100*d.capacity);
  if(next.progress>=100){next.status='Liberada';shipped+=next.capacity;departures++;events.unshift({id:seconds*10+d.id,time:seconds,title:`Doca ${String(d.id).padStart(2,'0')} · carga expedida`,detail:`${d.route} · ${next.capacity} volumes liberados`,kind:'success'})}
  return next;
 });return {...s,seconds,docks,shipped,departures,events:events.slice(0,20)};
}
export function project(scenario: Scenario, minutes=120){let state=initialState();for(let i=0;i<minutes;i++)state=tick(state,scenario);return {volumes:state.shipped-12840,departures:state.departures-24,occupancy:Math.round(state.docks.filter(d=>d.status!=='Liberada').length/8*100)} }

