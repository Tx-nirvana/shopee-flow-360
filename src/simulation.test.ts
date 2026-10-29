import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addIncident, clock, forecast, holdCounter, initialState, inTransit, prioritize, project, settings, shippingStatus, summary, tick, type Scenario } from './shipping'

test('conserva os 6.400 volumes em todas as etapas, sem duplicidade',()=>{
 for(const scenario of Object.keys(settings) as Scenario[]){let s=initialState();for(let i=0;i<600;i++){
  s=tick(s,scenario);const totals=summary(s);
  assert.equal(totals.inbound+totals.pending+totals.transit+totals.staged+totals.loaded+s.shipped,6400);
  assert.equal(s.docks.length,8);assert.equal(s.shipped,s.departures*800);
  s.docks.forEach(d=>{assert.equal(d.inbound+d.pending+d.staged+inTransit(s,d.id)+d.loaded,800);assert.ok(d.loaded>=0&&d.loaded<=800);assert.ok(d.inbound>=0&&d.pending>=0&&d.staged>=0);assert.ok(Math.abs(d.progress-d.loaded/8)<1e-9)});
 }assert.equal(s.shipped,6400);assert.equal(s.departures,8);assert.ok(s.events.length<=40);assert.equal(new Set(s.events.map(e=>e.id)).size,s.events.length)}
})
test('balcão envia apenas volumes conferidos e doca recebe após quatro minutos',()=>{
 let s=tick(initialState(),'base');const t=s.transfers.find(t=>t.dockId===3)!;assert.equal(t.volumes,36);assert.equal(t.arrives-t.started,4);
 for(let i=0;i<3;i++)s=tick(s,'base');assert.ok(s.transfers.some(x=>x.id===t.id));assert.equal(s.docks[2].staged,0);
 s=tick(s,'base');assert.ok(!s.transfers.some(x=>x.id===t.id));assert.ok(s.docks[2].staged>0);
})
test('sem volumes separados ou em transferência, carregamento não avança',()=>{
 const s=initialState();s.docks[0].staged=0;s.counterUntil=30;const next=tick(s,'base');assert.equal(next.docks[0].loaded,s.docks[0].loaded);assert.equal(next.docks[0].status,'Aguardando');
})
test('carga pronta aguarda o horário programado e sai uma única vez',()=>{
 let s=initialState();Object.assign(s.docks[2],{loaded:800,inbound:0,pending:0,staged:0,progress:100,status:'Pronta'});
 for(let i=0;i<39;i++)s=tick(s,'base');assert.equal(s.docks[2].departedAt,null);assert.equal(s.docks[2].status,'Pronta');
 s=tick(s,'base');assert.equal(s.docks[2].departedAt,40);assert.equal(s.shipped,800);
 for(let i=0;i<3;i++)s=tick(s,'base');assert.equal(s.shipped,800);assert.equal(shippingStatus(s,s.docks[2],'base'),'Saiu no prazo');
})
test('retenção de doca impede saída até o fim, mesmo com carga completa',()=>{
 let s=initialState();s.seconds=79;Object.assign(s.docks[3],{loaded:800,inbound:0,pending:0,staged:0,progress:100,status:'Pronta'});s=addIncident(s);
 for(let i=0;i<59;i++)s=tick(s,'base');assert.equal(s.docks[3].departedAt,null);s=tick(s,'base');assert.equal(s.docks[3].departedAt,139);assert.equal(shippingStatus(s,s.docks[3],'base'),'Saiu atrasado');
})
test('retenção de balcão interrompe conferência, mas permite consumir estoque da doca',()=>{
 let s=holdCounter(initialState());const start=summary(s).pending+summary(s).inbound,loaded=s.docks[0].loaded;
 for(let i=0;i<19;i++)s=tick(s,'base');assert.equal(summary(s).pending+summary(s).inbound,start);assert.ok(s.docks[0].loaded>loaded);assert.equal(inTransit(s),0);
 s=tick(s,'base');assert.ok(summary(s).pending+summary(s).inbound<start);
})
test('prioridade altera a fila sem aumentar capacidade ou criar volumes',()=>{
 const s=initialState(),next=tick(prioritize(s,5),'base'),normal=tick(s,'base');assert.equal(next.docks[4].pending+next.docks[4].inbound,s.docks[4].pending+s.docks[4].inbound-36);assert.equal(normal.docks[2].pending,s.docks[2].pending-36);assert.equal(next.checked,normal.checked);assert.equal(next.priority,5);
})
test('intervenções inválidas ou repetidas são ignoradas',()=>{
 const s=initialState();assert.equal(prioritize(s,99),s);const held=holdCounter(s);assert.equal(holdCounter(held),held);const retained=addIncident(s);assert.equal(addIncident(retained),retained);
})
test('operações preservam o estado anterior',()=>{
 const s=initialState(),before=JSON.stringify(s);tick(s,'optimized');holdCounter(s);prioritize(s,5);addIncident(s);assert.equal(JSON.stringify(s),before);
})
test('cenários são reproduzíveis e a otimização melhora pontualidade',()=>{
 assert.deepEqual(project('base'),project('base'));assert.ok(project('optimized').volumes>project('base').volumes);assert.ok(project('optimized').onTime>project('base').onTime);assert.ok(project('base').volumes>=project('peak').volumes);assert.ok(project('base').onTime>project('peak').onTime);
})
test('corte perdido é registrado e a estimativa inclui retenções',()=>{
 let s=initialState();s.seconds=39;s.counterUntil=100;s.docks[2].staged=0;s=tick(s,'base');assert.equal(shippingStatus(s,s.docks[2],'base'),'Atrasada');assert.ok(s.events.some(e=>e.title.includes('Corte de Curitiba')));assert.ok(forecast(s,s.docks[2],'base')>100);
})
test('relógio simulado parte das 14h e formata a virada do dia',()=>{assert.equal(clock(0),'14:00');assert.equal(clock(120),'16:00');assert.equal(clock(600),'00:00')})

test('esteira traseira abastece o balcão do destino correto, mesmo durante retenção',()=>{
 const s=holdCounter(initialState()),next=tick(s,'base');
 assert.equal(next.docks[6].inbound,s.docks[6].inbound-8);
 assert.equal(next.docks[6].pending,s.docks[6].pending+8);
 assert.equal(next.checked,0);assert.equal(next.transfers.length,0);
})

test('prioridade permanece ativa enquanto ainda há volumes do destino na esteira',()=>{
 const s=initialState();s.docks[4].pending=2;
 const next=tick(prioritize(s,5),'base');assert.equal(next.docks[4].pending,0);assert.ok(next.docks[4].inbound>0);assert.equal(next.priority,5);
})

