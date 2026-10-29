import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import { Group, MathUtils } from 'three'
import type { Dock, Transfer } from './shipping'
export const colors = {Carregando:'#71d6b1',Aguardando:'#eeb65f',Liberada:'#76818e',Atrasada:'#fa725a',Pronta:'#87baff'}
function Box({p,s,c,...props}:{p:[number,number,number];s:[number,number,number];c:string;[key:string]:unknown}){return <mesh position={p} castShadow receiveShadow {...props}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={0.65}/></mesh>}
function Truck({dock,x,selected,onSelect}:{dock:Dock;x:number;selected:boolean;onSelect:()=>void}){
 const ref=useRef<Group>(null); const target=dock.status==='Liberada'?20:1;
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
function MovingParcel({transfer,seconds,running,speed,selected}:{transfer:Transfer;seconds:number;running:boolean;speed:number;selected:number}){
 const ref=useRef<Group>(null),timing=useRef({second:seconds,fraction:0});
 useFrame((_,delta)=>{if(!ref.current)return;if(timing.current.second!==seconds)timing.current={second:seconds,fraction:0};else if(running)timing.current.fraction=Math.min(0.95,timing.current.fraction+delta*speed);
  const u=MathUtils.clamp((seconds+timing.current.fraction-transfer.started)/(transfer.arrives-transfer.started),0,1),x=(transfer.dockId-4.5)*3.65;
  ref.current.position.set(u<0.2?-14:u<0.75?MathUtils.lerp(-14,x,(u-0.2)/0.55):x,1.5,u<0.2?MathUtils.lerp(-13,-9,u/0.2):u<0.75?-9:MathUtils.lerp(-9,-4,(u-0.75)/0.25));
 });
 return <group ref={ref}><Box p={[0,0,0]} s={[0.6,0.65,0.6]} c={transfer.dockId===selected?'#ff874a':'#d4ad7d'}/><Box p={[0,0.33,0]} s={[0.12,0.02,0.6]} c="#f7ddad"/></group>
}
function CounterFlow({docks,selected,onSelect,transfers,seconds,running,speed,counterHeld}:{docks:Dock[];selected:number;onSelect:(n:number)=>void;transfers:Transfer[];seconds:number;running:boolean;speed:number;counterHeld:boolean}){return <>
 <Box p={[-10,0.65,-14]} s={[10,1.3,2.6]} c="#38464f"/><Box p={[-10,1.36,-14]} s={[10.3,0.15,2.8]} c={counterHeld?'#ba5748':'#f07840'}/>
 {[-13,-10,-7].map(x=><group key={x}><Box p={[x,1.9,-14.6]} s={[1.2,0.9,0.12]} c="#21303b"/><Box p={[x,1.9,-14.51]} s={[1,0.7,0.02]} c="#6cb5b5"/><Box p={[x+1,1.75,-14]} s={[0.55,0.65,0.55]} c="#d8ae7c"/></group>)}
 <Html position={[-10,3.5,-14]} center distanceFactor={48}><div className={`counter-sign ${counterHeld?'held':''}`}>01 · BALCÃO DE CONFERÊNCIA<small>{counterHeld?'CONFERÊNCIA ADICIONAL':`${docks.reduce((n,d)=>n+d.pending,0)} VOLUMES PENDENTES`}</small></div></Html>
 <Box p={[-14,1,-11]} s={[1.1,0.25,4.2]} c="#38434b"/><Box p={[0,1,-9]} s={[29,0.25,1.1]} c="#38434b"/>
 {Array.from({length:49},(_,i)=><Box key={i} p={[-14.3+i*0.59,1.15,-9]} s={[0.11,0.08,1]} c="#84939c"/>)}
 <Box p={[-14,1.22,-11]} s={[0.08,0.03,4.2]} c="#ff9c57"/>
 <Box p={[((selected-4.5)*3.65-14)/2,1.23,-9]} s={[(selected-4.5)*3.65+14,0.04,0.1]} c="#ff9c57"/>
 {docks.map(d=>{const x=(d.id-4.5)*3.65;return <group key={d.id}>
  <Box p={[x,1,-6.6]} s={[1.05,0.25,4.8]} c="#38434b"/>
  <Box p={[x,1.17,-6.6]} s={[0.09,0.035,4.8]} c={d.id===selected?'#ff9c57':'#68828e'}/>
  <Box p={[x+1.05,0.12,-6]} s={[0.8,0.24,1.1]} c="#9b7957"/>
  {d.staged>0&&<Box p={[x+1.05,0.6,-6]} s={[0.75,0.75,1]} c={d.id===selected?'#f98a4c':'#b39a7c'}/>}
  <Html position={[x,2,-7]} center distanceFactor={52}><button className={`route-label ${d.id===selected?'selected':''}`} onClick={()=>onSelect(d.id)} aria-label={`Rota do balcão à doca ${d.id}`}>D{String(d.id).padStart(2,'0')} · {d.staged} vol.</button></Html>
 </group>})}
 {transfers.map(t=><MovingParcel key={t.id} transfer={t} seconds={seconds} running={running} speed={speed} selected={selected}/>)}
 </>}
type SceneProps={docks:Dock[];selected:number;onSelect:(n:number)=>void;view:number;autoRotate:boolean;transfers:Transfer[];seconds:number;running:boolean;speed:number;counterHeld:boolean}
function Warehouse(props:SceneProps){const {docks,selected,onSelect}=props;return <>
 <Box p={[0,-0.25,-2]} s={[39,0.5,36]} c="#535c60"/>
 <Box p={[0,2,-18]} s={[32,4,0.3]} c="#69777f"/>
 <Box p={[0,4,-18]} s={[32,0.2,0.5]} c="#f07840"/>
 <CounterFlow {...props}/>
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
export default function Scene(props:SceneProps){return <Canvas key={props.view} shadows dpr={[1,1.6]} camera={{position:props.view%2===0?[32,36,38]:[0,49,8],fov:48}} gl={{antialias:true}} fallback={<div className="canvas-fallback">WebGL indisponível. Use a programação abaixo para acompanhar a operação.</div>}>
 <color attach="background" args={['#1e252a']}/><fog attach="fog" args={['#1e252a',55,110]}/><ambientLight intensity={1.8}/><hemisphereLight args={['#cfdfed','#414b53',1.8]}/><directionalLight position={[8,25,12]} intensity={3} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}/>
 <Suspense fallback={null}><Warehouse {...props}/></Suspense><OrbitControls makeDefault target={[0,0.5,-2]} minDistance={22} maxDistance={78} maxPolarAngle={Math.PI/2.2} autoRotate={props.autoRotate} autoRotateSpeed={0.5}/>
 </Canvas>}
