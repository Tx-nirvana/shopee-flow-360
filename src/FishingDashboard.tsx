import { Component, lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Box, ChevronDown, Expand, LayoutGrid, Pause, Play, RotateCcw, ScanLine } from 'lucide-react';
import TestSite from './TestSite';
import { defaultFishingPoints, parseFishingPoints, POINTS_STORAGE_KEY, validateFishingPoints, type FishingPoint } from './fishingPoints';
import './fishing.css';
import { equipmentLabel, leveTablePositions, leveSackPositions } from './leveLayout';
const FishingScene = lazy(() => import('./FishingScene'));
const pad = (id: number) => String(id).padStart(2, '0');
const blockName = (id: number) => id === 6 ? 'Ilha 6 · MG5' : 'Ilha ' + id;
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function ShelfList({ point }: { point: FishingPoint }) {
    const rows = [...new Set(point.shelves.map(s => s.row))];
    return <div className={'fish-shelf-groups' + (point.id === 6 ? ' mg5' : '')}>{rows.map(row => <div key={row}>{point.id === 6 && <h4>Fileira {row}</h4>}<ul className="fish-shelf-list">{point.shelves.filter(s => s.row === row).map(s => <li key={s.id}><strong>{s.name}</strong><span className={s.destination ? 'assigned' : 'pending'}>{s.destination || 'A confirmar'}</span></li>)}</ul></div>)}</div>;
}
function Map2D({ points, selected, onSelect }: { points: FishingPoint[]; selected: number; onSelect: (id: number) => void }) {
    return <div className="fish-map2d" aria-label="Mapa do leve com seis ilhas">
        <div className="fish-belt-caption"><span>Entrada</span><span>Esteira do leve <ArrowRight size={18}/></span><span>Continuidade</span></div>
        <div className="fish-belt-track"><span/><span/><span/><span/><span/><span/><ArrowRight/></div>
        <div className="fish-map-stations">{points.map(point => <button key={point.id} className={point.id === selected ? 'selected' : ''} aria-pressed={point.id === selected} onClick={() => onSelect(point.id)}>
            <span className="fish-map-connector"/><span className="fish-map-number">{pad(point.id)}</span><strong>{blockName(point.id)}</strong><span className="fish-mini-shelves">{point.shelves.map(s => <span key={s.id} title={s.name + ': ' + (s.destination || 'A confirmar')}>{s.name}</span>)}</span><small>{point.shelves.length} {equipmentLabel(point.id)}</small>
        </button>)}</div>
    </div>;
}
function TableReference({ point }: { point: FishingPoint }) {
    return <div className="fish-reference"><h3>Referência anterior de destinos</h3>{point.tables.length ? <><p>Divisão informada para este ponto. Ainda não associada às posições identificadas.</p><ol>{point.tables.map(t => <li key={t.id}>Mesa {pad(t.id)} <strong>{t.destination}</strong></li>)}</ol></> : <p>Os destinos desta ilha ainda serão confirmados.</p>}</div>;
}
export default function FishingDashboard() {
    const [initial] = useState(() => { try { return { points: parseFishingPoints(localStorage.getItem(POINTS_STORAGE_KEY)), note: '' }; } catch { return { points: defaultFishingPoints(), note: 'O navegador não permitiu ler o mapeamento salvo.' }; } });
    const [points, setPoints] = useState(initial.points), [selected, setSelected] = useState(1), [is3D, setIs3D] = useState(() => !matchMedia('(max-width: 760px)').matches), [animate, setAnimate] = useState(false), [top, setTop] = useState(true), [detail, setDetail] = useState(false), [sceneKey, setSceneKey] = useState(0), [editing, setEditing] = useState(false), [errors, setErrors] = useState<string[]>([]), [note, setNote] = useState(initial.note);
    const point = points[selected - 1], shelves = points.flatMap(p => p.shelves), count = shelves.length, assigned = shelves.filter(s => s.destination).length, tableCount = leveTablePositions(points).length, supportCount = leveSackPositions(points).length;
    function apply(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const next = points.map(p => ({ ...p, shelves: p.shelves.map(s => ({ ...s, destination: String(form.get(p.id + ':' + s.id) ?? '').trim() || null })) }));
        const invalid = validateFishingPoints(next); setErrors(invalid); if (invalid.length) return;
        setPoints(next); setEditing(false);
        try { localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify({ version: 3, points: next })); setNote('Destinos das posições salvos neste navegador.'); }
        catch { setNote('Destinos aplicados nesta aba. O navegador não permitiu salvar.'); }
    }
    const map = <Map2D points={points} selected={selected} onSelect={setSelected}/>;
    const overview = () => { setDetail(false); setTop(true); setSceneKey(k => k + 1); };
    return <div className="fishing-app">
        <a className="skip-link" href="#fishing-main">Pular para o conteúdo</a>
        <header className="fish-header"><a className="fish-brand" href="#fishing-main"><span><Box size={24}/></span><div>SHOPEE <b>FLOW 360</b><small>LAYOUT DO LEVE</small></div></a><span className="fish-demo"><i/>Referência informada · sem escala</span></header>
        <main id="fishing-main" className="fish-main" tabIndex={-1}>
            <section className="fish-heading"><div><span className="fish-eyebrow">ESTEIRA · MESAS · SUPORTES DE SACA</span><h1>O leve, por inteiro.</h1><p>Mesas nas ilhas 1 a 5 e suportes de saca na ilha 6 (MG5). Identificação e destino são informações separadas.</p></div><div className="fish-overview"><div><strong>06</strong><span>pontos de pesca</span></div><div><strong>{pad(tableCount)}</strong><span>mesas de roletes</span></div><div><strong>{pad(supportCount)}</strong><span>suportes de saca</span></div></div></section>
            {note && <p className="fish-note" role="status">{note}</p>}
            <section className="fish-layout-panel" aria-labelledby="layout-title">
                <div className="fish-panel-heading"><div><span className="fish-eyebrow">VISÃO GERAL · LEVE</span><h2 id="layout-title">Uma esteira. Seis ilhas.</h2><p>Ilhas 1 a 5 com mesas. Ilha 6 com suportes de saca em seis fileiras.</p></div><div className="fish-view-switch" role="group" aria-label="Visualização do layout"><button aria-pressed={is3D} onClick={() => { setIs3D(true); overview(); }} className={is3D ? 'active' : ''}><Box size={17}/>3D</button><button aria-pressed={!is3D} onClick={() => setIs3D(false)} className={!is3D ? 'active' : ''}><LayoutGrid size={17}/>Mapa 2D</button></div></div>
                <div className="fish-point-nav" aria-label="Selecionar ponto de pesca">{points.map(p => <button key={p.id} onClick={() => setSelected(p.id)} aria-pressed={p.id === selected} className={p.id === selected ? 'selected' : ''}><span>{pad(p.id)}</span>{p.id === 6 ? 'MG5' : 'ILHA ' + p.id}<small>{p.shelves.length} {equipmentLabel(p.id)}</small></button>)}</div>
                <div className={'fish-scene' + (!is3D ? ' map-mode' : '')}>{is3D ? <SceneBoundary fallback={map}><Suspense fallback={<p className="fish-fallback">Preparando o layout do leve… O mapa 2D permanece disponível.</p>}><FishingScene resetKey={sceneKey} points={points} selected={selected} onSelect={setSelected} animate={animate} top={top} detail={detail}/></Suspense></SceneBoundary> : map}</div>
                <div className="fish-scene-tools"><span><i/>Selecionado: <b>{blockName(selected)}</b></span>{is3D && <div><button className="fish-show-all" onClick={overview}><LayoutGrid size={16}/>Ver todo o leve</button><button aria-pressed={animate} onClick={() => setAnimate(a => !a)}>{animate ? <Pause size={16}/> : <Play size={16}/>}{animate ? 'Pausar esteira' : 'Animar esteira'}</button><button aria-pressed={detail} onClick={() => { if (detail) overview(); else { setDetail(true); setTop(false); } }}>{detail ? 'Voltar à visão geral' : 'Aproximar ilha'}</button><button aria-pressed={top} onClick={() => { setDetail(false); setTop(t => !t); }}><Expand size={16}/>{top ? 'Vista em perspectiva' : 'Vista superior'}</button><button aria-label="Restaurar câmera do layout" onClick={overview}><RotateCcw size={16}/></button></div>}</div>
                <p className="fish-layout-note">{tableCount} mesas de roletes + {supportCount} suportes de saca = {count} posições identificadas. {assigned} destinos associados. Modelos ilustrativos, sem escala.</p>
            </section>
            <section className="fish-selected-panel" aria-labelledby="selected-title"><div className="fish-selected-identity"><span className="fish-big-number">{pad(selected)}</span><div><span className="fish-eyebrow">PONTO SELECIONADO</span><h2 id="selected-title">{blockName(selected)}</h2><p>{point.shelves.length} {equipmentLabel(point.id)} · {point.shelves.filter(s => !s.destination).length} destinos a confirmar</p></div></div><TableReference point={point}/><div className="fish-selected-shelves"><h3>Identificação → destino</h3><ShelfList point={point}/></div></section>
            <section className="fish-points-section" aria-labelledby="points-title"><div className="fish-section-heading"><div><span className="fish-eyebrow">IDENTIFICAÇÃO DAS POSIÇÕES</span><h2 id="points-title">O nome identifica. O destino direciona.</h2><p>Identificações do HTML de referência. Nenhum destino foi deduzido pelo nome da posição.</p></div><button className="fish-edit-button" aria-expanded={editing} aria-controls="fishing-mapping" onClick={() => { setEditing(e => !e); setErrors([]); }}><ScanLine size={18}/>{editing ? 'Fechar configuração' : 'Configurar destinos'}<ChevronDown size={16}/></button></div>
                {editing && <form id="fishing-mapping" className="fish-mapping" onSubmit={apply}><h3>Destino de cada posição</h3><p>Preencha somente as associações confirmadas. Campo vazio significa “A confirmar”. Os nomes e a ordem das posições permanecem os da referência.</p>{points.map(p => <details key={p.id} className="fish-editor-block" open={p.id === selected}><summary>{blockName(p.id)} · {p.shelves.length} {equipmentLabel(p.id)}</summary><div className="fish-shelf-fields">{p.shelves.map(s => <label key={s.id}><strong>{s.name}</strong><span>{p.id === 6 ? 'Fileira ' + s.row + ' · posição ' + s.position : blockName(p.id)}</span><input name={p.id + ':' + s.id} defaultValue={s.destination || ''} maxLength={100} placeholder="A confirmar" aria-label={'Destino da posição ' + s.name + ', ilha ' + p.id}/></label>)}</div></details>)}{!!errors.length && <ul className="fish-form-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}<button type="submit" className="fish-edit-button primary">Salvar destinos das posições</button></form>}
                <div className="fish-point-cards">{points.map(p => <article key={p.id} className={(p.id === selected ? 'selected ' : '') + (p.id === 6 ? 'fish-mg5-card' : '')}><button className="fish-card-title" onClick={() => setSelected(p.id)} aria-pressed={p.id === selected}><span>{pad(p.id)}</span><div><strong>{blockName(p.id)}</strong><small>{p.shelves.length} {equipmentLabel(p.id)}{p.id === 6 ? ' · 6 fileiras' : ''}</small></div><ArrowRight size={19}/></button><div className="fish-card-destinations"><span className="fish-card-label">IDENTIFICAÇÃO → DESTINO</span><ShelfList point={p}/></div></article>)}</div>
            </section>
            <TestSite/>
            <footer className="fish-footer"><span>SHOPEE FLOW 360 · LAYOUT DO LEVE</span><span>Layout ilustrativo · destinos por posição a confirmar</span></footer>
        </main>
    </div>;
}
