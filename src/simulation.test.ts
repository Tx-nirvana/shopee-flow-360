import { compareScenarios, comparisonCSV } from './comparison';
import { parseSession, loadSession, saveSession, STORAGE_KEY } from './persistence';
import { newSession, replay, recordAction, seek } from './timeline';
import { bottleneck, turnReport, delayCause } from './diagnostics';
import { defaultConfig, validateConfig } from './parameters';
import { defaultFishingPoints, emptyFishingPoints, parseFishingPoints, tablesFromLines, validateFishingPoints } from './fishingPoints';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addIncident, clock, forecast, forecastRanges, holdCounter, initialState, inTransit, prioritize, project, settings, shippingStatus, summary, tick, type Scenario } from './shipping';
test('conserva os 6.400 volumes em todas as etapas, sem duplicidade', () => {
    for (const scenario of Object.keys(settings) as Scenario[]) {
        let s = initialState();
        for (let i = 0; i < 600; i++) {
            s = tick(s, scenario);
            const totals = summary(s);
            assert.equal(totals.inbound + totals.pending + totals.transit + totals.staged + totals.loaded + s.shipped, 6400);
            assert.equal(s.docks.length, 8);
            assert.equal(s.shipped, s.departures * 800);
            s.docks.forEach(d => { assert.equal(d.inbound + d.pending + d.staged + inTransit(s, d.id) + d.loaded, 800); assert.ok(d.loaded >= 0 && d.loaded <= 800); assert.ok(d.inbound >= 0 && d.pending >= 0 && d.staged >= 0); assert.ok(Math.abs(d.progress - d.loaded / 8) < 1e-9); });
        }
        assert.equal(s.shipped, 6400);
        assert.equal(s.departures, 8);
        assert.ok(s.events.length <= 40);
        assert.equal(new Set(s.events.map(e => e.id)).size, s.events.length);
    }
});
test('balcão envia apenas volumes conferidos e doca recebe após quatro minutos', () => {
    let s = tick(initialState(), 'base');
    const t = s.transfers.find(t => t.dockId === 3)!;
    assert.equal(t.volumes, 36);
    assert.equal(t.arrives - t.started, 4);
    for (let i = 0; i < 3; i++)
        s = tick(s, 'base');
    assert.ok(s.transfers.some(x => x.id === t.id));
    assert.equal(s.docks[2].staged, 0);
    s = tick(s, 'base');
    assert.ok(!s.transfers.some(x => x.id === t.id));
    assert.ok(s.docks[2].staged > 0);
});
test('sem volumes separados ou em transferência, carregamento não avança', () => {
    const s = initialState();
    s.docks[0].staged = 0;
    s.counterUntil = 30;
    const next = tick(s, 'base');
    assert.equal(next.docks[0].loaded, s.docks[0].loaded);
    assert.equal(next.docks[0].status, 'Aguardando');
});
test('carga pronta aguarda o horário programado e sai uma única vez', () => {
    let s = initialState();
    s.docks[2].planned = 40;
    Object.assign(s.docks[2], { loaded: 800, inbound: 0, pending: 0, staged: 0, progress: 100, status: 'Pronta' });
    for (let i = 0; i < 39; i++)
        s = tick(s, 'base');
    assert.equal(s.docks[2].departedAt, null);
    assert.equal(s.docks[2].status, 'Pronta');
    s = tick(s, 'base');
    assert.equal(s.docks[2].departedAt, 40);
    assert.equal(s.shipped, 800);
    for (let i = 0; i < 3; i++)
        s = tick(s, 'base');
    assert.equal(s.shipped, 800);
    assert.equal(shippingStatus(s, s.docks[2], 'base'), 'Saiu no prazo');
});
test('retenção de doca impede saída até o fim, mesmo com carga completa', () => {
    let s = initialState();
    s.seconds = 79;
    s.docks[3].planned = 80;
    Object.assign(s.docks[3], { loaded: 800, inbound: 0, pending: 0, staged: 0, progress: 100, status: 'Pronta' });
    s = addIncident(s);
    for (let i = 0; i < 59; i++)
        s = tick(s, 'base');
    assert.equal(s.docks[3].departedAt, null);
    s = tick(s, 'base');
    assert.equal(s.docks[3].departedAt, 139);
    assert.equal(shippingStatus(s, s.docks[3], 'base'), 'Saiu atrasado');
});
test('retenção de balcão interrompe conferência, mas permite consumir estoque da doca', () => {
    let s = holdCounter(initialState());
    const start = summary(s).pending + summary(s).inbound, loaded = s.docks[0].loaded;
    for (let i = 0; i < 19; i++)
        s = tick(s, 'base');
    assert.equal(summary(s).pending + summary(s).inbound, start);
    assert.ok(s.docks[0].loaded > loaded);
    assert.equal(inTransit(s), 0);
    s = tick(s, 'base');
    assert.ok(summary(s).pending + summary(s).inbound < start);
});
test('prioridade altera a fila sem aumentar capacidade ou criar volumes', () => {
    const s = initialState(), next = tick(prioritize(s, 5), 'base'), normal = tick(s, 'base');
    assert.equal(next.docks[4].pending + next.docks[4].inbound, s.docks[4].pending + s.docks[4].inbound - 36);
    assert.equal(normal.docks[2].pending, s.docks[2].pending - 36);
    assert.equal(next.checked, normal.checked);
    assert.equal(next.priority, 5);
});
test('intervenções inválidas ou repetidas são ignoradas', () => {
    const s = initialState();
    assert.equal(prioritize(s, 99), s);
    const held = holdCounter(s);
    assert.equal(holdCounter(held), held);
    const retained = addIncident(s);
    assert.equal(addIncident(retained), retained);
});
test('operações preservam o estado anterior', () => {
    const s = initialState(), before = JSON.stringify(s);
    tick(s, 'optimized');
    holdCounter(s);
    prioritize(s, 5);
    addIncident(s);
    assert.equal(JSON.stringify(s), before);
});
test('cenários são reproduzíveis na janela de 12 horas', () => {
    assert.deepEqual(project('base'), project('base'));
    assert.ok(project('optimized').volumes >= project('base').volumes);
    assert.ok(project('optimized').onTime >= project('base').onTime);
    assert.ok(project('base').volumes >= project('peak').volumes);
    assert.ok(project('base').onTime >= project('peak').onTime);
});
test('corte perdido é registrado e a estimativa inclui retenções', () => {
    let s = initialState();
    s.seconds = 39;
    s.docks[2].planned = 40;
    s.counterUntil = 100;
    s.docks[2].staged = 0;
    s = tick(s, 'base');
    assert.equal(shippingStatus(s, s.docks[2], 'base'), 'Atrasada');
    assert.ok(s.events.some(e => e.title.includes('Corte de Curitiba')));
    assert.ok(forecast(s, s.docks[2], 'base') > 100);
});
test('relógio simulado parte das 08h e formata a virada do dia', () => { assert.equal(clock(0), '08:00'); assert.equal(clock(120), '10:00'); assert.equal(clock(960), '00:00'); });
test('esteira traseira abastece o balcão do destino correto, mesmo durante retenção', () => {
    const s = holdCounter(initialState()), next = tick(s, 'base');
    assert.equal(next.docks[6].inbound, s.docks[6].inbound - 8);
    assert.equal(next.docks[6].pending, s.docks[6].pending + 8);
    assert.equal(next.checked, 0);
    assert.equal(next.transfers.length, 0);
});
test('prioridade permanece ativa enquanto ainda há volumes do destino na esteira', () => {
    const s = initialState();
    s.docks[4].pending = 2;
    const next = tick(prioritize(s, 5), 'base');
    assert.equal(next.docks[4].pending, 0);
    assert.ok(next.docks[4].inbound > 0);
    assert.equal(next.priority, 5);
});
test("turno termina às 20h sem descartar volumes pendentes", () => { const s = initialState(); s.seconds = 720; assert.equal(tick(s, "base"), s); assert.equal(clock(s.seconds), "20:00"); });
test("cenários isolam a capacidade do balcão", () => { assert.equal(settings.base.rate, settings.optimized.rate); assert.equal(settings.base.rate, settings.peak.rate); const s = initialState(); const a = tick(s, "base"), b = tick(s, "optimized"); assert.equal(a.docks[0].loaded, b.docks[0].loaded); assert.equal(a.checked, 36); assert.equal(b.checked, 56); });
test("configuração valida limites e mantém total proporcional", () => { const c = defaultConfig(); c.capacities = [1, 200, 400, 600, 800, 1000, 1200, 1600]; c.checking = 80; c.transferMinutes = 7; c.dockRates.fill(12); assert.deepEqual(validateConfig(c), []); let s = initialState(c); for (let i = 0; i < 720; i++) {
    s = tick(s, "base");
    const t = summary(s);
    assert.equal(t.inbound + t.pending + t.transit + t.staged + t.loaded + s.shipped, c.capacities.reduce((a, b) => a + b, 0));
} assert.equal(s.departures, 8); c.capacities[0] = 0; assert.throws(() => initialState(c)); });
test("balcão e docas podem ser configurados de forma independente", () => { const c = defaultConfig(); c.checking = 12; c.dockRates.fill(2); c.transferMinutes = 9; const s = initialState(c), a = tick(s, "base"), b = tick(s, "optimized"); assert.equal(a.checked, 12); assert.equal(b.checked, 12); assert.equal(a.docks[0].loaded - s.docks[0].loaded, 2); assert.equal(a.transfers[0].arrives - a.transfers[0].started, 9); assert.equal(s.config.checking, 12); c.dockRates[0] = 100; assert.equal(s.config.dockRates[0], 2); });
test("previsão provável reproduz etapas paralelas e faixa é ordenada", () => { const c = defaultConfig(); c.planned = [100, 120, 40, 80, 150, 125, 90, 180]; let s = holdCounter(prioritize(initialState(c), 5)); s = addIncident(s); const before = JSON.stringify(s), range = forecastRanges(s, "base"); assert.equal(JSON.stringify(s), before); for (let i = 0; i < 1000 && s.departures < 8; i++)
    s = tick(s, "base", true); for (const d of s.docks) {
    assert.equal(range[d.id].likely, d.departedAt);
    assert.ok(range[d.id].optimistic <= range[d.id].likely);
    assert.ok(range[d.id].likely <= range[d.id].pessimistic);
} });
test("Campinas não recebe falso risco por somar etapas paralelas", () => { const c = defaultConfig(); c.planned = [100, 120, 40, 80, 150, 125, 90, 180]; const s = initialState(c); assert.equal(forecast(s, s.docks[1], "base"), 120); assert.equal(shippingStatus(s, s.docks[1], "base"), "No prazo"); });
test("diagnóstico diferencia retenções e registra evidências de atraso", () => { let s = initialState(); s.docks[3].planned = 1; s = addIncident(s); assert.equal(bottleneck(s, "base").stage, "doca"); s = tick(tick(s, "base"), "base"); assert.equal(s.docks[3].delay.doca, 1); assert.equal(turnReport(s).delayed.length, 1); const before = JSON.stringify(s); tick(s, "base"); assert.equal(JSON.stringify(s), before); assert.equal(bottleneck(holdCounter(initialState()), "base").stage, "balcão"); });
test("voltar e avançar reproduz estado e intervenções sem duplicidade", () => { let t = newSession(); t = recordAction(t, "priority", 5); t = seek(t, 15); t = recordAction(t, "counter"); t = recordAction(t, "dock"); t = seek(t, 90); const before = replay(t); assert.deepEqual(replay(seek(seek(t, 10), 90)), before); const branch = recordAction(seek(t, 5), "priority", 8); assert.ok(branch.actions.every(a => a.at <= 5)); assert.equal(replay(seek(branch, 90)).seconds, 90); assert.equal(seek(t, -9).minute, 0); assert.equal(seek(t, 900).minute, 720); });
test("persistência restaura configuração e replay integral das intervenções", () => { let session = newSession(); session = recordAction(session, "counter"); session = seek(session, 50); session = recordAction(session, "priority", 8); session = recordAction(session, "dock"); session = seek(session, 100); let value = ""; const storage = { getItem: () => value, setItem: (key: string, v: string) => { assert.equal(key, STORAGE_KEY); value = v; } }; assert.equal(saveSession(session, storage), ""); const restored = loadSession(storage); assert.deepEqual(replay(restored.session), replay(session)); assert.ok(restored.note.includes("restaurado")); });
test("persistência rejeita dados corrompidos e suporta armazenamento bloqueado", () => { assert.equal(parseSession("{"), null); assert.equal(parseSession(JSON.stringify({ ...newSession(), minute: Infinity })), null); assert.equal(parseSession(JSON.stringify({ ...newSession(), version: 2 })), null); assert.equal(parseSession(JSON.stringify({ ...newSession(), actions: [{ at: 0, type: "priority", dockId: 99 }] })), null); assert.equal(parseSession(JSON.stringify({ ...newSession(), config: {} })), null); assert.ok(saveSession(newSession(), null)); const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } }; assert.ok(loadSession(broken).note); assert.ok(saveSession(newSession(), broken)); });
test("comparação e CSV usam configuração idêntica e resultados reproduzíveis", () => { const c = defaultConfig(); c.checking = 23; c.capacities[0] = 900; const before = JSON.stringify(c), r = compareScenarios(c); assert.equal(r.length, 3); assert.equal(r[0].checking, 23); assert.deepEqual(r[0].volumes, r[1].volumes); const csv = comparisonCSV(c); assert.ok(csv.startsWith("\uFEFF")); assert.ok(csv.includes("DADOS FICTÍCIOS")); assert.ok(csv.includes("Sem intervenções manuais")); assert.equal(csv.split("\r\n").filter(Boolean).length, 5); assert.equal(JSON.stringify(c), before); });
test("resumo distingue retenção de doca de carregamento lento", () => { let s = initialState(); s.docks[3].planned = 1; s = addIncident(s); s = tick(tick(s, "base"), "base"); assert.equal(s.docks[3].delay.dockHold, 1); assert.ok(delayCause(s.docks[3]).includes("Retenção da doca: 1 min")); assert.ok(!delayCause(s.docks[3]).includes("Carregamento na doca")); });
test("conserva 6.400 volumes com intervenções combinadas durante todo o turno", () => { for (const scenario of Object.keys(settings) as Scenario[]) {
    let s = initialState();
    let seed = 12345;
    for (let minute = 0; minute < 720; minute++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        if (minute % 37 === 0)
            s = prioritize(s, seed % 8 + 1);
        if (minute % 83 === 0)
            s = holdCounter(s);
        if (minute % 101 === 0)
            s = addIncident(s);
        s = tick(s, scenario);
        const t = summary(s);
        assert.equal(t.inbound + t.pending + t.transit + t.staged + t.loaded + s.shipped, 6400);
        for (const d of s.docks)
            assert.equal(d.inbound + d.pending + d.staged + d.loaded + inTransit(s, d.id), 800);
    }
    assert.equal(s.departures, 8);
} });
test("corte às 20h e pendências preservam capacidade sem saída duplicada", () => { const c = defaultConfig(); c.capacities.fill(10000); c.dockRates.fill(1); c.planned.fill(720); let s = initialState(c); for (let i = 0; i < 720; i++)
    s = tick(s, "peak"); assert.equal(s.seconds, 720); assert.equal(s.departures, 0); assert.equal(turnReport(s).pending, 80000); assert.equal(tick(s, "peak"), s); });
