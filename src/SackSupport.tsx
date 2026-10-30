import { memo, useLayoutEffect, useRef } from 'react';
import { BoxGeometry, CylinderGeometry, DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D } from 'three';
import type { TablePosition } from './FlowRackTable';
const bar = new BoxGeometry(1,1,1);
const frameMaterial = new MeshStandardMaterial({color:'#171e22',roughness:0.7,metalness:0.4});
const bag = new CylinderGeometry(0.72,0.5,1.1,4,1,true);
const bagMaterial = new MeshStandardMaterial({color:'#c2b58f',roughness:1,side:DoubleSide});
type Part = {p:[number,number,number];s:[number,number,number]};
const parts: Part[] = [];
for (const x of [-0.82,0.82]) for (const z of [-0.82,0.82]) parts.push({p:[x,0.73,z],s:[0.09,1.46,0.09]});
for (const y of [0.12,1.42]) {
    for (const x of [-0.82,0.82]) parts.push({p:[x,y,0],s:[0.09,0.09,1.73]});
    for (const z of [-0.82,0.82]) parts.push({p:[0,y,z],s:[1.73,0.09,0.09]});
}
/** Suporte esquemático de saca, aberto em cima e sem tampo ou roletes. */
export default memo(function SackSupports({positions}:{positions:TablePosition[]}) {
    const frames=useRef<InstancedMesh>(null), bags=useRef<InstancedMesh>(null);
    useLayoutEffect(()=>{
        const item=new Object3D();let index=0;
        positions.forEach((p,i)=>{
            for (const part of parts) {item.position.set(p.x+part.p[0],part.p[1],p.z+part.p[2]);item.rotation.set(0,0,0);item.scale.set(...part.s);item.updateMatrix();frames.current!.setMatrixAt(index++,item.matrix);}
            item.position.set(p.x,0.8,p.z);item.rotation.set(0,Math.PI/4,0);item.scale.set(1.5,1,1.5);item.updateMatrix();bags.current!.setMatrixAt(i,item.matrix);
        });
        for (const ref of [frames,bags]) {ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();}
    },[positions]);
    return <><instancedMesh ref={frames} args={[bar,frameMaterial,positions.length*parts.length]} castShadow receiveShadow dispose={null}/><instancedMesh ref={bags} args={[bag,bagMaterial,positions.length]} castShadow receiveShadow dispose={null}/></>;
});
