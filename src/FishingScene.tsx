import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, ContactShadows, OrbitControls } from '@react-three/drei';
import type { FishingPoint } from './fishingPoints';
import { LEVE_BLOCKS, shelfLocation, leveTablePositions, leveSackPositions } from './leveLayout';
import { FlowRackTables, FlowRackRollers } from './FlowRackTable';
import SackSupports from './SackSupport';
import { BoxGeometry, CanvasTexture, Group, InstancedMesh, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';
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
const positions = LEVE_BLOCKS.map(b => b.x);
const badgeTextures = new Map<string, CanvasTexture>();
function SceneBadge({ label, position, active = false, shelf = false, width = 2.7 }: { label: string; position: Vector; active?: boolean; shelf?: boolean; width?: number }) {
    const texture = useMemo(() => {
        const key = label + '-' + active + '-' + shelf;
        if (badgeTextures.has(key)) return badgeTextures.get(key)!;
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = active ? '#efbd88' : shelf ? '#173f55' : '#1b2e3b'; ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = shelf ? '#8bd0e9' : '#f0cca4'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, 506, 122);
        ctx.fillStyle = active ? '#221b14' : '#f1f6fa'; ctx.font = '600 ' + (label.length > 8 ? 56 : 68) + 'px Segoe UI, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 256, 68, 490);
        const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace;
        badgeTextures.set(key, result); return result;
    }, [label, active, shelf]);
    return <Billboard position={position}><mesh renderOrder={100}>
        <planeGeometry args={[width, width / 4]}/><meshBasicMaterial map={texture} depthTest={false} toneMapped={false}/>
    </mesh></Billboard>;
}
const Rollers = memo(function Rollers() {
    const ref = useRef<InstancedMesh>(null);
    useLayoutEffect(() => {
        const item = new Object3D();
        for (let i = 0; i < 200; i++) {
            item.position.set(-51.2 + i * 0.55, 1.6, -3.2);
            item.scale.set(0.12, 0.1, 1.8);
            item.updateMatrix();
            ref.current!.setMatrixAt(i, item.matrix);
        }
        ref.current!.instanceMatrix.needsUpdate = true;
        ref.current!.computeBoundingSphere();
    }, []);
    return <instancedMesh ref={ref} args={[geometry, material('#8998a2'), 200]} dispose={null} castShadow receiveShadow/>;
});
function Parcels({ animate }: {
    animate: boolean;
}) {
    const ref = useRef<Group>(null), elapsed = useRef(0);
    useFrame((_, delta) => {
        if (!ref.current || !animate)
            return;
        elapsed.current += Math.min(delta, 0.1) * 2.5;
        ref.current.children.forEach((child, i) => { child.position.x = ((i * 10.8 + elapsed.current) % 108) - 51; });
    });
    return <group ref={ref}>{Array.from({ length: 10 }, (_, i) => <group key={i} position={[-51 + i * 10.8, 2.02, -3.2]}>
        <Box p={[0, 0, 0]} s={[0.9, 0.75, 0.9]} c="#c7ad86"/>
        <Box p={[0, 0.38, 0]} s={[0.15, 0.025, 0.92]} c="#f1d6a5"/>
    </group>)}</group>;
}
function FitCamera({ top, detail, selected, resetKey }: {
    top: boolean;
    detail: boolean;
    selected: number;
    resetKey: number;
}) {
    const { camera, size, invalidate } = useThree();
    useEffect(() => {
        if (detail) {
            const x = positions[selected - 1];
            camera.position.set(x - 6, selected === 6 ? 39 : 12, selected === 6 ? 43 : 18);
            camera.lookAt(x, 0.5, selected === 6 ? 15 : 2.4);
            invalidate();
            return;
        }
        const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
        const tangent = Math.tan(47 * Math.PI / 360);
        const overviewHeight = Math.max(116 * 1.12 / (2 * tangent * aspect), 46 * 1.2 / (2 * tangent));
        const factor = Math.max(1, size.height / Math.max(size.width, 1) * 1.8);
        camera.position.set(top ? 3 : 29 * factor, top ? overviewHeight : 62 * factor, top ? 14.1 : 80 * factor);
        camera.lookAt(3, 0, 14);
        invalidate();
    }, [camera, size.width, size.height, top, detail, selected, resetKey, invalidate]);
    return null;
}
function Layout({ points, selected, onSelect, animate }: {
    points: FishingPoint[];
    selected: number;
    onSelect: (id: number) => void;
    animate: boolean;
}) {
    const tables = useMemo(() => leveTablePositions(points), [points]);
    const supports = useMemo(() => leveSackPositions(points), [points]);
    return <>
        <Box p={[3, -0.25, 14]} s={[116, 0.5, 46]} c="#44525b"/>
        <Box p={[3, 1.33, -3.2]} s={[111, 0.4, 2.2]} c="#26353f"/>
        <Rollers />
        {[-4.38, -2.02].map(z => <Box key={z} p={[3, 1.73, z]} s={[111.2, 0.14, 0.12]} c="#ed975b"/>)}
        {[-51, -33, -15, 3, 21, 39, 57].map(x => <Box key={x} p={[x, 0.6, -3.2]} s={[0.18, 1.2, 1.5]} c="#7a8a92"/>)}
        <Parcels animate={animate}/>
        <FlowRackRollers tables={tables} />
        <FlowRackTables tables={tables}/>
        <SackSupports positions={supports}/>
        {positions.map((x, i) => {
            const id = i + 1, active = selected === id, point = points[i];
            return <group key={id} onClick={e => { e.stopPropagation(); onSelect(id); }}>
                <Box p={[x, 0.03, 14.8]} s={[LEVE_BLOCKS[i].width, 0.05, 35]} c={active ? '#67513d' : '#35434d'}/>
                {[-LEVE_BLOCKS[i].width / 2, LEVE_BLOCKS[i].width / 2].map(offset => <Box key={offset} p={[x + offset, 0.07, 14.8]} s={[0.06, 0.05, 35]} c={active ? '#ffba77' : '#8a9c98'}/>)}
                {point.shelves.map(shelf => { const p = shelfLocation(id, shelf); return <SceneBadge key={shelf.id} label={id === 6 ? shelf.name.replace('MG5-', '') : shelf.name} position={[p.x, 1.5, p.z - 0.4]} shelf width={id === 6 ? 2.8 : 3.4}/>; })}
                {id === 6 && [1,2,3,4,5,6].map(row => <SceneBadge key={row} label={'F' + row} position={[x + (row - 3.5) * 5, 0.3, -0.6]} width={2.8}/>)}
                <SceneBadge label={id === 6 ? '06 · MG5' : 'ILHA ' + id} position={[x, 0.3, 33]} active={active} width={5.5}/>
            </group>;
        })}
        <ContactShadows position={[0, 0.01, 1]} opacity={0.35} scale={120} blur={2.2} far={16} frames={1}/>
    </>;
}
export default memo(function FishingScene({ points, selected, onSelect, animate, top, detail, resetKey }: {
    points: FishingPoint[];
    selected: number;
    onSelect: (id: number) => void;
    animate: boolean;
    top: boolean;
    detail: boolean;
    resetKey: number;
}) {
    const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
    const moving = animate && !reduced;
    const detailMode = detail;
    const target: Vector = detailMode ? [positions[selected - 1], 0.5, selected === 6 ? 15 : 2.4] : [3, 0, 14];
    return <Canvas shadows frameloop={moving ? 'always' : 'demand'} dpr={[1, 1.5]} camera={{ position: [25, 43, 53], fov: 47 }} fallback={<p className="fish-fallback">3D indisponível. Use o mapa 2D e os cartões dos seis pontos.</p>}>
        <color attach="background" args={['#19252e']}/>
        <ambientLight intensity={1.8}/><hemisphereLight args={['#e2efff', '#38434b', 1.4]}/>
        <directionalLight position={[-20, 35, 20]} intensity={3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={30} shadow-camera-bottom={-25}/>
        <FitCamera top={top} detail={detailMode} selected={selected} resetKey={resetKey}/><Layout points={points} selected={selected} onSelect={onSelect} animate={moving}/>
        <OrbitControls makeDefault target={target} minDistance={8} maxDistance={220} maxPolarAngle={Math.PI / 2.2}/>
    </Canvas>;
});
