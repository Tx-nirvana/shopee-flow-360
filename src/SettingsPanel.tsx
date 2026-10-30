import { useState, type FormEvent } from 'react';
import { defaultConfig, validateConfig, type SimulationConfig } from './parameters';
import { clock, routes } from './shipping';
export default function SettingsPanel({ config, onApply }: {
    config: SimulationConfig;
    onApply: (c: SimulationConfig) => void;
}) {
    const [automatic, setAutomatic] = useState(config.checking === null), [errors, setErrors] = useState<string[]>([]);
    function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const data = new FormData(e.currentTarget); const values = (key: string) => Array.from({ length: 8 }, (_, i) => Number(data.get(key + i))); const planned = Array.from({ length: 8 }, (_, i) => { const [h, m] = String(data.get('planned' + i)).split(':').map(Number); return h * 60 + m - 480; }); const c: SimulationConfig = { checking: automatic ? null : Number(data.get('checking')), transferMinutes: Number(data.get('transfer')), dockRates: values('rate'), capacities: values('capacity'), planned }; const invalid = validateConfig(c); setErrors(invalid); if (!invalid.length)
        onApply(c); }
    return <section className="panel settings-panel"><h2>Parâmetros do turno ilustrativo</h2><p>Aplicar reinicia às 08h e limpa o histórico anterior. Os valores são fictícios. As velocidades das docas são independentes do cenário do balcão.</p><form onSubmit={submit}>
 <div className="settings-fields"><label><input type="checkbox" checked={automatic} onChange={e => setAutomatic(e.target.checked)}/> Usar capacidade do cenário (36 / 56 / 18)</label><label>Capacidade personalizada do balcão (vol/min)<input name="checking" type="number" min="1" max="10000" step="1" defaultValue={config.checking ?? 36} disabled={automatic} required={!automatic}/></label><label>Transferência (minutos)<input name="transfer" type="number" min="1" max="60" step="1" defaultValue={config.transferMinutes} required/></label></div>
 <div className="settings-docks">{routes.map((route, i) => <fieldset key={route}><legend>Doca {i + 1} · {route}</legend><label>Volumes por caminhão<input name={'capacity' + i} type="number" min="1" max="100000" step="1" defaultValue={config.capacities[i]} required/></label><label>Carregamento (vol/min)<input name={'rate' + i} type="number" min="1" max="2000" step="1" defaultValue={config.dockRates[i]} required/></label><label>Saída prevista<input name={'planned' + i} type="time" min="08:00" max="20:00" defaultValue={clock(config.planned[i])} required/></label></fieldset>)}</div>
 {!!errors.length && <div role="alert">{errors.map(e => <p key={e}>{e}</p>)}</div>}<div className="settings-actions"><button className="primary" type="submit">Aplicar parâmetros e reiniciar</button><button type="button" className="secondary" onClick={() => onApply(defaultConfig())}>Restaurar parâmetros padrão</button></div></form></section>;
}
