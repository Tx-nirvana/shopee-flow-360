import { addIncident, holdCounter, initialState, prioritize, tick, TURN_MINUTES, type Scenario, type Simulation } from './shipping'
import { cloneConfig, defaultConfig, type SimulationConfig } from './parameters'
export type Intervention={at:number;type:'priority'|'counter'|'dock';dockId?:number}
export type Session={version:1;config:SimulationConfig;scenario:Scenario;minute:number;actions:Intervention[];speed:number}
export function newSession(config=defaultConfig(),scenario:Scenario='base'):Session{return {version:1,config:cloneConfig(config),scenario,minute:0,actions:[],speed:1}}
function apply(s:Simulation,a:Intervention){return a.type==='priority'?prioritize(s,a.dockId!):a.type==='counter'?holdCounter(s):addIncident(s)}
export function replay(session:Session):Simulation{
 let s=initialState(session.config),index=0;
 for(let minute=0;minute<=session.minute;minute++){
  while(index<session.actions.length&&session.actions[index].at===minute)s=apply(s,session.actions[index++]);
  if(minute<session.minute)s=tick(s,session.scenario);
 }
 return s;
}
export function seek(session:Session,minute:number):Session{return {...session,minute:Math.max(0,Math.min(TURN_MINUTES,Math.floor(minute)))}}
export function recordAction(session:Session,type:Intervention['type'],dockId?:number):Session{
 const current=replay(session);if(session.minute>=TURN_MINUTES||current.departures===8)return session;
 const action:Intervention={at:session.minute,type,...(dockId===undefined?{}:{dockId})};if(apply(current,action)===current)return session;
 return {...session,actions:[...session.actions.filter(a=>a.at<=session.minute),action]};
}
