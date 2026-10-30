import { Suspense, useRef, useLayoutEffect, memo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { Group, MathUtils, InstancedMesh, Object3D, BoxGeometry, MeshStandardMaterial } from 'three';
import type { Dock, Transfer } from './shipping';
export const colors = { Carregando: '#71d6b1', Aguardando: '#eeb65f', Liberada: '#76818e', Atrasada: '#fa725a', Pronta: '#87baff' };
const unitBox = new BoxGeometry(1, 1, 1);
const materials = new Map<string, MeshStandardMaterial>();
function material(color: string) { if (!materials.has(color))
    materials.set(color, new MeshStandardMaterial({ color, roughness: 0.65 })); return materials.get(color)!; }
type BoxInstance = {
    p: [
        number,
        number,
        number
    ];
    s: [
        number,
        number,
        number
    ];
};
function BoxInstances({ items, color }: {
    items: BoxInstance[];
    color: string;
}) {
    const ref = useRef<InstancedMesh>(null);
    useLayoutEffect(() => { if (!ref.current)
        return; const dummy = new Object3D(); items.forEach((item, i) => { dummy.position.set(...item.p); dummy.scale.set(...item.s); dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix); }); ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }, [items]);
    return <instancedMesh ref={ref} args={[unitBox, material(color), items.length]} castShadow receiveShadow dispose={null}/>;
}
const rollers: BoxInstance[] = [...Array.from({ length: 51 }, (_, i) => ({ p: [-14.7 + i * 0.59, 1.15, -16] as [
            number,
            number,
            number
        ], s: [0.11, 0.08, 1.1] as [
            number,
            number,
            number
        ] })), ...Array.from({ length: 8 }, (_, i) => Array.from({ length: 5 }, (_, j) => ({ p: [(i - 3.5) * 3.65, 1.15, -15.2 + j * 0.45] as [
            number,
            number,
            number
        ], s: [0.85, 0.08, 0.08] as [
            number,
            number,
            number
        ] }))).flat()];
const shutters: BoxInstance[] = Array.from({ length: 8 }, (_, i) => Array.from({ length: 7 }, (_, j) => ({ p: [(i - 3.5) * 3.65, 0.4 + j * 0.38, -3.1] as [
        number,
        number,
        number
    ], s: [2.3, 0.035, 0.04] as [
        number,
        number,
        number
    ] }))).flat();
