import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D } from 'three';

const box = new BoxGeometry(1, 1, 1);
const frameMaterial = new MeshStandardMaterial({ color: '#101518', metalness: 0.55, roughness: 0.6 });
const railMaterial = new MeshStandardMaterial({ color: '#242c31', metalness: 0.65, roughness: 0.48 });
const wheelMaterial = new MeshStandardMaterial({ color: '#353c42', roughness: 0.72 });
const footMaterial = new MeshStandardMaterial({ color: '#101517', roughness: 0.8 });
const screwMaterial = new MeshStandardMaterial({ color: '#73818a', metalness: 0.8, roughness: 0.4 });
const wheelGeometry = new CylinderGeometry(0.073, 0.073, 0.105, 10);
const footGeometry = new CylinderGeometry(0.13, 0.15, 0.06, 12);
const screwGeometry = new CylinderGeometry(0.035, 0.035, 0.13, 8);

export type TablePosition = { x: number; z: number };
function FrameBar({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
    return <mesh geometry={box} material={frameMaterial} position={position} scale={scale} castShadow receiveShadow dispose={null} />;
}

/** Balcão compacto inspirado na foto: leito de rodízios, chassi aberto e pés reguláveis. */
export const FlowRackTable = memo(function FlowRackTable({ x, z }: TablePosition) {
    return <group position={[x, 0, z]}>
        {[-0.73, 0.73].flatMap(px => [-1.25, 1.25].map(pz => <group key={`${px}-${pz}`}>
            <FrameBar position={[px, (1.175 - pz * 0.035) / 2, pz]} scale={[0.09, 0.955 - pz * 0.035, 0.09]} />
            <mesh position={[px, 0.11, pz]} geometry={screwGeometry} material={screwMaterial} castShadow dispose={null} />
            <mesh position={[px, 0.035, pz]} geometry={footGeometry} material={footMaterial} receiveShadow dispose={null} />
        </group>))}
        {[-0.73, 0.73].map(px => <FrameBar key={px} position={[px, 0.31, 0]} scale={[0.07, 0.07, 2.57]} />)}
        {[-1.25, 1.25].map(pz => <FrameBar key={pz} position={[0, 0.31, pz]} scale={[1.55, 0.07, 0.07]} />)}
        <group position={[0, 1.13, 0]} rotation={[0.035, 0, 0]}>
            {[-0.85, 0.85].map(px => <FrameBar key={px} position={[px, 0, 0]} scale={[0.09, 0.13, 2.96]} />)}
            {[-1.44, 1.44].map(pz => <FrameBar key={pz} position={[0, 0, pz]} scale={[1.79, 0.13, 0.08]} />)}
            {[-0.8, 0.8].map(pz => <FrameBar key={pz} position={[0, -0.09, pz]} scale={[1.63, 0.07, 0.06]} />)}
        </group>
    </group>;
});

export const FlowRackRollers = memo(function FlowRackRollers({ tables }: { tables: TablePosition[] }) {
    const wheels = useRef<InstancedMesh>(null), rails = useRef<InstancedMesh>(null);
    const count = tables.length;
    const slope = 0.035;
    const dummy = useMemo(() => new Object3D(), []);
    useLayoutEffect(() => {
        if (!wheels.current || !rails.current) return;
        let wi = 0, ri = 0;
        for (const table of tables) {
            for (let track = 0; track < 7; track++) {
                const x = table.x - 0.69 + track * 0.23;
                dummy.position.set(x, 1.13, table.z);
                dummy.rotation.set(slope, 0, 0); dummy.scale.set(0.065, 0.06, 2.77); dummy.updateMatrix();
                rails.current.setMatrixAt(ri++, dummy.matrix);
                for (let row = 0; row < 17; row++) {
                    const localZ = -1.28 + row * 0.16;
                    dummy.position.set(x, 1.13 + 0.045 * Math.cos(slope) - localZ * Math.sin(slope), table.z + localZ * Math.cos(slope) + 0.045 * Math.sin(slope));
                    dummy.rotation.set(slope, 0, Math.PI / 2); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
                    wheels.current.setMatrixAt(wi++, dummy.matrix);
                }
            }
        }
        wheels.current.instanceMatrix.needsUpdate = true; wheels.current.computeBoundingSphere();
        rails.current.instanceMatrix.needsUpdate = true; rails.current.computeBoundingSphere();
    }, [tables, dummy]);
    return <>
        <instancedMesh ref={wheels} args={[wheelGeometry, wheelMaterial, count * 119]} castShadow receiveShadow dispose={null} />
        <instancedMesh ref={rails} args={[box, railMaterial, count * 7]} castShadow receiveShadow dispose={null} />
    </>;
});


type FramePart = { p: [number, number, number]; s: [number, number, number]; tilt?: boolean };
const frameParts: FramePart[] = [];
for (const x of [-0.73, 0.73]) for (const z of [-1.25, 1.25]) frameParts.push({ p: [x, (1.175 - z * 0.035) / 2, z], s: [0.09, 0.955 - z * 0.035, 0.09] });
for (const x of [-0.73, 0.73]) frameParts.push({ p: [x, 0.31, 0], s: [0.07, 0.07, 2.57] });
for (const z of [-1.25, 1.25]) frameParts.push({ p: [0, 0.31, z], s: [1.55, 0.07, 0.07] });
for (const x of [-0.85, 0.85]) frameParts.push({ p: [x, 0, 0], s: [0.09, 0.13, 2.96], tilt: true });
for (const z of [-1.44, 1.44]) frameParts.push({ p: [0, 0, z], s: [1.79, 0.13, 0.08], tilt: true });
for (const z of [-0.8, 0.8]) frameParts.push({ p: [0, -0.09, z], s: [1.63, 0.07, 0.06], tilt: true });

/** Mesmo balcão de roletes, com chassi e pés instanciados para o layout completo. */
export const FlowRackTables = memo(function FlowRackTables({ tables }: { tables: TablePosition[] }) {
    const frames = useRef<InstancedMesh>(null), feet = useRef<InstancedMesh>(null), screws = useRef<InstancedMesh>(null);
    useLayoutEffect(() => {
        const item = new Object3D(); let frameIndex = 0, footIndex = 0;
        for (const table of tables) {
            for (const part of frameParts) {
                const [x,y,z] = part.p, angle = part.tilt ? 0.035 : 0;
                item.position.set(table.x + x, part.tilt ? 1.13 + y * Math.cos(angle) - z * Math.sin(angle) : y, table.z + y * Math.sin(angle) + z * Math.cos(angle));
                item.rotation.set(angle,0,0); item.scale.set(...part.s); item.updateMatrix(); frames.current!.setMatrixAt(frameIndex++, item.matrix);
            }
            for (const x of [-0.73,0.73]) for (const z of [-1.25,1.25]) {
                item.rotation.set(0,0,0); item.scale.set(1,1,1);
                item.position.set(table.x + x,0.035,table.z + z); item.updateMatrix(); feet.current!.setMatrixAt(footIndex,item.matrix);
                item.position.y=0.11; item.updateMatrix(); screws.current!.setMatrixAt(footIndex++,item.matrix);
            }
        }
        for (const ref of [frames,feet,screws]) { ref.current!.instanceMatrix.needsUpdate=true; ref.current!.computeBoundingSphere(); }
    }, [tables]);
    return <>
        <instancedMesh ref={frames} args={[box,frameMaterial,tables.length * frameParts.length]} castShadow receiveShadow dispose={null}/>
        <instancedMesh ref={feet} args={[footGeometry,footMaterial,tables.length * 4]} receiveShadow dispose={null}/>
        <instancedMesh ref={screws} args={[screwGeometry,screwMaterial,tables.length * 4]} castShadow dispose={null}/>
    </>;
});
