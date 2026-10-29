import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialState, tick, project, addIncident } from './simulation'
test('mantém oito docas, progresso válido e contagem consistente em 600 minutos',()=>{let s=initialState();for(let i=0;i<600;i++){s=tick(s,'base');assert.equal(s.docks.length,8);s.docks.forEach(d=>{assert.ok(d.progress>=0&&d.progress<=100);assert.ok(d.loaded>=0&&d.loaded<=d.capacity)})}assert.equal(s.shipped-12840,(s.departures-24)*800);assert.ok(s.events.length<=20)})
test('retenção pausa a doca 04 e retoma ao término',()=>{let s=addIncident(initialState());const progress=s.docks[3].progress;for(let i=0;i<59;i++)s=tick(s,'base');assert.equal(s.docks[3].progress,progress);s=tick(s,'base');assert.ok(s.docks[3].progress>progress);assert.equal(s.docks[3].status,'Carregando')})
test('projeções são reproduzíveis e otimização aumenta expedição',()=>{assert.deepEqual(project('base'),project('base'));assert.ok(project('optimized').volumes>project('base').volumes);assert.ok(project('base').volumes>=project('peak').volumes)})
test('estado anterior permanece intacto ao avançar',()=>{const s=initialState();const before=JSON.stringify(s);tick(s,'optimized');addIncident(s);assert.equal(JSON.stringify(s),before)})
