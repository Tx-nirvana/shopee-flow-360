import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import type { FishingPoint } from './fishingPoints';
import { FlowRackTable, FlowRackRollers } from './FlowRackTable';
import { BoxGeometry, Group, InstancedMesh, MeshStandardMaterial, Object3D } from 'three';
const geometry = new BoxGeometry(1, 1, 1);
const materialCache = new Map<string, MeshStandardMaterial>();
function material(color: string) {
    if (!materialCache.has(color))
        materialCache.set(color, new MeshStandardMaterial({ color, roughness: 0.65 }));
    return materialCache.get(color)!;
}
type Vector = [
    number,
    number,
    number
];
function Box({ p, s, c }: {
    p: Vector;
    s: Vector;
    c: string;
}) {
    return <mesh position={p} scale={s} geometry={geometry} material={material(c)} castShadow receiveShadow dispose={null}/>;
}
const positions = [-32.5, -19.5, -6.5, 6.5, 19.5, 32.5];
const Rollers = memo(function Rollers() {
    const ref = useRef<InstancedMesh>(null);
    useLayoutEffect(() => {
        const item = new Object3D();
        for (let i = 0; i < 145; i++) {
            item.position.set(-39.6 + i * 0.55, 1.6, -3.2);
            item.scale.set(0.12, 0.1, 1.8);
            item.updateMatrix();
            ref.current!.setMatrixAt(i, item.matrix);
        }
        ref.current!.instanceMatrix.needsUpdate = true;
        ref.current!.computeBoundingSphere();
    }, []);
    return <instancedMesh ref={ref} args={[geometry, material('#8998a2'), 145]} dispose={null} castShadow receiveShadow/>;
});
function Parcels({ animate }: {
    animate: boolean;
}) {
    const ref = useRef<Group>(null), elapsed = useRef(0);
    useFrame((_, delta) => {
        if (!ref.current || !animate)
            return;
        elapsed.current += Math.min(delta, 0.1) * 2.5;
        ref.current.children.forEach((child, i) => { child.position.x = ((i * 7.8 + elapsed.current) % 78) - 39; });
    });
    return <group ref={ref}>{Array.from({ length: 10 }, (_, i) => <group key={i} position={[-39 + i * 7.8, 2.02, -3.2]}>
        <Box p={[0, 0, 0]} s={[0.9, 0.75, 0.9]} c="#c7ad86"/>
        <Box p={[0, 0.38, 0]} s={[0.15, 0.025, 0.92]} c="#f1d6a5"/>
    </group>)}</group>;
}
function FitCamera({ top, detail, selected }: {
    top: boolean;
    detail: boolean;
    selected: number;
}) {
    const { camera, size, invalidate } = useThree();
    useEffect(() => {
        if (detail) {
            const x = positions[selected - 1] - 3.25;
            camera.position.set(x - 3.4, 3.1, 8.5);
            camera.lookAt(x, 0.7, 3.4);
            invalidate();
            return;
        }
        const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
        const tangent = Math.tan(47 * Math.PI / 360);
        const overviewHeight = Math.max(88 * 1.12 / (2 * tangent * aspect), 26 * 1.2 / (2 * tangent));
        const factor = Math.max(1, size.height / Math.max(size.width, 1) * 1.8);
        camera.position.set(top ? 0 : 25 * factor, top ? overviewHeight : 43 * factor, top ? 1.1 : 53 * factor);
        camera.lookAt(0, 0, 1);
        invalidate();
    }, [camera, size.width, size.height, top, detail, selected, invalidate]);
    return null;
}
function Layout({ points, selected, onSelect, animate, detail }: {
    points: FishingPoint[];
    selected: number;
    onSelect: (id: number) => void;
    animate: boolean;
    detail: boolean;
}) {
    const tables = useMemo(() => points.flatMap((point, i) => point.tables.map((_, index) => ({
        x: positions[i] + ((index % 3) - 1) * 3.25,
        z: 3.4 + Math.floor(index / 3) * 3.1,
    }))), [points]);
    return <>
        <Box p={[0, -0.25, 1.5]} s={[88, 0.5, 26]} c="#44525b"/>
        <Box p={[0, 1.33, -3.2]} s={[81, 0.4, 2.2]} c="#26353f"/>
        <Rollers />
        {[-4.38, -2.02].map(z => <Box key={z} p={[0, 1.73, z]} s={[81.2, 0.14, 0.12]} c="#ed975b"/>)}
        {[-39, -26, -13, 0, 13, 26, 39].map(x => <Box key={x} p={[x, 0.6, -3.2]} s={[0.18, 1.2, 1.5]} c="#7a8a92"/>)}
        <Parcels animate={animate}/>
        <FlowRackRollers tables={tables} />
        {positions.map((x, i) => {
            const id = i + 1, active = selected === id, point = points[i];
            return <group key={id} onClick={e => { e.stopPropagation(); onSelect(id); }}>
                <Box p={[x, 0.03, 3.5]} s={[10.8, 0.05, 10]} c={active ? '#67513d' : '#35434d'}/>
                {[-5.45, 5.45].map(offset => <Box key={offset} p={[x + offset, 0.07, 3.5]} s={[0.06, 0.05, 10]} c={active ? '#ffba77' : '#8a9c98'}/>)}
                {point.tables.map((table, index) => {
                    const tx = x + ((index % 3) - 1) * 3.25, tz = 3.4 + Math.floor(index / 3) * 3.1;
                    return <group key={table.id}>
                        <FlowRackTable x={tx} z={tz} />
                        {!detail && <Html position={[tx, 1.3, tz - 0.5]} center distanceFactor={28}><span className="fish-table-marker" aria-label={`Ponto ${id}, mesa ${table.id}: ${table.destination}`} title={table.destination}>M{table.id}</span></Html>}
                    </group>;
                })}
                {!detail && <Html position={[x, 0.3, 8.1]} center distanceFactor={36}><button className={`fish-scene-number ${active ? 'selected' : ''}`} onClick={() => onSelect(id)} aria-label={`Selecionar ponto de pesca ${id}`} aria-pressed={active}>{String(id).padStart(2, '0')}</button></Html>}
            </group>;
        })}
        <ContactShadows position={[0, 0.01, 1]} opacity={0.35} scale={80} blur={2.2} far={16} frames={1}/>
    </>;
}
export default memo(function FishingScene({ points, selected, onSelect, animate, top, detail }: {
    points: FishingPoint[];
    selected: number;
    onSelect: (id: number) => void;
    animate: boolean;
    top: boolean;
    detail: boolean;
}) {
    const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
    const moving = animate && !reduced;
    const detailMode = detail && points[selected - 1].tables.length > 0;
    const target: Vector = detailMode ? [positions[selected - 1] - 3.25, 0.7, 3.4] : [0, 0, 1];
    return <Canvas shadows frameloop={moving ? 'always' : 'demand'} dpr={[1, 1.5]} camera={{ position: [25, 43, 53], fov: 47 }} fallback={<p className="fish-fallback">3D indisponível. Use o mapa 2D e os cartões dos seis pontos.</p>}>
        <color attach="background" args={['#19252e']}/>
        <ambientLight intensity={1.8}/><hemisphereLight args={['#e2efff', '#38434b', 1.4]}/>
        <directionalLight position={[-20, 35, 20]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={30} shadow-camera-bottom={-25}/>
        <FitCamera top={top} detail={detailMode} selected={selected}/><Layout points={points} selected={selected} onSelect={onSelect} animate={moving} detail={detailMode}/>
        <OrbitControls makeDefault target={target} minDistance={detailMode ? 2.4 : 35} maxDistance={detailMode ? 14 : 160} maxPolarAngle={Math.PI / 2.2}/>
    </Canvas>;
});
