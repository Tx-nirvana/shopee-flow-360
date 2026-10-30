import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
export default function HelpDialog({onClose,children}:{onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const opener=document.activeElement as HTMLElement|null;const dialog=ref.current;dialog?.showModal();return()=>{dialog?.close();if(opener?.isConnected)opener.focus()}},[]);
 return createPortal(<dialog ref={ref} className="help-modal panel" aria-labelledby="help-title" aria-modal="true" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)onClose()}}>{children}</dialog>,document.body)
}