test("prioridade não elimina retenção de balcão nem cria capacidade extra", () => { const s = holdCounter(prioritize(initialState(), 5)); let next = tick(s, "base"); assert.equal(next.checked, 0); assert.equal(next.priority, 5); for (let i = 1; i < 20; i++)
    next = tick(next, "base"); assert.equal(next.checked, 36); assert.equal(next.docks[4].pending + next.docks[4].inbound, s.docks[4].pending + s.docks[4].inbound - 36); });
test("capacidades mínimas mantêm estado inicial coerente", () => { const c = defaultConfig(); c.capacities.fill(1); const s = initialState(c); assert.equal(summary(s).planned, 8); assert.ok(s.docks.every(d => d.loaded === 0 && d.progress === 0 && d.status === "Aguardando")); });

test('pescas preservam seis pontos e nove mesas conforme divisão informada',()=>{const points=defaultFishingPoints();assert.equal(points.length,6);assert.equal(points.flatMap(p=>p.tables).length,9);assert.deepEqual(points[0].tables.map(t=>t.destination),['SOC_BETIM','SOC_CONTAGEM_INDUSTRIAL','SOC_BETIM']);assert.deepEqual(points[1].tables.map(t=>t.destination),Array(3).fill('SOC_SP_GUARULHOS'));assert.deepEqual(points[2].tables.map(t=>t.destination),Array(3).fill('SOC_BETIM'));assert.ok(points.slice(3).every(p=>p.tables.length===0));assert.deepEqual(validateFishingPoints(points),[])})
test('mesas distintas podem repetir destinos no mesmo ponto ou entre pontos',()=>{const points=defaultFishingPoints();assert.deepEqual(validateFishingPoints(points),[]);assert.equal(points[0].tables[0].destination,points[0].tables[2].destination);assert.equal(points[0].tables[0].destination,points[2].tables[0].destination)})
test('editor mantém ordem das mesas e não elimina destinos repetidos',()=>{assert.deepEqual(tablesFromLines('SOC_BETIM\nSOC_CONTAGEM_INDUSTRIAL\nSOC_BETIM').map(t=>[t.id,t.destination]),[[1,'SOC_BETIM'],[2,'SOC_CONTAGEM_INDUSTRIAL'],[3,'SOC_BETIM']]);assert.deepEqual(tablesFromLines('  '),[]);const points=emptyFishingPoints();points[0].tables=tablesFromLines('SOC_BETIM\n\nSOC_BETIM');assert.ok(validateFishingPoints(points).length)})
test('mapa salvo preserva mesas e recupera a configuração informada se inválido',()=>{const points=defaultFishingPoints();assert.deepEqual(parseFishingPoints(JSON.stringify({version:2,points})),points);assert.deepEqual(parseFishingPoints('{'),points);assert.deepEqual(parseFishingPoints(null),points);assert.deepEqual(parseFishingPoints(JSON.stringify({version:1,points})),points);const next=defaultFishingPoints();next[0].tables[0].destination='OUTRO';assert.equal(defaultFishingPoints()[0].tables[0].destination,'SOC_BETIM');assert.ok(validateFishingPoints(points.slice(0,3)).length)})


