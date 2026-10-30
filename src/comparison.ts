import { project, settings, type Scenario } from './shipping';
import type { SimulationConfig } from './parameters';
export function compareScenarios(config: SimulationConfig) { return (Object.keys(settings) as Scenario[]).map(key => ({ key, label: settings[key].label, checking: config.checking ?? settings[key].checking, ...project(key, 720, config) })); }
export function comparisonCSV(config: SimulationConfig): string {
    const rows: unknown[][] = [['SIMULAÇÃO ILUSTRATIVA — DADOS FICTÍCIOS — 08h às 20h'], ['Cenário', 'Balcão (vol/min)', 'Transferência (min)', 'Velocidades por doca (vol/min)', 'Volumes por caminhão', 'Saídas (min após 08h)', 'Volumes expedidos', 'Caminhões expedidos', 'Saídas no prazo', 'Volumes pendentes', 'Minutos de atraso acumulados', 'Intervenções']];
    for (const r of compareScenarios(config))
        rows.push([r.label, r.checking, config.transferMinutes, config.dockRates.join(' / '), config.capacities.join(' / '), config.planned.join(' / '), r.volumes, r.departures, r.onTime, r.pending, r.lateMinutes, 'Sem intervenções manuais']);
    const cell = (value: unknown) => { let text = String(value); if (/^[=+@-]/.test(text))
        text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
    return '﻿' + rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
}
export function downloadComparison(config: SimulationConfig) { const url = URL.createObjectURL(new Blob([comparisonCSV(config)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'shopee-flow-360-comparacao-ilustrativa.csv'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
