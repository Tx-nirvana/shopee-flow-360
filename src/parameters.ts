export type SimulationConfig = {
  checking: number | null
  transferMinutes: number
  dockRates: number[]
  capacities: number[]
  planned: number[]
}
export function defaultConfig(): SimulationConfig {
  return { checking: null, transferMinutes: 4,
    dockRates: Array.from({length:8},(_,i)=>Math.floor(0.65*8*(0.86+(i+1)*0.035))),
    capacities: Array(8).fill(800), planned:[460,480,400,440,510,485,450,540] }
}
export function validateConfig(c: SimulationConfig): string[] {
  const errors: string[] = []
  const integer=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max
  if(!c||typeof c!=='object')return ['Configuração inválida.']
  if(c.checking!==null&&!integer(c.checking,1,10000))errors.push('Balcão: informe 1 a 10.000 volumes/minuto.')
  if(!integer(c.transferMinutes,1,60))errors.push('Transferência: informe 1 a 60 minutos.')
  for(const [key,min,max,label] of [['dockRates',1,2000,'Velocidades'],['capacities',1,100000,'Capacidades'],['planned',0,720,'Horários']] as const){
    if(!Array.isArray(c[key])||c[key].length!==8||c[key].some(v=>!integer(v,min,max)))errors.push(label+': são necessários oito valores válidos.')
  }
  return errors
}
export function cloneConfig(c: SimulationConfig): SimulationConfig {return {...c,dockRates:[...c.dockRates],capacities:[...c.capacities],planned:[...c.planned]}}
