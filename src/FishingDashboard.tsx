import { Component, lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Box, ChevronDown, Expand, LayoutGrid, Pause, Play, RotateCcw, ScanLine } from 'lucide-react';
import TestSite from './TestSite';
import { defaultFishingPoints, tablesFromLines, parseFishingPoints, POINTS_STORAGE_KEY, validateFishingPoints, type FishingPoint } from './fishingPoints';
import './fishing.css';
const FishingScene = lazy(() => import('./FishingScene'));
const pad = (id: number) => String(id).padStart(2, '0');
class SceneBoundary extends Component<{
    children: ReactNode;
    fallback: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Map2D({ points, selected, onSelect }: {
    points: FishingPoint[];
    selected: number;
    onSelect: (id: number) => void;
}) {
    return <div className="fish-map2d" aria-label="Mapa dos seis pontos de pesca">
        <div className="fish-belt-caption"><span>Entrada</span><span>Esteira principal <ArrowRight size={18}/></span><span>Continuidade</span></div>
        <div className="fish-belt-track"><span /><span /><span /><span /><span /><span /><ArrowRight /></div>
        <div className="fish-map-stations">{points.map(point => <button key={point.id} className={point.id === selected ? 'selected' : ''} aria-pressed={point.id === selected} onClick={() => onSelect(point.id)}>
            <span className="fish-map-connector"/><span className="fish-map-number">{pad(point.id)}</span><strong>Ponto de pesca</strong><span className="fish-mini-tables">{point.tables.map(table => <span key={table.id} title={table.destination}>M{table.id}</span>)}</span><small>{point.tables.length ? point.tables.length + ' mesas' : 'Mesas a informar'}</small>
        </button>)}</div>
    </div>;
}
function Destinations({ point }: {
    point: FishingPoint;
}) {
    return point.tables.length ? <ol className="fish-table-list">{point.tables.map(table => <li key={table.id}><span>Mesa {pad(table.id)}</span><strong>{table.destination}</strong></li>)}</ol> : <p className="fish-empty-destinations">Mesas e destinos ainda não informados.</p>;
}
export default function FishingDashboard() {
    const [initial] = useState(() => { try {
        return { points: parseFishingPoints(localStorage.getItem(POINTS_STORAGE_KEY)), note: '' };
    }
    catch {
        return { points: defaultFishingPoints(), note: 'O navegador não permitiu ler o mapeamento salvo.' };
    } });
    const [points, setPoints] = useState(initial.points), [selected, setSelected] = useState(1), [is3D, setIs3D] = useState(() => !matchMedia('(max-width: 760px)').matches), [animate, setAnimate] = useState(false), [top, setTop] = useState(false), [detail, setDetail] = useState(false), [sceneKey, setSceneKey] = useState(0), [editing, setEditing] = useState(false), [errors, setErrors] = useState<string[]>([]), [note, setNote] = useState(initial.note);
    const point = points.find(p => p.id === selected)!, configured = points.filter(p => p.tables.length).length, count = points.reduce((n, p) => n + p.tables.length, 0), destinationCount = new Set(points.flatMap(p => p.tables.map(t => t.destination))).size;
    function apply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const next = points.map(p => ({ id: p.id, tables: tablesFromLines(String(form.get('point-' + p.id) ?? '')) }));
        const invalid = validateFishingPoints(next);
        setErrors(invalid);
        if (invalid.length)
            return;
        setPoints(next);
        setEditing(false);
        try {
            localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify({ version: 2, points: next }));
            setNote('Mapeamento salvo neste navegador.');
        }
        catch {
            setNote('Mapeamento aplicado nesta aba. O navegador não permitiu salvar.');
        }
    }
    const map = <Map2D points={points} selected={selected} onSelect={setSelected}/>;
    return <div className="fishing-app">
        <a className="skip-link" href="#fishing-main">Pular para o conteúdo</a>
        <header className="fish-header"><a className="fish-brand" href="#fishing-main"><span><Box size={24}/></span><div>SHOPEE <b>FLOW 360</b><small>ESTEIRA & BALCÃO</small></div></a><span className="fish-demo"><i />Mapeamento informado · layout ilustrativo</span></header>
        <main id="fishing-main" className="fish-main" tabIndex={-1}>
            <section className="fish-heading"><div><span className="fish-eyebrow">OPERAÇÃO DE PESCA</span><h1>Esteira e balcão.</h1><p>Seis pontos de pesca. Mesas separadas e destinos identificados por ponto.</p></div><div className="fish-overview"><div><strong>06</strong><span>pontos de pesca</span></div><div><strong>{pad(count)}</strong><span>mesas informadas</span></div><div><strong>{pad(destinationCount)}</strong><span>destinos distintos</span></div></div></section>
            {note && <p className="fish-note" role="status">{note}</p>}
            <section className="fish-layout-panel" aria-labelledby="layout-title">
                <div className="fish-panel-heading"><div><span className="fish-eyebrow">VISÃO DO LAYOUT</span><h2 id="layout-title">Uma esteira. Seis áreas de trabalho.</h2><p>Selecione um ponto para consultar o balcão e seus destinos.</p></div><div className="fish-view-switch" role="group" aria-label="Visualização do layout"><button aria-pressed={is3D} onClick={() => setIs3D(true)} className={is3D ? 'active' : ''}><Box size={17}/>3D</button><button aria-pressed={!is3D} onClick={() => setIs3D(false)} className={!is3D ? 'active' : ''}><LayoutGrid size={17}/>Mapa 2D</button></div></div>
                <div className="fish-point-nav" aria-label="Selecionar ponto de pesca">{points.map(p => <button key={p.id} onClick={() => setSelected(p.id)} aria-pressed={p.id === selected} className={p.id === selected ? 'selected' : ''}><span>{pad(p.id)}</span>PESCA {pad(p.id)}<small>{p.tables.length ? p.tables.length + ' mesas' : 'A definir'}</small></button>)}</div>
                <div className={`fish-scene ${!is3D ? 'map-mode' : ''}`}>{is3D ? <SceneBoundary fallback={map}><Suspense fallback={<p className="fish-fallback">Preparando a visão 3D… O mapa 2D permanece disponível.</p>}><FishingScene key={sceneKey} points={points} selected={selected} onSelect={setSelected} animate={animate} top={top} detail={detail}/></Suspense></SceneBoundary> : map}</div>
                <div className="fish-scene-tools"><span><i />Posto selecionado: <b>Pesca {pad(selected)}</b></span>{is3D && <div><button className={animate ? 'active' : ''} aria-pressed={animate} onClick={() => setAnimate(a => !a)}>{animate ? <Pause size={16}/> : <Play size={16}/>}{animate ? 'Pausar esteira' : 'Animar esteira'}</button><button aria-pressed={detail && point.tables.length > 0} disabled={!point.tables.length} onClick={() => { setDetail(d => !d); setTop(false); }}>{detail && point.tables.length ? 'Voltar ao layout' : 'Detalhe da mesa'}</button><button aria-pressed={top} onClick={() => { setDetail(false); setTop(t => !t); }}><Expand size={16}/>{top ? 'Vista em perspectiva' : 'Vista superior'}</button><button aria-label="Restaurar câmera do layout" onClick={() => { setTop(false); setDetail(false); setSceneKey(k => k + 1); }}><RotateCcw size={16}/></button></div>}</div>
                <p className="fish-layout-note">Balcões compactos pretos com rodízios e pés reguláveis. Proporções ilustrativas; a animação da esteira não mede produção.</p>
            </section>
            <section className="fish-selected-panel" aria-labelledby="selected-title"><div className="fish-selected-identity"><span className="fish-big-number">{pad(selected)}</span><div><span className="fish-eyebrow">PONTO SELECIONADO</span><h2 id="selected-title">Pesca {pad(selected)}</h2><p>{point.tables.length ? `${point.tables.length} mesas · retirada e separação por destino` : 'Mesas ainda não informadas'}</p></div></div><div className="fish-selected-destinations"><h3>Mesas e destinos deste ponto</h3><Destinations point={point}/></div></section>
            <section className="fish-points-section" aria-labelledby="points-title"><div className="fish-section-heading"><div><span className="fish-eyebrow">DISTRIBUIÇÃO POR POSTO</span><h2 id="points-title">Os seis pontos de pesca</h2><p>{configured ? `${configured} de 6 pontos com destinos informados.` : 'Os destinos serão preenchidos conforme sua divisão, sem associações fictícias.'}</p></div><button className="fish-edit-button" aria-expanded={editing} aria-controls="fishing-mapping" onClick={() => { setEditing(e => !e); setErrors([]); }}><ScanLine size={18}/>{editing ? 'Fechar configuração' : 'Configurar destinos'}<ChevronDown size={16}/></button></div>
                {editing && <form id="fishing-mapping" className="fish-mapping" onSubmit={apply}><h3>Destinos por ponto de pesca</h3><p>Cada linha representa uma mesa, na ordem: mesa 1, mesa 2, mesa 3. Destinos podem se repetir em mesas e pontos diferentes. Deixe em branco os pontos ainda não definidos.</p><div className="fish-mapping-fields">{points.map(p => <label key={p.id}>Pesca {pad(p.id)}<textarea name={'point-' + p.id} rows={5} defaultValue={p.tables.map(t => t.destination).join('\n')} aria-label={`Destinos do ponto de pesca ${p.id}, uma mesa por linha`}/></label>)}</div>{!!errors.length && <ul className="fish-form-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}<button type="submit" className="fish-edit-button primary">Salvar divisão dos destinos</button></form>}
                <div className="fish-point-cards">{points.map(p => <article key={p.id} className={p.id === selected ? 'selected' : ''}><button className="fish-card-title" onClick={() => setSelected(p.id)} aria-pressed={p.id === selected}><span>{pad(p.id)}</span><div><strong>Pesca {pad(p.id)}</strong><small>{p.tables.length ? `${p.tables.length} mesas` : 'Mesas a informar'}</small></div><ArrowRight size={19}/></button><div className="fish-card-destinations"><span className="fish-card-label">MESAS E DESTINOS</span><Destinations point={p}/></div></article>)}</div>
            </section>
            <TestSite />
            <footer className="fish-footer"><span>SHOPEE FLOW 360 · ESTEIRA & BALCÃO</span><span>Layout demonstrativo · mapeamento editável</span></footer>
        </main>
    </div>;
}