const ribs: BoxInstance[] = Array.from({ length: 11 }, (_, i) => ({ p: [-1.135, 1.72, -1.4 + i * 0.48], s: [0.025, 2.4, 0.035] }));
const Rollers = memo(() => <BoxInstances items={rollers} color="#84939c"/>);
const Shutters = memo(() => <BoxInstances items={shutters} color="#768187"/>);
const TruckRibs = memo(({ selected }: {
    selected: boolean;
}) => <BoxInstances items={ribs} color={selected ? '#d85d26' : '#afb5b7'}/>);
function Box({ p, s, c, ...props }: {
    p: [
        number,
        number,
        number
    ];
    s: [
        number,
        number,
        number
    ];
    c: string;
    [key: string]: unknown;
}) { return <mesh position={p} scale={s} geometry={unitBox} material={material(c)} castShadow receiveShadow dispose={null} {...props}/>; }
function Truck({ dock, x, selected, onSelect, reducedMotion = false }: {
    dock: Dock;
    x: number;
    selected: boolean;
    onSelect: () => void;
    reducedMotion?: boolean;
}) {
    const invalidate = useThree(state => state.invalidate);
    const ref = useRef<Group>(null);
    const target = dock.status === 'Liberada' ? 20 : 1;
    useFrame((_, delta) => { if (ref.current) {
        ref.current.position.z = reducedMotion ? target : MathUtils.damp(ref.current.position.z, target, 1.5, Math.min(delta, 0.1));
        if (!reducedMotion && Math.abs(ref.current.position.z - target) > 0.01)
            invalidate();
    } });
    return <group position={[x, 0, 0]}>
  <Box p={[0, 0.015, 4.4]} s={[3, 0.03, 12]} c={selected ? '#765038' : '#323b40'}/>
  {[-1.52, 1.52].map(a => <Box key={a} p={[a, 0.035, 4.4]} s={[0.045, 0.04, 12]} c={selected ? '#ff793d' : '#d3c3a3'}/>)}
  <Html position={[0, 0.15, 10.7]} center distanceFactor={44}><button aria-label={`Doca ${dock.id}: ${dock.route}, ${dock.status}`} aria-pressed={selected} onClick={onSelect} className={`dock-tag ${selected ? 'selected' : ''}`}>D{String(dock.id).padStart(2, '0')}<i style={{ background: colors[dock.status] }}/></button></Html>
  <group ref={ref} position={[0, 0, 1]} onClick={e => { e.stopPropagation(); onSelect(); }}>
   <Box p={[0, 1.72, 1]} s={[2.25, 2.65, 5.5]} c={selected ? '#ff783c' : dock.id % 3 === 0 ? '#c3c8ca' : '#e2e2dd'}/>
   <TruckRibs selected={selected}/>
   <Box p={[0, 0.6, 2]} s={[2.4, 0.35, 8]} c="#20272c"/>
   <Box p={[0, 1.25, 4.9]} s={[2.3, 2.1, 2.15]} c="#f36a32"/>
   <Box p={[0, 1.75, 6]} s={[1.95, 0.8, 0.04]} c="#182d3b"/>
   <Box p={[0, 0.7, 6.03]} s={[2.3, 0.25, 0.1]} c="#404a51"/>
   {[-0.8, 0.8].map(v => <Box key={v} p={[v, 1, 6.05]} s={[0.45, 0.2, 0.05]} c="#ffecc6"/>)}
   {[-1.18, 1.18].flatMap(a => [-0.8, 0.2, 4.9].map(z => <mesh key={`${a}-${z}`} position={[a, 0.5, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.5, 0.5, 0.27, 12]}/><meshStandardMaterial color="#14191d"/></mesh>))}
   {selected && <Html position={[0, 3.2, 1]} center distanceFactor={45} style={{ pointerEvents: 'none' }}><div className="truck-label">{dock.truck}</div></Html>}
  </group>
 </group>;
}
function MovingParcel({ transfer, seconds, running, speed, selected }: {
    transfer: Transfer;
    seconds: number;
    running: boolean;
    speed: number;
    selected: number;
}) {
    const ref = useRef<Group>(null), timing = useRef({ second: seconds, fraction: 0 });
    useFrame((_, delta) => {
        if (!ref.current)
            return;
        if (timing.current.second !== seconds)
            timing.current = { second: seconds, fraction: 0 };
        else if (running)
            timing.current.fraction = Math.min(0.95, timing.current.fraction + delta * speed);
        const u = MathUtils.clamp((seconds + timing.current.fraction - transfer.started) / (transfer.arrives - transfer.started), 0, 1), x = (transfer.dockId - 4.5) * 3.65;
        ref.current.position.set(x, u < 0.25 ? MathUtils.lerp(1.55, 0.45, u / 0.25) : 0.45, MathUtils.lerp(-11.9, -7.2, u));
    });
    return <group ref={ref}><Box p={[0, 0, 0]} s={[0.6, 0.65, 0.6]} c={transfer.dockId === selected ? '#ff874a' : '#d4ad7d'}/><Box p={[0, 0.33, 0]} s={[0.12, 0.02, 0.6]} c="#f7ddad"/></group>;
}
function InboundParcel({ dock, seconds, running, speed, selected }: {
    dock: Dock;
    seconds: number;
    running: boolean;
    speed: number;
    selected: number;
}) {
    const ref = useRef<Group>(null), timing = useRef({ second: seconds, fraction: 0 });
    useFrame((_, delta) => {
        if (!ref.current)
            return;
        if (timing.current.second !== seconds)
            timing.current = { second: seconds, fraction: 0 };
        else if (running)
            timing.current.fraction = Math.min(0.95, timing.current.fraction + delta * speed);
        const u = ((seconds + timing.current.fraction + dock.id) % 8) / 8, x = (dock.id - 4.5) * 3.65;
        ref.current.position.set(u < 0.7 ? MathUtils.lerp(-14, x, u / 0.7) : x, 1.5, u < 0.7 ? -16 : MathUtils.lerp(-16, -13.2, (u - 0.7) / 0.3));
    });
    return <group ref={ref}><Box p={[0, 0, 0]} s={[0.6, 0.65, 0.6]} c={dock.id === selected ? '#ff874a' : '#d4ad7d'}/><Box p={[0, 0.33, 0]} s={[0.12, 0.02, 0.6]} c="#f7ddad"/></group>;
}
function CounterFlow({ docks, selected, onSelect, transfers, seconds, running, speed, counterHeld }: {
    docks: Dock[];
    selected: number;
    onSelect: (n: number) => void;
    transfers: Transfer[];
    seconds: number;
    running: boolean;
    speed: number;
    counterHeld: boolean;
}) {
    return <>
 {/* Conveyor and its short feeds stay behind the counter. */}
 <Box p={[0, 1, -16]} s={[30, 0.25, 1.2]} c="#38434b"/>
 <Rollers />
 {[-16.66, -15.34].map(z => <Box key={z} p={[0, 1.19, z]} s={[30.2, 0.1, 0.08]} c="#e6b976"/>)}
 <Html position={[0, 2.7, -16.5]} center distanceFactor={48}><div className="conveyor-sign">01 · ESTEIRA DE ENTRADA<small>{docks.reduce((n, d) => n + d.inbound, 0)} VOLUMES A CAMINHO DO BALCÃO</small></div></Html>
 <Box p={[0, 0.65, -12.5]} s={[30, 1.3, 1.7]} c="#38464f"/><Box p={[0, 1.36, -12.5]} s={[30.2, 0.15, 1.9]} c={counterHeld ? '#ba5748' : '#f07840'}/>
 <Html position={[-16.6, 2, -12.5]} center distanceFactor={48}><div className={`counter-sign ${counterHeld ? 'held' : ''}`}>02 · BALCÃO<small>{counterHeld ? 'CONFERÊNCIA ADICIONAL' : `${docks.reduce((n, d) => n + d.pending, 0)} VOLUMES PENDENTES`}</small></div></Html>
 {docks.map(d => {
            const x = (d.id - 4.5) * 3.65, active = d.id === selected;
            return <group key={d.id}>
  <Box p={[x, 1, -14.3]} s={[0.9, 0.25, 2.2]} c="#38434b"/>
  
  <Box p={[x, 1.9, -12.9]} s={[0.95, 0.8, 0.12]} c="#21303b"/><Box p={[x, 1.9, -12.81]} s={[0.8, 0.6, 0.02]} c={counterHeld ? '#ba5748' : '#6cb5b5'}/>
  {d.pending > 0 && <Box p={[x + 0.9, 1.75, -12.4]} s={[0.55, 0.65, 0.55]} c="#d8ae7c"/>}
  <group onClick={e => { e.stopPropagation(); onSelect(d.id); }}>
   <Box p={[x, 0.018, -7.7]} s={[2.8, 0.035, 7.1]} c={active ? '#675342' : '#424d53'}/>
   {[-1.4, 1.4].map(offset => <Box key={offset} p={[x + offset, 0.045, -7.7]} s={[0.07, 0.045, 7.1]} c={active ? '#ffb65d' : '#e6c579'}/>)}
   <Box p={[x, 0.045, -11.2]} s={[2.85, 0.045, 0.07]} c="#e6c579"/>
   {[-0.65, 0, 0.65].map(offset => <Box key={offset} p={[x + offset, 0.045, -4.2]} s={[0.4, 0.045, 0.07]} c="#e6c579"/>)}
   <Box p={[x, 0.04, -5.2]} s={[0.055, 0.04, 1]} c={active ? '#ffb65d' : '#b4bda8'}/>
   <Box p={[x - 0.19, 0.04, -4.85]} s={[0.5, 0.04, 0.055]} c={active ? '#ffb65d' : '#b4bda8'} rotation={[0, -Math.PI / 4, 0]}/>
   <Box p={[x + 0.19, 0.04, -4.85]} s={[0.5, 0.04, 0.055]} c={active ? '#ffb65d' : '#b4bda8'} rotation={[0, Math.PI / 4, 0]}/>
   {d.staged > 0 && <><Box p={[x, 0.12, -7.5]} s={[1.8, 0.24, 2.2]} c="#9b7957"/>{Array.from({ length: Math.min(6, Math.ceil(d.staged / 40)) }, (_, i) => <Box key={i} p={[x + (i % 2 === 0 ? -0.43 : 0.43), 0.55 + Math.floor(i / 4) * 0.7, -7.9 + Math.floor(i % 4 / 2) * 0.9]} s={[0.75, 0.65, 0.75]} c={active ? '#f98a4c' : '#b39a7c'}/>)}</>}
  </group>
  <Html position={[x, 0.25, -10.15]} center distanceFactor={49}><button className={`route-label street-label ${active ? 'selected' : ''}`} onClick={() => onSelect(d.id)} aria-pressed={active} aria-label={`Selecionar rua ${d.id} do stage out: ${d.route}, ${d.staged} volumes`}>RUA {String(d.id).padStart(2, '0')}{active && <small>STAGE OUT · {d.staged} vol.</small>}</button></Html>
 </group>;
        })}
 {docks.filter(d => d.inbound > 0).map(d => <InboundParcel key={d.id} dock={d} seconds={seconds} running={running} speed={speed} selected={selected}/>)}
 {transfers.map(t => <MovingParcel key={t.id} transfer={t} seconds={seconds} running={running} speed={speed} selected={selected}/>)}
 </>;
}
type SceneProps = {
    docks: Dock[];
    selected: number;
    onSelect: (n: number) => void;
    view: number;
    autoRotate: boolean;
    reducedMotion?: boolean;
    transfers: Transfer[];
    seconds: number;
    running: boolean;
    speed: number;
    counterHeld: boolean;
};
function Warehouse(props: SceneProps) {
    const { docks, selected, onSelect } = props;
    return <>
 <Box p={[0, -0.25, -2]} s={[39, 0.5, 36]} c="#535c60"/>
 <Box p={[0, 2, -18]} s={[32, 4, 0.3]} c="#69777f"/>
 <Box p={[0, 4, -18]} s={[32, 0.2, 0.5]} c="#f07840"/>
 <CounterFlow {...props}/><Shutters />
 <Box p={[0, 3.9, -3.4]} s={[31.8, 0.65, 0.18]} c="#f36a32"/>
 <Html position={[-11, 4, -3.25]} distanceFactor={45} center><div className="building-sign">SHOPEE <span>EXPEDIÇÃO</span></div></Html>
 {docks.map(d => {
            const x = (d.id - 4.5) * 3.65;
            return <group key={d.id}>
  <Box p={[x, 1.7, -3.4]} s={[2.9, 3.2, 0.2]} c="#272f35"/>
  <Box p={[x, 1.55, -3.23]} s={[2.35, 2.75, 0.2]} c="#4a555b"/>
  
  <Box p={[x, 3.38, -3.12]} s={[2.8, 0.08, 0.06]} c={colors[d.status]}/>
  <Truck reducedMotion={props.reducedMotion} dock={d} x={x} selected={selected === d.id} onSelect={() => onSelect(d.id)}/>
 </group>;
        })}
 {[-17.5, 17.5].map(x => <group key={x}><Box p={[x, 3, 0]} s={[0.12, 6, 0.12]} c="#939da2"/><Box p={[x, 6, 0.8]} s={[0.25, 0.15, 1.8]} c="#d6dcd8"/></group>)}
 {Array.from({ length: 15 }, (_, i) => <Box key={i} p={[-17 + i * 2.4, 0.03, 13.8]} s={[1.2, 0.035, 0.1]} c="#e3c182"/>)}
 {[-16, 16].flatMap(x => [0, 2, 4, 6, 8].map(z => <mesh key={`${x}-${z}`} position={[x, 0.35, z]}><coneGeometry args={[0.22, 0.7, 8]}/><meshStandardMaterial color="#ff843d"/></mesh>))}
 <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={65} blur={2.5} far={20}/>
 </>;
}
function Scene(props: SceneProps) {
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
    return <Canvas frameloop={!reducedMotion && (props.running || props.autoRotate) ? 'always' : 'demand'} key={props.view} shadows dpr={[1, 1.6]} camera={{ position: props.view % 2 === 0 ? [32, 36, 38] : [0, 49, 8], fov: 48 }} gl={{ antialias: true }} fallback={<div className="canvas-fallback">WebGL indisponível. Use a programação abaixo para acompanhar a operação.</div>}>
 <color attach="background" args={['#1e252a']}/><fog attach="fog" args={['#1e252a', 55, 110]}/><ambientLight intensity={1.8}/><hemisphereLight args={['#cfdfed', '#414b53', 1.8]}/><directionalLight position={[8, 25, 12]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}/>
 <Suspense fallback={null}><Warehouse {...props} reducedMotion={reducedMotion} running={props.running && !reducedMotion}/></Suspense><OrbitControls makeDefault target={[0, 0.5, -2]} minDistance={22} maxDistance={78} maxPolarAngle={Math.PI / 2.2} autoRotate={props.autoRotate && !reducedMotion} autoRotateSpeed={0.5}/>
 </Canvas>;
}
export default memo(Scene);
