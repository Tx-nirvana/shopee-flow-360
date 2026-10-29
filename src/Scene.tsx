import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { Group, MathUtils } from 'three'
import type { Dock } from './simulation'
export const colors = {Carregando:'#71d6b1',Aguardando:'#eeb65f',Liberada:'#76818e',Atrasada:'#fa725a'}
function Box({p,s,c,...props}:{p:[number,number,number];s:[number,number,number];c:string;[key:string]:unknown}){return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={0.65}/></mesh>}
function Truck({dock,x,selected,onSelect}:{dock:Dock;x:number;selected:boolean;onSelect:()=>void}){
 const ref=useRef<Group>(null); const target=dock.status==='Liberada'?17:dock.status==='Aguardando'?8:1;
 useFrame((_,delta)=>{if(ref.current)ref.current.position.z=MathUtils.damp(ref.current.position.z,target,1.5,Math.min(delta,0.1))});
 return <group position={[x,0,0]}>
  <Box p={[0,0.015,4.4]} s={[3,0.03,12]} c={selected?'#765038':'#323b40'}/>
  {[-1.52,1.52].map(a=><Box key={a} p={[a,0.035,4.4]} s={[0.045,0.04,12]} c={selected?'#ff793d':'#d3c3a3'}/>)}
  <Html position={[0,0.15,10.7]} center distanceFactor={44}><button onClick={onSelect} className={`dock-tag ${selected?'selected':''}`}>D{String(dock.id).padStart(2,'0')}<i style={{background:colors[dock.status]}}/></button></Html>
  <group ref={ref} position={[0,0,1]} onClick={e=>{e.stopPropagation();onSelect()}}>
   <Box p={[0,1.72,1]} s={[2.25,2.65,5.5]} c={selected?'#ff783c':dock.id%3===0?'#c3c8ca':'#e2e2dd'}/>
   {Array.from({length:11},(_,i)=><Box key={i} p={[-1.135,1.72,-1.4+i*0.48]} s={[0.025,2.4,0.035]} c={selected?'#d85d26':'#afb5b7'}/>)}
   <Box p={[0,0.6,2]} s={[2.4,0.35,8]} c="#20272c"/>
   <Box p={[0,1.25,4.9]} s={[2.3,2.1,2.15]} c="#f36a32"/>
   <Box p={[0,1.75,6]} s={[1.95,0.8,0.04]} c="#182d3b"/>
   <Box p={[0,0.7,6.03]} s={[2.3,0.25,0.1]} c="#404a51"/>
   {[-0.8,0.8].map(v=><Box key={v} p={[v,1,6.05]} s={[0.45,0.2,0.05]} c="#ffecc6"/>)}
   {[-1.18,1.18].flatMap(a=>[-0.8,0.2,4.9].map(z=><mesh key={`${a}-${z}`} position={[a,0.5,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.5,0.5,0.27,12]}/><meshStandardMaterial color="#14191d"/></mesh>))}
   <Html position={[0,3.2,1]} center distanceFactor={45} style={{pointerEvents:'none'}}><div className="truck-label">{dock.truck}</div></Html>
  </group>
 </group>
}
function Warehouse({docks,selected,onSelect}:{docks:Dock[];selected:number;onSelect:(n:number)=>void}){return <>
 <Box p={[0,-0.25,2]} s={[39,0.5,28]} c="#535c60"/>
 <Box p={[0,2.4,-7]} s={[31.5,4.8,7]} c="#788389"/>
 <Box p={[0,4.9,-7]} s={[32,0.25,7.5]} c="#afb5b6"/>
 {Array.from({length:20},(_,i)=><Box key={i} p={[-15+i*1.6,5.07,-7]} s={[0.06,0.12,7.2]} c="#8e999e"/>)}
 <Box p={[0,3.9,-3.4]} s={[31.8,0.65,0.18]} c="#f36a32"/>
 <Html position={[-11,4,-3.25]} distanceFactor={45} center><div className="building-sign">SHOPEE <span>EXPEDIÇÃO</span></div></Html>
 {docks.map(d=>{const x=(d.id-4.5)*3.65;return <group key={d.id}>
  <Box p={[x,1.7,-3.4]} s={[2.9,3.2,0.2]} c="#272f35"/>
  <Box p={[x,1.55,-3.23]} s={[2.35,2.75,0.2]} c="#4a555b"/>
  {Array.from({length:7},(_,i)=><Box key={i} p={[x,0.4+i*0.38,-3.1]} s={[2.3,0.035,0.04]} c="#768187"/>)}
  <Box p={[x,3.38,-3.12]} s={[2.8,0.08,0.06]} c={colors[d.status]}/>
  <Truck dock={d} x={x} selected={selected===d.id} onSelect={()=>onSelect(d.id)}/>
 </group>})}
 {[-17.5,17.5].map(x=><group key={x}><Box p={[x,3,0]} s={[0.12,6,0.12]} c="#939da2"/><Box p={[x,6,0.8]} s={[0.25,0.15,1.8]} c="#d6dcd8"/></group>)}
 {Array.from({length:15},(_,i)=><Box key={i} p={[-17+i*2.4,0.03,13.8]} s={[1.2,0.035,0.1]} c="#e3c182"/>)}
 {[-16,16].flatMap(x=>[0,2,4,6,8].map(z=><mesh key={`${x}-${z}`} position={[x,0.35,z]}><coneGeometry args={[0.22,0.7,8]}/><meshStandardMaterial color="#ff843d"/></mesh>))}
 <ContactShadows position={[0,0.01,0]} opacity={0.35} scale={65} blur={2.5} far={20}/>
 </>}
export default function Scene(props:{docks:Dock[];selected:number;onSelect:(n:number)=>void;view:number;autoRotate:boolean}){return <Canvas key={props.view} shadows dpr={[1,1.6]} camera={{position:props.view%2===0?[30,30,36]:[0,44,16],fov:43}} gl={{antialias:true}} fallback={<div className="canvas-fallback">WebGL indisponível. Use a lista de docas abaixo para acompanhar a operação.</div>}>
 <color attach="background" args={['#1e252a']}/><fog attach="fog" args={['#1e252a',55,110]}/><ambientLight intensity={1.8}/><hemisphereLight args={['#cfdfed','#414b53',1.8]}/><directionalLight position={[8,25,12]} intensity={3} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}/>
 <Suspense fallback={null}><Warehouse {...props}/></Suspense><OrbitControls makeDefault target={[0,0.5,2]} minDistance={22} maxDistance={68} maxPolarAngle={Math.PI/2.2} autoRotate={props.autoRotate} autoRotateSpeed={0.5}/>
 </Canvas>}
