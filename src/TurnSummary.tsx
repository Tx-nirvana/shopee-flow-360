import { clock, type Simulation, type Scenario, forecastRanges } from './shipping'
import { delayCause, turnReport } from './diagnostics'
export default function TurnSummary({sim,scenario}:{sim:Simulation;scenario:Scenario}){
 const report=turnReport(sim),projection=forecastRanges(sim,scenario);
 return <section className="panel turn-summary" aria-labelledby="turn-summary-title"><h2 id="turn-summary-title">Resumo do turno · {clock(sim.seconds)}</h2><p>{sim.departures} de 8 caminhões expedidos · {report.pending.toLocaleString('pt-BR')} volumes pendentes. Etapa com mais minutos associados aos atrasos: <b>{report.dominant??'nenhuma'}</b>.</p><p>As causas abaixo descrevem a etapa limitante observada a cada minuto após o corte. Podem coexistir várias causas; isso não prova causalidade exclusiva.</p>{report.delayed.length?<ul>{report.delayed.map(d=><li key={d.id}><strong>{d.route}</strong> — previsto {clock(d.planned)}; {d.departedAt===null?'pendente, projeção após turno '+clock(projection[d.id].likely):'saiu '+clock(d.departedAt)}.<br/>{delayCause(d)}</li>)}</ul>:<p>Sem saídas atrasadas.</p>}</section>
}