test('shelves do leve mantêm identificação e fileiras sem inferir destinos', () => {
    const points = defaultFishingPoints();
    assert.deepEqual(points.map(p => p.shelves.length), [3,3,3,2,3,37]);
    assert.equal(points.flatMap(p => p.shelves).length, 51);
    assert.deepEqual(points[0].shelves.map(s => s.name), ['MG4','MG2','BETIM-1']);
    assert.deepEqual(points[3].shelves.map(s => s.name), ['SP5 -2','RS-2']);
    assert.ok(points.flatMap(p => p.shelves).every(s => s.destination === null));
    assert.deepEqual([1,2,3,4,5,6].map(row => points[5].shelves.filter(s => s.row === row).length), [6,6,6,6,7,6]);
    assert.equal(new Set(points[5].shelves.map(s => s.id)).size, 37);
    assert.equal(points[5].shelves.find(s => s.name === 'MG5-119')?.row, 5);
});
test('migração v2 preserva referência das mesas sem associar destinos às shelves', () => {
    const legacy = defaultFishingPoints().map(({id,tables}) => ({id,tables}));
    legacy[0].tables[0].destination = 'REFERENCIA_SALVA';
    const next = parseFishingPoints(JSON.stringify({version:2,points:legacy}));
    assert.equal(next[0].tables[0].destination, 'REFERENCIA_SALVA');
    assert.equal(next.flatMap(p => p.shelves).length,51);
    assert.ok(next.flatMap(p => p.shelves).every(s => s.destination === null));
});
test('destino por shelf persiste independentemente do nome e das mesas', () => {
    const points = defaultFishingPoints();
    points[0].shelves[0].destination = 'SOC_BETIM';
    points[5].shelves.find(s => s.name === 'MG5-119')!.destination = 'HUB_TESTE';
    const restored = parseFishingPoints(JSON.stringify({version:3,points}));
    assert.deepEqual(restored, points);
    assert.equal(restored[0].shelves[0].name, 'MG4');
    assert.equal(restored[0].shelves[1].destination, null);
    assert.equal(restored[0].tables[0].destination, 'SOC_BETIM');
    restored[0].shelves[0].name = 'SOC_BETIM';
    assert.ok(validateFishingPoints(restored).length);
    assert.deepEqual(parseFishingPoints(JSON.stringify({version:3,points:restored})), defaultFishingPoints());
});
