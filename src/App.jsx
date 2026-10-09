import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
// ── PALETTE (LIGHT / DARK) ──────────────────────────────────────
const LIGHT = {
  bg:     "#F0EBE3",
  card:   "#FFFFFF",
  card2:  "#F5F0E8",
  border: "#E8E0D4",
  gold:   "#A67C3C",
  goldL:  "#C49A3C",
  text:   "#1A1208",
  sub:    "#6B5D4A",
  muted:  "#A89880",
  green:  "#1A7A50",
  red:    "#C04040",
  amber:  "#D4860A",
  blue:   "#3B6FA0",
  cream:  "#F5EDD8",
  navBg:  "#FAF7F2",
};

// Modo oscuro: el marrón oscuro que ya usa la app (antes C.text) pasa a ser el fondo
const DARK = {
  bg:     "#1A1208",
  card:   "#241B10",
  card2:  "#2E2314",
  border: "#3D2F1C",
  gold:   "#C9A15A",
  goldL:  "#D9B876",
  text:   "#F5EFE4",
  sub:    "#C7B9A0",
  muted:  "#8C7C63",
  green:  "#3FA876",
  red:    "#E07A6E",
  amber:  "#E0A542",
  blue:   "#6FA0D8",
  cream:  "#2E2314",
  navBg:  "#150F07",
};

// C es mutable a propósito: como todos los componentes leen C.xxx en cada
// render (no la desestructuran una sola vez), mutar sus valores y forzar
// un re-render alcanza para cambiar el tema en toda la app.
let C = { ...LIGHT };
function setTema(oscuro){ Object.assign(C, oscuro ? DARK : LIGHT); }

// Persistencia local: los datos del usuario sobreviven al cierre de la app.
// Las claves usan la versión v2 para no recuperar datos de demostración de
// versiones anteriores.
function usePersistentState(key, initialValue){
  const [value,setValue]=useState(()=>{
    try{
      const raw=localStorage.getItem(key);
      return raw===null ? (typeof initialValue === "function" ? initialValue() : initialValue) : JSON.parse(raw);
    }catch(_){
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
  });
  useEffect(()=>{
    try{ localStorage.setItem(key,JSON.stringify(value)); }catch(_){}
  },[key,value]);
  return [value,setValue];
}

const IDIOMA_UNICO = "Español";
let CURRENT_LANG = IDIOMA_UNICO;
function translateText(text){ return text; }
const moneyAR = (n) => `$${Math.round(Number(n)||0).toLocaleString("es-AR")}`;
const dateAR = (d=new Date()) => d.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});
const monthStart = (d=new Date()) => new Date(d.getFullYear(),d.getMonth(),1);
const previousMonthStart = (d=new Date()) => new Date(d.getFullYear(),d.getMonth()-1,1);
const inDateRange = (dateStr,start,end) => {
  if(!dateStr) return false;
  const d=parseFechaARSafe(dateStr);
  return d && d>=start && d<end;
};
function parseFechaARSafe(f){
  if(!f) return null;
  const parts=String(f).split("/").map(Number);
  if(parts.length===3 && parts.every(Number.isFinite)){
    const d=new Date(parts[2],parts[1]-1,parts[0]);
    return Number.isNaN(d.getTime())?null:d;
  }
  const d=new Date(f);
  return Number.isNaN(d.getTime())?null:d;
}

// ── ICONS ─────────────────────────────────────────────────────
const P = {
  home:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  orders:  "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  box:     "M12 2l9 4.9V17L12 22 3 17V6.9L12 2zM12 22V12M3 7l9 5 9-5",
  bars:    "M18 20V10M12 20V4M6 20v-6",
  menu:    "M3 12h18M3 6h18M3 18h18",
  settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  plus:    "M12 5v14M5 12h14",
  x:       "M18 6L6 18M6 6l12 12",
  trending:"M23 6l-9.5 9.5-5-5L1 18",
  trendDn: "M23 18l-9.5-9.5-5 5L1 6",
  dollar:  "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  chevR:   "M9 18l6-6-6-6",
  chevL:   "M15 18l-6-6 6-6",
  chevD:   "M6 9l6 6 6-6",
  chevU:   "M6 15l6-6 6 6",
  check:   "M20 6L9 17l-5-5",
  target:  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  star:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  moreV:   "M12 6.5a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM12 13.4a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8zM12 20.3a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z",
  eye:     "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff:  "M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22",
  calendar:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  truck:   "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM17 11V7a5 5 0 0 0-10 0v4",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  file:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  bell:    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  calc:    "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14v4M8 18h4",
  image:   "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  history: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15",
  moon:    "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  help:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bug:     "M8 6h-1a5 5 0 0 0-5 5v1h18v-1a5 5 0 0 0-5-5h-1M12 2a3 3 0 0 0-3 3v1h6V5a3 3 0 0 0-3-3zM3 12v4a6 6 0 0 0 12 0v-4M8 16h8M9 20h6",
  info:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  clock:   "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  tag:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  alert:   "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
};

const Icon = ({n,size=20,color=C.sub,sw=1.6,fill="none"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(P[n]||"").split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}
  </svg>
);

// ── SHARED CONFIG (estado / prioridad / pago) ──────────────────
const ESTADO_CFG = {
  "Pendiente":            { color:C.amber, bg:C.amber+"18" },
  "En preparación":       { color:C.blue,  bg:C.blue+"18"  },
  "Listo para entregar":  { color:C.gold,  bg:C.gold+"18"  },
  "Entregado":            { color:C.green, bg:C.green+"18" },
  "Cancelado":            { color:C.red,   bg:C.red+"18"   },
};

const PRIORIDAD_CFG = {
  "Alta":   { color:C.red,   bg:C.red+"18",   dot:C.red   },
  "Normal": { color:C.amber, bg:C.amber+"18", dot:C.amber },
  "Baja":   { color:C.green, bg:C.green+"18", dot:C.green },
};

const PAGO_CFG = {
  "Sin pagar":       { color:C.red   },
  "Seña entregada":  { color:C.amber },
  "Pago parcial":    { color:C.blue  },
  "Pagado":          { color:C.green },
};

// ── WEEK BARS ─────────────────────────────────────────────────
function WeekBars({data,h=60,color,labels}){
  const [on,setOn]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setOn(true),120);return()=>clearTimeout(t);},[]);
  const max=Math.max(...data.map(d=>d.v),1);
  const dias=labels||["L","M","M","J","V","S","D"];
  const barColor = color||C.gold;
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:h}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:i===data.length-1?barColor:barColor+"55",height:on?`${Math.max((d.v/max)*100,d.v>0?5:0)}%`:"0%",transition:`height .65s cubic-bezier(.34,1.56,.64,1) ${i*55}ms`}}/>
          <span style={{fontSize:9,color:C.muted,fontFamily:"'Inter',sans-serif",letterSpacing:.3}}>{dias[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ── BOTTOM SHEET ──────────────────────────────────────────────
function Sheet({title,onClose,children,fixed=false}){
  return (
    <div style={{position:fixed?"fixed":"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end",zIndex:300,backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:fixed?430:undefined,maxHeight:"92%",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,.15)",animation:"slideUp .22s ease"}}>
        <div style={{padding:"0 20px 36px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"14px auto 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 24px"}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{title}</h3>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:10,background:C.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon n="x" size={15} color={C.muted}/>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── SUB-PAGE ──────────────────────────────────────────────────
function SubPage({title,onBack,children}){
  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100%"}}>
      <div style={{background:C.navBg,borderBottom:`1px solid ${C.border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:C.gold,fontSize:14,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>
          <Icon n="chevL" size={16} color={C.gold}/>{translateText("Volver")}</button>
        <span style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText(title)}</span>
      </div>
      <div style={{flex:1,padding:"18px 18px 100px"}}>
        {children}
      </div>
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────────
function Card({children,style={},onClick}){
  return (
    <div onClick={onClick} style={{background:C.card,borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`1px solid ${C.border}`,...style}}>
      {children}
    </div>
  );
}

// ── LABELS ────────────────────────────────────────────────────
function SLbl({c,style={}}){
  return <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.4,marginBottom:10,fontFamily:"'Montserrat',sans-serif",...style}}>{c}</div>;
}
function FLbl({c}){
  return <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,fontFamily:"'Montserrat',sans-serif"}}>{translateText(c)}</div>;
}

// ── INPUTS ────────────────────────────────────────────────────
function TInput({placeholder,type="text",value,onChange}){
  return (
    <input type={type} placeholder={translateText(placeholder)} value={value||""}
      onChange={e=>onChange&&onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)}
      style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"11px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
  );
}
function Dropdown({value,options,onChange}){
  return (
    <div style={{position:"relative"}}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"11px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",appearance:"none",cursor:"pointer"}}>
        {options.map(o=><option key={o} value={o} style={{background:C.card,color:C.text}}>{o}</option>)}
      </select>
      <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
        <Icon n="chevD" size={16} color={C.muted}/>
      </div>
    </div>
  );
}

// ── TOGGLE ────────────────────────────────────────────────────
function Toggle({on,setOn}){
  return (
    <div onClick={()=>setOn&&setOn(!on)} style={{width:48,height:27,borderRadius:14,background:on?C.gold:"#D0C8BC",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:19,height:19,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.25)"}}/>
    </div>
  );
}

// ── TAB BAR ───────────────────────────────────────────────────
function TabBar({tabs,active,setActive}){
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {tabs.map(t=>(
        <button key={t} onClick={()=>setActive(t)}
          style={{padding:"8px 18px",borderRadius:22,border:`1px solid ${active===t?C.text:C.border}`,background:active===t?C.text:"transparent",color:active===t?"#fff":C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── DASHED EMPTY ──────────────────────────────────────────────
function DashedEmpty({icon,text,onClick}){
  return (
    <div onClick={onClick} style={{border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"52px 20px",textAlign:"center",cursor:onClick?"pointer":"default"}}>
      <Icon n={icon} size={38} color={C.border}/>
      <p style={{color:C.muted,fontSize:15,fontFamily:"'Inter',sans-serif",marginTop:14}}>{translateText(text)}</p>
    </div>
  );
}

// ── OUTLINE BTN ───────────────────────────────────────────────
function OutlineBtn({label,icon,onClick}){
  return (
    <button onClick={onClick} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:22,padding:"9px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:C.text,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:600,whiteSpace:"nowrap",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
      {icon&&<Icon n={icon} size={14} color={C.text}/>} {label}
    </button>
  );
}

// ── PRIMARY BTN ───────────────────────────────────────────────
function PrimaryBtn({label,onClick,disabled}){
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:"100%",padding:"16px",borderRadius:22,border:"none",background:disabled?"#C8BFB0":C.text,color:"#F0EBE3",fontSize:15,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:"'Montserrat',sans-serif",marginTop:8,transition:"background .15s"}}>
      {translateText(label)}
    </button>
  );
}

// ── INICIO ────────────────────────────────────────────────────
function Inicio({setSec,emprendimiento,productos=[],movs=[],pedidos=[]}){
  const hoy=new Date();
  const inicioMes=monthStart(hoy);
  const inicioMesAnt=previousMonthStart(hoy);
  const finMesAnt=inicioMes;
  const finMes=new Date(hoy.getFullYear(),hoy.getMonth()+1,1);
  const ingresosMes=movs.filter(m=>m.tipo==="Ingreso"&&inDateRange(m.fecha,inicioMes,finMes)).reduce((a,m)=>a+(Number(m.monto)||0),0);
  const gastosMes=movs.filter(m=>m.tipo==="Egreso"&&inDateRange(m.fecha,inicioMes,finMes)).reduce((a,m)=>a+(Number(m.monto)||0),0);
  const ganancia=ingresosMes-gastosMes;
  const ingresosAnt=movs.filter(m=>m.tipo==="Ingreso"&&inDateRange(m.fecha,inicioMesAnt,finMesAnt)).reduce((a,m)=>a+(Number(m.monto)||0),0);
  const variacion=ingresosAnt>0?Math.round(((ingresosMes-ingresosAnt)/ingresosAnt)*100):null;
  const pendientes=pedidos.filter(p=>["Pendiente","En preparación","Listo para entregar"].includes(p.estado)).length;
  const bajos=productos.filter(p=>p.alertaActiva!==false&&p.stockInicial<=(p.umbralAlerta||p.stockMinimo)).length;
  const ultimos=movs.filter(m=>m.tipo==="Ingreso").slice(0,5);
  const wd=Array.from({length:7},(_,i)=>{
    const d=new Date(hoy); d.setDate(hoy.getDate()-(6-i));
    const key=d.toLocaleDateString("es-AR");
    return {v:movs.filter(m=>m.tipo==="Ingreso"&&m.fecha===key).reduce((a,m)=>a+(Number(m.monto)||0),0)};
  });
  const diaSemana=["D","L","M","X","J","V","S"];
  const labels=Array.from({length:7},(_,i)=>{const d=new Date(hoy);d.setDate(hoy.getDate()-(6-i));return diaSemana[d.getDay()];});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{paddingTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <h1 style={{fontSize:26,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{emprendimiento?.nombre||"Mi emprendimiento"}</h1>
          <Icon n="edit" size={17} color={C.muted}/>
        </div>
        <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:5}}>{hoy.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>

      <Card style={{padding:"20px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:8}}>{translateText("Ingresos del mes") }</div>
            <div style={{fontSize:38,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif",letterSpacing:-.5,lineHeight:1}}>{moneyAR(ingresosMes)}</div>
            <div style={{fontSize:12,color:variacion===null?C.muted:(variacion>=0?C.green:C.red),marginTop:10,fontFamily:"'Inter',sans-serif",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              {variacion===null?<Icon n="info" size={14} color={C.muted}/>:<Icon n={variacion>=0?"trending":"trendDn"} size={14} color={variacion>=0?C.green:C.red} sw={2}/>} 
              {variacion===null?"Sin datos del mes anterior":`${variacion>=0?"+":""}${variacion}% vs mes anterior`}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:8}}>{translateText("Ganancia") }</div>
            <div style={{fontSize:23,fontWeight:800,color:ganancia>=0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>{moneyAR(ganancia)}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>Gastos {moneyAR(gastosMes)}</div>
          </div>
        </div>
        <WeekBars data={wd} h={60} labels={labels}/>
      </Card>

      {(pendientes>0||bajos>0)&&(
        <div style={{display:"grid",gridTemplateColumns:pendientes>0&&bajos>0?"1fr 1fr":"1fr",gap:10}}>
          {pendientes>0&&<button onClick={()=>setSec("pedidos")} style={{background:C.gold+"12",border:`1px solid ${C.gold}30`,borderRadius:14,padding:"12px 13px",display:"flex",alignItems:"center",gap:9,textAlign:"left",cursor:"pointer"}}><Icon n="orders" size={17} color={C.gold}/><div><div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{pendientes} pedido{pendientes!==1?"s":""}</div><div style={{fontSize:10,color:C.muted}}>pendiente{pendientes!==1?"s":""}</div></div></button>}
          {bajos>0&&<button onClick={()=>setSec("stock")} style={{background:C.red+"10",border:`1px solid ${C.red}30`,borderRadius:14,padding:"12px 13px",display:"flex",alignItems:"center",gap:9,textAlign:"left",cursor:"pointer"}}><Icon n="alert" size={17} color={C.red}/><div><div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{bajos} producto{bajos!==1?"s":""}</div><div style={{fontSize:10,color:C.red}}>requiere{bajos!==1?"n":""} reposición</div></div></button>}
        </div>
      )}

      <div>
        <SLbl c="Acciones rápidas"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:"Nuevo\npedido", icon:"target", sec:"pedidos"},
            {label:"Ver stock", icon:"box", sec:"stock"},
            {label:"Registrar\nventa", icon:"dollar", sec:"finanzas"},
            {label:"Ver finanzas", icon:"bars", sec:"finanzas"},
          ].map(({label,icon,sec})=>(
            <button key={label} onClick={()=>setSec(sec)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"17px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
              <div style={{width:40,height:40,borderRadius:12,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon n={icon} size={19} color={C.muted}/></div>
              <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",lineHeight:1.3,whiteSpace:"pre-line"}}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {ultimos.length>0&&<Card style={{padding:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><SLbl c="Últimas ventas" style={{marginBottom:0}}/><button onClick={()=>setSec("finanzas")} style={{border:"none",background:"none",color:C.gold,fontSize:11,fontWeight:700,cursor:"pointer"}}>{translateText("Ver todo") }</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{ultimos.slice(0,3).map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:10,background:C.green+"12",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="trending" size={15} color={C.green}/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.concepto||"Venta"}</div><div style={{fontSize:10,color:C.muted}}>{m.fecha||""}</div></div><strong style={{fontSize:13,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>+{moneyAR(m.monto)}</strong></div>)}</div>
      </Card>}
    </div>
  );
}

// ── BLOCK (accordion) ────────────────────────────────────────
function Block({icon,title,subtitle,children,defaultOpen=true,badge}){
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
        <div style={{width:36,height:36,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon n={icon} size={17} color={C.sub}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{title}</div>
          {subtitle&&!open&&<div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{subtitle}</div>}
        </div>
        {badge&&<span style={{fontSize:10,fontWeight:700,color:C.gold,background:C.gold+"18",borderRadius:20,padding:"2px 8px",fontFamily:"'Montserrat',sans-serif"}}>{badge}</span>}
        <Icon n={open?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>
      {open&&<div style={{padding:"0 16px 18px",borderTop:`1px solid ${C.border}`}}><div style={{height:14}}/>{children}</div>}
    </div>
  );
}

// ── PILL SELECTOR ─────────────────────────────────────────────
function PillSelect({options,value,onChange,colorMap}){
  return (
    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
      {options.map(o=>{
        const cfg=colorMap?.[o];
        const active=value===o;
        return (
          <button key={o} onClick={()=>onChange(o)} style={{
            padding:"7px 14px",borderRadius:22,border:`1.5px solid ${active?(cfg?.color||C.text):C.border}`,
            background:active?(cfg?.bg||C.text+"15"):"transparent",
            color:active?(cfg?.color||C.text):C.sub,
            fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",transition:"all .15s",
          }}>{o}</button>
        );
      })}
    </div>
  );
}

// ── NUEVO PEDIDO FORM ─────────────────────────────────────────
function NuevoPedidoForm({onClose,onSave}){
  // Cliente
  const [clienteNombre,setClienteNombre]=useState("");
  const [clienteTel,setClienteTel]=useState("");
  const [clienteDir,setClienteDir]=useState("");
  // Productos
  const [items,setItems]=useState([{nombre:"",cantidad:1,precio:0}]);
  const [observaciones,setObservaciones]=useState("");
  // Fechas
  const [fechaEntrega,setFechaEntrega]=useState("");
  const [horario,setHorario]=useState("");
  // Entrega
  const [tipoEntrega,setTipoEntrega]=useState("Retira cliente");
  const [lugarEntrega,setLugarEntrega]=useState("");
  const [notasEntrega,setNotasEntrega]=useState("");
  // Estado
  const [estado,setEstado]=useState("Pendiente");
  // Pago
  const [entregado,setEntregado]=useState(0);
  const [estadoPago,setEstadoPago]=useState("Sin pagar");
  const [metodoPago,setMetodoPago]=useState("Efectivo");
  // Prioridad
  const [prioridad,setPrioridad]=useState("Normal");
  // Etiquetas
  const [etiquetas,setEtiquetas]=useState([]);
  const [guardado,setGuardado]=useState(false);

  const ETIQUETAS_BASE=["Mayorista","Minorista","Personalizado","Regalo"];

  const total=items.reduce((a,it)=>a+(it.precio*it.cantidad),0);
  const saldo=Math.max(0,total-entregado);

  // Auto-update estado de pago
  useEffect(()=>{
    if(total===0||entregado===0) setEstadoPago("Sin pagar");
    else if(entregado>=total) setEstadoPago("Pagado");
    else if(entregado>0&&entregado<total*0.5) setEstadoPago("Seña entregada");
    else setEstadoPago("Pago parcial");
  },[entregado,total]);

  const addItem=()=>setItems(it=>[...it,{nombre:"",cantidad:1,precio:0}]);
  const rmItem=i=>setItems(it=>it.filter((_,j)=>j!==i));
  const upItem=(i,k,v)=>setItems(it=>it.map((x,j)=>j===i?{...x,[k]:v}:x));
  const toggleEtiq=e=>setEtiquetas(es=>es.includes(e)?es.filter(x=>x!==e):[...es,e]);

  const fechaHoy=new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"});

  if(guardado){
    const estCfg=ESTADO_CFG[estado];
    const priCfg=PRIORIDAD_CFG[prioridad];
    const pagCfg=PAGO_CFG[estadoPago];
    return (
      <div style={{padding:"0 0 24px"}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:8}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"#1A7A5018",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
            <Icon n="check" size={26} color={C.green} sw={2.5}/>
          </div>
          <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("¡Pedido creado!") }</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:4}}>{translateText("Resumen del pedido") }</div>
        </div>

        <div style={{background:C.bg,borderRadius:18,padding:"18px 18px",display:"flex",flexDirection:"column",gap:13}}>
          {/* Cliente */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:C.gold+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:16,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{clienteNombre.charAt(0)||"?"}</span>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{clienteNombre||"Sin nombre"}</div>
              {clienteTel&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{clienteTel}</div>}
            </div>
          </div>

          <div style={{height:1,background:C.border}}/>

          {/* Estado + Prioridad */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:estCfg.bg,color:estCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{estado}</span>
            <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif"}}>
              <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:priCfg.dot,marginRight:5}}/>
              {prioridad}
            </span>
            <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:pagCfg.color+"18",color:pagCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{estadoPago}</span>
          </div>

          <div style={{height:1,background:C.border}}/>

          {/* Montos */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["Total","$"+total.toLocaleString("es-AR"),C.text],["Abonado","$"+entregado.toLocaleString("es-AR"),C.green],["Saldo","$"+saldo.toLocaleString("es-AR"),saldo>0?C.red:C.green]].map(([l,v,c])=>(
              <div key={l}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{l}</div>
                <div style={{fontSize:17,fontWeight:800,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{height:1,background:C.border}}/>

          {/* Fechas */}
          {(fechaEntrega||horario)&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Icon n="clock" size={15} color={C.muted}/>
              <span style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif"}}>
                {fechaEntrega}{horario?` · ${horario}`:""}
              </span>
            </div>
          )}

          {/* Entrega */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Icon n="truck" size={15} color={C.muted}/>
            <span style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{tipoEntrega}{lugarEntrega?` · ${lugarEntrega}`:""}</span>
          </div>

          {/* Etiquetas */}
          {etiquetas.length>0&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {etiquetas.map(e=><span key={e} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:C.gold+"15",color:C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>{e}</span>)}
            </div>
          )}
        </div>

        <div style={{marginTop:20}}>
          <PrimaryBtn label={translateText("Listo")} onClick={()=>{onSave&&onSave({clienteNombre,clienteTel,clienteDir,items,observaciones,total,entregado,saldo,estado,prioridad,estadoPago,metodoPago,fechaEntrega,horario,tipoEntrega,lugarEntrega,notasEntrega,etiquetas,fechaCreacion:new Date().toLocaleDateString("es-AR"),horaCreacion:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})});onClose();}}/>
          <button onClick={()=>setGuardado(false)} style={{width:"100%",marginTop:10,padding:"12px",borderRadius:22,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>
            {translateText("Editar pedido") }
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Fecha creación */}
      <div style={{display:"flex",alignItems:"center",gap:6,paddingBottom:2}}>
        <Icon n="clock" size={13} color={C.muted}/>
        <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>Creado hoy, {fechaHoy}</span>
      </div>

      {/* ── 1. CLIENTE ── */}
      <Block icon="user" title={translateText("Cliente")} subtitle={clienteNombre||"Sin cliente"} defaultOpen={true}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><FLbl c="Nombre *"/><TInput placeholder="Nombre del cliente" value={clienteNombre} onChange={setClienteNombre}/></div>
          <div><FLbl c={translateText("Teléfono")}/><TInput placeholder="11-1234-5678" type="tel" value={clienteTel} onChange={setClienteTel}/></div>
          <div><FLbl c={translateText("Dirección")}/><TInput placeholder="Dirección del cliente" value={clienteDir} onChange={setClienteDir}/></div>
          <button style={{alignSelf:"flex-start",background:"none",border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"'Montserrat',sans-serif",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <Icon n="user" size={12} color={C.sub}/> {translateText("Seleccionar cliente guardado") }
          </button>
        </div>
      </Block>

      {/* ── 2. PRODUCTOS ── */}
      <Block icon="box" title={translateText("Productos")} subtitle={`${items.length} ítem${items.length!==1?"s":""} · $${total.toLocaleString("es-AR")}`} badge={items.length>0?`${items.length}`:undefined} defaultOpen={true}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {items.map((it,i)=>(
            <div key={i} style={{background:C.bg,borderRadius:12,padding:"12px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:700,color:C.muted,fontFamily:"'Montserrat',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Producto {i+1}</span>
                {items.length>1&&<button onClick={()=>rmItem(i)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon n="trash" size={13} color={C.red}/></button>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <TInput placeholder="Nombre del producto o servicio" value={it.nombre} onChange={v=>upItem(i,"nombre",v)}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <div>
                    <FLbl c={translateText("Cantidad")}/>
                    <input type="number" min="1" value={it.cantidad} onChange={e=>upItem(i,"cantidad",parseInt(e.target.value)||1)}
                      style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"8px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                  </div>
                  <div>
                    <FLbl c="Precio unit."/>
                    <input type="number" min="0" value={it.precio||""} onChange={e=>upItem(i,"precio",parseFloat(e.target.value)||0)} placeholder="0"
                      style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"8px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                  </div>
                  <div>
                    <FLbl c={translateText("Subtotal")}/>
                    <div style={{padding:"8px 0",fontSize:15,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif",borderBottom:`1.5px solid ${C.border}`}}>${(it.precio*it.cantidad).toLocaleString("es-AR")}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{background:"none",border:`1.5px dashed ${C.border}`,borderRadius:12,padding:"11px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>
            <Icon n="plus" size={14} color={C.sub}/>{translateText("Agregar producto")}</button>
          {total>0&&(
            <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,paddingTop:4}}>
              <span style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Total del pedido") }</span>
              <span style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${total.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div><FLbl c="Observaciones"/><TInput placeholder="Detalles adicionales del pedido" value={observaciones} onChange={setObservaciones}/></div>
        </div>
      </Block>

      {/* ── 3. FECHAS ── */}
      <Block icon="clock" title="Fechas" subtitle={fechaEntrega?`Entrega: ${fechaEntrega}`:"Sin fecha de entrega"} defaultOpen={false}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><FLbl c="Fecha de entrega"/><TInput type="date" value={fechaEntrega} onChange={setFechaEntrega}/></div>
          <div><FLbl c="Horario"/><TInput type="time" value={horario} onChange={setHorario}/></div>
        </div>
      </Block>

      {/* ── 4. ENTREGA ── */}
      <Block icon="truck" title={translateText("Entrega")} subtitle={tipoEntrega} defaultOpen={false}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <FLbl c="Tipo de entrega"/>
            <PillSelect options={["Retira cliente","Entrega a domicilio","Envío"]} value={tipoEntrega} onChange={setTipoEntrega}/>
          </div>
          <div><FLbl c="Lugar o dirección"/><TInput placeholder="Punto de entrega" value={lugarEntrega} onChange={setLugarEntrega}/></div>
          <div><FLbl c="Notas de entrega"/><TInput placeholder="Instrucciones especiales" value={notasEntrega} onChange={setNotasEntrega}/></div>
        </div>
      </Block>

      {/* ── 5. ESTADO ── */}
      <Block icon="alert" title="Estado del pedido" subtitle={estado} defaultOpen={false}>
        <PillSelect options={Object.keys(ESTADO_CFG)} value={estado} onChange={setEstado} colorMap={ESTADO_CFG}/>
        <div style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:ESTADO_CFG[estado].bg,display:"inline-flex",alignItems:"center",gap:7}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:ESTADO_CFG[estado].color}}/>
          <span style={{fontSize:13,fontWeight:700,color:ESTADO_CFG[estado].color,fontFamily:"'Montserrat',sans-serif"}}>{estado}</span>
        </div>
      </Block>

      {/* ── 6. PAGO ── */}
      <Block icon="dollar" title={translateText("Pago")} subtitle={`$${total.toLocaleString("es-AR")} · ${estadoPago}`} defaultOpen={true}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Resumen montos */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div style={{background:C.bg,borderRadius:10,padding:"10px 10px"}}>
              <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{translateText("Total")}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${total.toLocaleString("es-AR")}</div>
            </div>
            <div style={{background:C.bg,borderRadius:10,padding:"10px 10px"}}>
              <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{translateText("Abonado") }</div>
              <input type="number" min="0" value={entregado||""} onChange={e=>setEntregado(parseFloat(e.target.value)||0)} placeholder="0"
                style={{width:"100%",background:"transparent",border:"none",fontSize:18,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif",outline:"none",padding:0}}/>
            </div>
            <div style={{background:saldo>0?"#C0404010":"#1A7A5010",borderRadius:10,padding:"10px 10px"}}>
              <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{translateText("Saldo") }</div>
              <div style={{fontSize:18,fontWeight:800,color:saldo>0?C.red:C.green,fontFamily:"'Montserrat',sans-serif"}}>${saldo.toLocaleString("es-AR")}</div>
            </div>
          </div>
          {/* Estado pago auto */}
          <div>
            <FLbl c="Estado de pago (automático)"/>
            <div style={{padding:"9px 14px",borderRadius:10,background:PAGO_CFG[estadoPago].color+"18",display:"inline-flex",alignItems:"center",gap:7,marginBottom:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:PAGO_CFG[estadoPago].color}}/>
              <span style={{fontSize:13,fontWeight:700,color:PAGO_CFG[estadoPago].color,fontFamily:"'Montserrat',sans-serif"}}>{estadoPago}</span>
            </div>
            <PillSelect options={Object.keys(PAGO_CFG)} value={estadoPago} onChange={setEstadoPago} colorMap={Object.fromEntries(Object.entries(PAGO_CFG).map(([k,v])=>[k,{color:v.color,bg:v.color+"18"}]))}/>
          </div>
          <div>
            <FLbl c={translateText("Método de pago")}/>
            <PillSelect options={["Efectivo","Transferencia","Mercado Pago","Tarjeta","Otro"]} value={metodoPago} onChange={setMetodoPago}/>
          </div>
        </div>
      </Block>

      {/* ── 7. COMPROBANTES ── */}
      <Block icon="image" title="Comprobantes" subtitle="Adjuntar archivos" defaultOpen={false}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button style={{background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:C.sub}}>
            <Icon n="image" size={18} color={C.gold}/>
            <span style={{fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:600,color:C.gold}}>Subir comprobante de pago</span>
          </button>
          <button style={{background:C.bg,border:`1.5px dashed ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icon n="image" size={18} color={C.sub}/>
            <span style={{fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:600,color:C.sub}}>Adjuntar imagen de referencia</span>
          </button>
        </div>
      </Block>

      {/* ── 8. PRIORIDAD ── */}
      <Block icon="alert" title={translateText("Prioridad")} subtitle={prioridad} defaultOpen={false}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <PillSelect options={["Alta","Normal","Baja"]} value={prioridad} onChange={setPrioridad} colorMap={PRIORIDAD_CFG}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:PRIORIDAD_CFG[prioridad].dot}}/>
            <span style={{fontSize:13,fontWeight:600,color:PRIORIDAD_CFG[prioridad].color,fontFamily:"'Montserrat',sans-serif"}}>Prioridad {prioridad}</span>
          </div>
        </div>
      </Block>

      {/* ── 9. ETIQUETAS ── */}
      <Block icon="tag" title="Etiquetas" subtitle={etiquetas.length>0?etiquetas.join(", "):"Sin etiquetas"} defaultOpen={false}>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {ETIQUETAS_BASE.map(e=>{
            const on=etiquetas.includes(e);
            return (
              <button key={e} onClick={()=>toggleEtiq(e)} style={{padding:"7px 14px",borderRadius:22,border:`1.5px solid ${on?C.gold:C.border}`,background:on?C.gold+"18":"transparent",color:on?C.gold:C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                {on&&<span style={{marginRight:4}}>✓</span>}{e}
              </button>
            );
          })}
        </div>
      </Block>

      {/* Alertas automáticas */}
      {fechaEntrega&&(
        <div style={{background:"#D4860A12",border:"1px solid #D4860A30",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}>
          <Icon n="alert" size={15} color="#D4860A"/>
          <span style={{fontSize:12,color:"#8A5A00",fontFamily:"'Inter',sans-serif",fontWeight:500}}>Entrega programada: {fechaEntrega}{horario?` a las ${horario}`:""}</span>
        </div>
      )}
      {saldo>0&&total>0&&(
        <div style={{background:"#C0404012",border:"1px solid #C0404030",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}>
          <Icon n="alert" size={15} color={C.red}/>
          <span style={{fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",fontWeight:500}}>Saldo pendiente: ${saldo.toLocaleString("es-AR")}</span>
        </div>
      )}

      <PrimaryBtn label="Crear pedido" onClick={()=>setGuardado(true)} disabled={!clienteNombre}/>
    </div>
  );
}

function PedidoDetalle({pedido,onClose}){
  const p = pedido;
  const estCfg = ESTADO_CFG[p.estado]||ESTADO_CFG.Pendiente;
  const priCfg = PRIORIDAD_CFG[p.prioridad]||PRIORIDAD_CFG.Normal;
  const pagCfg = PAGO_CFG[p.estadoPago]||PAGO_CFG["Sin pagar"];
  return (
    <Sheet title={p.clienteNombre||"Pedido"} onClose={onClose}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:estCfg.bg,color:estCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{p.estado}</span>
          <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{p.prioridad}</span>
          <span style={{fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20,background:pagCfg.color+"18",color:pagCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{p.estadoPago}</span>
        </div>

        <div>
          <SLbl c={translateText("Cliente")}/>
          <div style={{background:C.bg,borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.clienteNombre}</div>
            {p.clienteTel&&<div style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{p.clienteTel}</div>}
            {p.clienteDir&&<div style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{p.clienteDir}</div>}
          </div>
        </div>

        <div>
          <SLbl c={translateText("Productos")}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(p.items||[]).filter(it=>it.nombre).map((it,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",background:C.bg,borderRadius:10,padding:"8px 12px"}}>
                <span style={{fontSize:12,color:C.text,fontFamily:"'Inter',sans-serif"}}>{it.cantidad}x {it.nombre}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${(it.precio*it.cantidad).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
          {p.observaciones&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:8}}>"{p.observaciones}"</div>}
        </div>

        <div>
          <SLbl c={translateText("Pago")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[["Total","$"+p.total.toLocaleString("es-AR"),C.text],["Abonado","$"+(p.entregado||0).toLocaleString("es-AR"),C.green],["Saldo","$"+p.saldo.toLocaleString("es-AR"),p.saldo>0?C.red:C.green]].map(([l,v,c])=>(
              <div key={l} style={{background:C.bg,borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{l}</div>
                <div style={{fontSize:14,fontWeight:800,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
              </div>
            ))}
          </div>
          {p.metodoPago&&<div style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif",marginTop:8}}>Método: {p.metodoPago}</div>}
        </div>

        {(p.fechaEntrega||p.horario)&&(
          <div>
            <SLbl c="Fechas"/>
            <div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}>
              <Icon n="clock" size={14} color={C.muted}/> {p.fechaEntrega}{p.horario?` · ${p.horario}`:""}
            </div>
          </div>
        )}

        <div>
          <SLbl c={translateText("Entrega")}/>
          <div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}>
            <Icon n="truck" size={14} color={C.muted}/> {p.tipoEntrega||"Retira cliente"}{p.lugarEntrega?` · ${p.lugarEntrega}`:""}
          </div>
          {p.notasEntrega&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:4}}>{p.notasEntrega}</div>}
        </div>

        {p.etiquetas&&p.etiquetas.length>0&&(
          <div>
            <SLbl c="Etiquetas"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {p.etiquetas.map(e=><span key={e} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:C.gold+"15",color:C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>{e}</span>)}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ── PEDIDOS SCREEN ────────────────────────────────────────────
function Pedidos({pedidos,setPedidos}){
  const [modal,setModal]=useState(false);
  const [filtro,setFiltro]=useState("Todos");
  const [detalle,setDetalle]=useState(null);

  const FILTROS=["Todos","Pendiente","En preparación","Listo para entregar","Entregado","Cancelado"];
  const visibles = filtro==="Todos" ? pedidos : pedidos.filter(p=>p.estado===filtro);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingTop:4}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Pedidos")}</h1>
          <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{pedidos.length} pedidos</p>
        </div>
        <OutlineBtn label={translateText("Nuevo")} icon="plus" onClick={()=>setModal(true)}/>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4}}>
        {FILTROS.map(f=>{
          const active=filtro===f;
          const cfg=ESTADO_CFG[f];
          return (
            <button key={f} onClick={()=>setFiltro(f)} style={{flexShrink:0,padding:"7px 16px",borderRadius:22,border:`1px solid ${active?(cfg?.color||C.text):C.border}`,background:active?(cfg?.bg||C.text+"10"):"transparent",color:active?(cfg?.color||C.text):C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {f}
            </button>
          );
        })}
      </div>

      {visibles.length===0?(
        <div style={{border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"52px 20px",textAlign:"center",cursor:"pointer"}} onClick={()=>setModal(true)}>
          <Icon n="orders" size={40} color={C.border}/>
          <p style={{color:C.muted,fontSize:15,fontFamily:"'Inter',sans-serif",marginTop:14}}>{translateText("No hay pedidos") }</p>
          <p style={{color:C.gold,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,marginTop:6}}>{translateText("+ Crear primer pedido") }</p>
        </div>
      ):visibles.map((p,i)=>{
        const estCfg=ESTADO_CFG[p.estado];
        const priCfg=PRIORIDAD_CFG[p.prioridad];
        return (
          <div key={i} onClick={()=>setDetalle(p)} style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.clienteNombre}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{p.items.map(it=>it.nombre).filter(Boolean).join(", ")||"Sin productos"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${p.total.toLocaleString("es-AR")}</div>
                {p.saldo>0&&<div style={{fontSize:10,color:C.red,fontFamily:"'Montserrat',sans-serif",fontWeight:700,marginTop:2}}>Saldo ${p.saldo.toLocaleString("es-AR")}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:estCfg.bg,color:estCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{p.estado}</span>
              <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif"}}>
                <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:priCfg.dot,marginRight:4}}/>
                {p.prioridad}
              </span>
              {p.fechaEntrega&&<span style={{fontSize:10,color:C.sub,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:3}}><Icon n="clock" size={10} color={C.muted}/>{p.fechaEntrega}</span>}
            </div>
          </div>
        );
      })}

      {detalle&&<PedidoDetalle pedido={detalle} onClose={()=>setDetalle(null)}/>}

      {modal&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end",zIndex:300,backdropFilter:"blur(4px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(false);}}>
          <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"95%",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,.15)",animation:"slideUp .22s ease"}}>
            <div style={{padding:"0 18px 32px"}}>
              <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"14px auto 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"18px 0 20px"}}>
                <div>
                  <h3 style={{margin:0,fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Nuevo pedido")}</h3>
                  <p style={{margin:"3px 0 0",fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Completá los datos del pedido") }</p>
                </div>
                <button onClick={()=>setModal(false)} style={{width:34,height:34,borderRadius:10,background:C.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon n="x" size={15} color={C.muted}/>
                </button>
              </div>
              <NuevoPedidoForm onClose={()=>setModal(false)} onSave={(p)=>{if(p)setPedidos(ps=>[p,...ps]);}}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMPRENDIMIENTO DROPDOWN ─────────────────────────────────────
function EmpDrop({emprendimientos,empActualId,onSelect,onNuevo,onClose}){
  return (
    <div style={{position:"absolute",top:58,right:18,zIndex:400,minWidth:260}}>
      <div style={{background:C.card,borderRadius:18,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.18)"}}>
        {emprendimientos.map(emp=>(
          <button key={emp.id} onClick={()=>onSelect(emp.id)} style={{width:"100%",padding:"14px 18px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.border}`,background:emp.id===empActualId?C.bg:"transparent",borderTop:"none",borderLeft:"none",borderRight:"none",cursor:"pointer",textAlign:"left"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:C.gold+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:13,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{emp.nombre.charAt(0).toUpperCase()}</span>
            </div>
            <span style={{flex:1,fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{emp.nombre}</span>
            {emp.id===empActualId&&<Icon n="check" size={16} color={C.gold} sw={2.5}/>}
          </button>
        ))}
        <button onClick={onNuevo} style={{width:"100%",padding:"16px 18px",background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <Icon n="plus" size={18} color={C.gold}/>
          <span style={{fontSize:16,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Nuevo emprendimiento")}</span>
        </button>
      </div>
    </div>
  );
}

// ── ONBOARDING: NUEVO EMPRENDIMIENTO ────────────────────────────
const RUBROS_SUGERIDOS = ["Indumentaria","Accesorios","Alimentos","Repostería","Belleza","Hogar","Arte y manualidades","Tecnología","Servicios","Otro"];

const ILU_STROKE_W = "2.6";
function IlustracionBase({src,alt}){
  return (
    <div style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",margin:"18px 0 22px",height:230,overflow:"hidden"}}>
      <img src={src} alt={alt||""} style={{width:"100%",height:"100%",objectFit:"contain",display:"block",borderRadius:18}}/>
    </div>
  );
}

// Ilustraciones del onboarding, integradas con la paleta cálida de Emprender.
function IlustracionNegocio(){
  return <IlustracionBase src="/assets/onboarding-negocio.png" alt="Ilustración de un pequeño negocio"/>;
}

function IlustracionPerfil(){
  return <IlustracionBase src="/assets/onboarding-objetivos.png" alt="Ilustración de objetivos del emprendimiento"/>;
}

function IlustracionProducto(){
  return <IlustracionBase src="/assets/onboarding-nombre.png" alt="Ilustración para personalizar el emprendimiento"/>;
}

function BoxField({placeholder,value,onChange,chevron,onChevron}){
  return (
    <div style={{position:"relative"}}>
      <input placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:chevron?"15px 44px 15px 16px":"15px 16px",fontSize:16,color:C.text,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
      {chevron&&(
        <button onClick={onChevron} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:4}}>
          <Icon n="chevD" size={18} color={C.muted}/>
        </button>
      )}
    </div>
  );
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);function WelcomeEmprender({onLogin,onRegister}){
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:850,overflow:"hidden",fontFamily:"'Inter',sans-serif",color:C.text}}>
      {/* Decorative warm shapes, matching the reference */}
      <div style={{position:"absolute",top:-155,right:-105,width:350,height:350,borderRadius:"50%",background:C.gold,opacity:.92}}/>
      <div style={{position:"absolute",bottom:-185,left:-145,width:420,height:300,borderRadius:"52% 52% 0 0",background:C.goldL,opacity:.88,transform:"rotate(8deg)"}}/>
      <div style={{position:"absolute",bottom:-150,left:-90,width:430,height:250,borderRadius:"50%",border:`1px solid ${C.gold}70`,transform:"rotate(8deg)"}}/>

      <div style={{position:"relative",zIndex:2,minHeight:"100%",maxWidth:430,margin:"0 auto",padding:"54px 28px 30px",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",paddingTop:8}}>
          <div style={{textAlign:"center"}}>
            <img src="/logo-emprender.png" alt="Emprender" style={{width:150,height:150,objectFit:"contain",display:"block",margin:"0 auto 18px"}}/>
            <div style={{fontSize:41,fontWeight:900,letterSpacing:-2.1,lineHeight:1,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>Emprender</div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:3.4,color:C.gold,fontFamily:"'Montserrat',sans-serif",marginTop:9}}>TU NEGOCIO, EN ORDEN.</div>
          </div>
        </div>

        <div style={{marginTop:"auto",paddingBottom:18}}>
          <div style={{width:78,height:4,borderRadius:4,background:C.gold,marginBottom:24}}/>
          <div style={{fontSize:22,fontWeight:500,color:C.text,fontFamily:"'Montserrat',sans-serif",lineHeight:1.12}}>Todo tu</div>
          <div style={{fontSize:36,fontWeight:900,color:C.text,fontFamily:"'Montserrat',sans-serif",lineHeight:1.08,letterSpacing:-1.5}}>emprendimiento,</div>
          <div style={{fontSize:36,fontWeight:900,color:C.text,fontFamily:"'Montserrat',sans-serif",lineHeight:1.08,letterSpacing:-1.5}}>en un solo lugar.</div>
          <p style={{fontSize:14,color:C.sub,lineHeight:1.55,margin:"22px 0 25px",maxWidth:360,fontFamily:"'Inter',sans-serif"}}>Organizá tus ventas, stock, finanzas, pedidos y metas de forma simple.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <button onClick={onLogin} style={{minHeight:54,padding:"13px 12px",borderRadius:28,border:`1.5px solid ${C.text}`,background:C.text,color:"#fff",fontSize:14,fontWeight:800,fontFamily:"'Montserrat',sans-serif",cursor:"pointer"}}>Iniciar sesión <span style={{fontSize:20,verticalAlign:-1,marginLeft:5}}>→</span></button>
            <button onClick={onRegister} style={{minHeight:54,padding:"13px 12px",borderRadius:28,border:`1.5px solid ${C.text}`,background:"transparent",color:C.text,fontSize:14,fontWeight:800,fontFamily:"'Montserrat',sans-serif",cursor:"pointer"}}>Crear cuenta <span style={{fontSize:20,verticalAlign:-1,marginLeft:5,color:C.gold}}>→</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectorIdiomaInicial({idioma,onClose}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(20,14,8,.42)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(5px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:C.card,borderRadius:"26px 26px 0 0",padding:"10px 22px calc(env(safe-area-inset-bottom,0px) + 28px)",boxSizing:"border-box",boxShadow:"0 -8px 36px rgba(0,0,0,.18)"}}>
        <div style={{width:38,height:4,borderRadius:4,background:C.border,margin:"4px auto 22px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div><div style={{fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>Idioma</div><div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:3}}>Idioma disponible de la aplicación</div></div>
          <div style={{width:38,height:38,borderRadius:12,background:C.gold+"15",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="settings" size={18} color={C.gold}/></div>
        </div>
        <div style={{width:"100%",padding:"14px 15px",borderRadius:15,border:`1.5px solid ${C.gold}`,background:C.gold+"12",display:"flex",alignItems:"center",gap:12,boxSizing:"border-box"}}>
          <span style={{fontSize:20}}>ES</span><span style={{flex:1,fontSize:14,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>Español</span><Icon n="check" size={17} color={C.gold}/>
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:12,padding:"12px",border:"none",background:"transparent",color:C.sub,fontSize:13,fontWeight:700,fontFamily:"'Montserrat',sans-serif",cursor:"pointer"}}>Cerrar</button>
      </div>
    </div>
  );
}

function OnboardingEmprendimiento({onClose,onFinish}){
  const [step,setStep]=useState(0),[nombre,setNombre]=useState(""),[persona,setPersona]=useState(""),[rubro,setRubro]=useState(""),[showRubros,setShowRubros]=useState(false),[idiomaOpen,setIdiomaOpen]=useState(false);
  const preguntas=[
    {label:"¿Cómo se llama tu emprendimiento?",sub:"Así vamos a llamar a tu negocio dentro de la app.",campo:"Nombre del emprendimiento",placeholder:"Ej: Dulce Hogar",value:nombre,onChange:setNombre},
    {label:"¿Cómo te gustaría que te llamemos?",sub:"Usamos este nombre para hacer la experiencia más personal.",campo:"Tu nombre",placeholder:"Ej: Sofía",value:persona,onChange:setPersona},
    {label:"¿A qué se dedica tu emprendimiento?",sub:"Contanos cuál es la categoría principal de tu negocio.",campo:"Rubro de tu emprendimiento",placeholder:"Ej: Accesorios",value:rubro,onChange:setRubro}
  ];
  const actual=preguntas[step], esUltimo=step===2, esRubro=step===2;
  const siguiente=()=>esUltimo?onFinish&&onFinish({nombre,persona,rubro}):setStep(s=>s+1);
  const volver=()=>step===0?onClose&&onClose():setStep(s=>s-1);
  return <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column",overflowY:"auto",color:C.text}}>
    <div style={{padding:"18px 18px 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <button onClick={volver} aria-label="Volver" style={{width:50,height:50,borderRadius:18,background:C.card,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 5px 18px rgba(58,43,24,.06)"}}><Icon n="chevL" size={22} color={C.sub}/></button>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:15,color:C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:800,letterSpacing:.7}}>{step+1} / 3</span><button onClick={()=>setIdiomaOpen(true)} aria-label="Idioma" style={{width:50,height:50,borderRadius:18,background:C.card,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 5px 18px rgba(58,43,24,.06)"}}><Icon n="settings" size={22} color={C.text}/></button></div>
    </div>
    <div style={{display:"flex",gap:14,padding:"0 18px 12px",flexShrink:0}}>{preguntas.map((_,i)=><div key={i} style={{flex:1,height:8,borderRadius:8,background:i<=step?C.gold:C.border,transition:"background .2s"}}/>)}</div>

    <div style={{flex:1,padding:"56px 28px 0",maxWidth:430,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <div style={{width:78,height:78,borderRadius:25,background:C.text,color:C.goldL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:25,fontWeight:900,fontFamily:"'Montserrat',sans-serif",boxShadow:"0 8px 18px rgba(26,18,8,.12)"}}>0{step+1}</div>
        <div style={{height:1,flex:1,background:C.border}}/>
        <div style={{fontSize:11,color:C.gold,fontWeight:800,letterSpacing:2.2,fontFamily:"'Montserrat',sans-serif",whiteSpace:"nowrap"}}>VAMOS A CONFIGURARLO</div>
      </div>
      <h2 style={{fontSize:35,fontWeight:900,color:C.text,fontFamily:"'Montserrat',sans-serif",margin:"0 0 13px",lineHeight:1.05,letterSpacing:-1.5}}>{actual.label}</h2>
      <p style={{fontSize:16,color:C.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5,margin:"0 0 30px",maxWidth:380}}>{actual.sub}</p>

      <div style={{background:C.card,border:"none",borderRadius:28,padding:"27px 30px 30px",boxShadow:"0 10px 28px rgba(58,43,24,.07)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div style={{fontSize:15,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{actual.campo}</div><div style={{width:16,height:16,borderRadius:"50%",background:C.gold}}/></div>
        <BoxField placeholder={actual.placeholder} value={actual.value} onChange={actual.onChange} chevron={esRubro} onChevron={()=>setShowRubros(s=>!s)}/>
        {esRubro&&showRubros&&<div style={{marginTop:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:8,display:"flex",flexDirection:"column",gap:2,maxHeight:220,overflowY:"auto"}}>{RUBROS_SUGERIDOS.map(r=><button key={r} onClick={()=>{setRubro(r);setShowRubros(false)}} style={{background:"none",border:"none",borderRadius:10,padding:"10px 12px",textAlign:"left",cursor:"pointer",fontSize:14,color:C.text,fontFamily:"'Inter',sans-serif"}}>{r}</button>)}</div>}
      </div>
      <div style={{marginTop:18,padding:"16px 18px",borderRadius:20,background:C.gold+"0B",border:`1px solid ${C.gold}20`,display:"flex",alignItems:"flex-start",gap:11}}><Icon n="info" size={17} color={C.gold}/><span style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>{esRubro?"Podés escribir una categoría o elegir la que más se acerque.":"Podés cambiarlo más adelante desde Configuración."}</span></div>
    </div>

    <div style={{padding:"24px 28px calc(env(safe-area-inset-bottom,0px) + 26px)",maxWidth:430,margin:"0 auto",width:"100%",boxSizing:"border-box",flexShrink:0}}>
      {step>0&&<button onClick={volver} style={{width:"100%",padding:"15px",borderRadius:28,border:`1.5px solid ${C.border}`,background:"transparent",color:C.text,fontSize:14,fontWeight:700,fontFamily:"'Montserrat',sans-serif",marginBottom:10}}>Volver</button>}
      <PrimaryBtn label={esUltimo?"Finalizar":"Continuar"} disabled={!actual.value} onClick={siguiente}/>
    </div>
    {idiomaOpen&&<SelectorIdiomaInicial idioma={IDIOMA_UNICO} onClose={()=>setIdiomaOpen(false)}/>} 
  </div>;
}

// ── STOCK COLOR HELPER ────────────────────────────────────────
const getStockStatus = (actual, minimo) => {
  if (actual <= 0)              return { label:"Agotado",           color:"#C04040", bg:"#C0404018", dot:"#C04040" };
  if (actual <= minimo)         return { label:"Reposición urgente",color:"#C04040", bg:"#C0404012", dot:"#C04040" };
  if (actual <= minimo * 1.5)   return { label:"Stock bajo",        color:"#D4860A", bg:"#D4860A12", dot:"#D4860A" };
  return                               { label:"Stock correcto",    color:"#1A7A50", bg:"#1A7A5012", dot:"#1A7A50" };
};

// ── NUEVO PRODUCTO FORM ───────────────────────────────────────
function NuevoProductoForm({ onClose, onSave }) {
  const [nombre,        setNombre]        = useState("");
  const [stockInicial,  setStockInicial]  = useState(0);
  const [stockMinimo,   setStockMinimo]   = useState(3);
  const [categoria,     setCategoria]     = useState("");
  const [descripcion,   setDescripcion]   = useState("");
  const [costo,         setCosto]         = useState(0);
  const [precioVenta,   setPrecioVenta]   = useState(0);
  const [unidad,        setUnidad]        = useState("Unidad");
  const [alertaActiva,  setAlertaActiva]  = useState(true);
  const [umbralAlerta,  setUmbralAlerta]  = useState(0);
  const [notifPush,     setNotifPush]     = useState(false);
  const [prioridadAlerta,setPrioridadAlerta]=useState("Media");
  const [proveedor,     setProveedor]     = useState("");
  const [tiempoReposicion,setTiempoReposicion]=useState("1 semana");
  const [codigoInterno, setCodigoInterno] = useState("");
  const [ubicacion,     setUbicacion]     = useState("Local");
  const [masOpciones,   setMasOpciones]   = useState(false);
  const [guardado,      setGuardado]      = useState(false);

  const margen = costo > 0 && precioVenta > 0
    ? Math.round(((precioVenta - costo) / precioVenta) * 100)
    : null;

  const status = getStockStatus(stockInicial, stockMinimo);

  const UNIDADES   = ["Unidad","Kg","Gramos","Litros","Metros","Paquetes","Cajas","Personalizada"];
  const TIEMPOS    = ["1 día","3 días","1 semana","Personalizado"];
  const UBICACIONES= ["Local","Depósito","Estante","Personalizada"];
  const PRIORIDADES= ["Baja","Media","Alta"];
  const PRI_COLOR  = { Baja:C.green, Media:C.amber, Alta:C.red };

  const handleSave = () => {
    if (!nombre) return;
    const prod = {
      nombre, stockInicial, stockMinimo, categoria, descripcion,
      costo, precioVenta, unidad, alertaActiva, umbralAlerta:umbralAlerta||stockMinimo, notifPush, prioridadAlerta,
      proveedor, tiempoReposicion, codigoInterno, ubicacion,
      historial: [{ tipo:"Ingreso inicial", cantidad: stockInicial, fecha: new Date().toLocaleDateString("es-AR"), hora: new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}) }],
      vendidos: 0,
    };
    onSave && onSave(prod);
    setGuardado(true);
  };

  if (guardado) {
    return (
      <div style={{paddingBottom:8}}>
        <div style={{textAlign:"center",marginBottom:22,paddingTop:4}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"#1A7A5018",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
            <Icon n="check" size={26} color={C.green} sw={2.5}/>
          </div>
          <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("¡Producto agregado!") }</div>
        </div>
        <div style={{background:C.bg,borderRadius:16,padding:"16px 16px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{nombre}</div>
              {categoria&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{categoria}</div>}
            </div>
            <span style={{fontSize:11,fontWeight:700,padding:"4px 11px",borderRadius:20,background:status.bg,color:status.color,fontFamily:"'Montserrat',sans-serif"}}>{status.label}</span>
          </div>
          <div style={{height:1,background:C.border}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["Stock",stockInicial+" "+unidad,C.text],["Mínimo",stockMinimo+" "+unidad,C.amber],["Margen",margen!=null?margen+"%":"—",C.green]].map(([l,v,co])=>(
              <div key={l}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{l}</div>
                <div style={{fontSize:16,fontWeight:800,color:co,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
              </div>
            ))}
          </div>
          {precioVenta>0&&<div style={{display:"flex",gap:10}}>
            {costo>0&&<div style={{flex:1,background:C.card,borderRadius:10,padding:"8px 12px"}}><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{translateText("Costo")}</div><div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${costo.toLocaleString("es-AR")}</div></div>}
            <div style={{flex:1,background:C.card,borderRadius:10,padding:"8px 12px"}}><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{translateText("Venta") }</div><div style={{fontSize:15,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>${precioVenta.toLocaleString("es-AR")}</div></div>
          </div>}
          {alertaActiva&&<div style={{background:PRI_COLOR[prioridadAlerta]+"15",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:7}}>
            <Icon n="bell" size={13} color={PRI_COLOR[prioridadAlerta]}/>
            <span style={{fontSize:12,color:PRI_COLOR[prioridadAlerta],fontFamily:"'Inter',sans-serif",fontWeight:600}}>Alerta activa · Prioridad {prioridadAlerta} · Aviso bajo {umbralAlerta||stockMinimo} {unidad.toLowerCase()}{notifPush?" · Push activado":""}</span>
          </div>}
        </div>
        <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:10}}>
          <PrimaryBtn label={translateText("Listo")} onClick={()=>{onClose&&onClose();}}/>
          <button onClick={()=>setGuardado(false)} style={{width:"100%",padding:"12px",borderRadius:22,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:14,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>{translateText("Editar producto") }</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.gold}}/>
          <span style={{fontSize:11,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif",textTransform:"uppercase",letterSpacing:1}}>{translateText("Datos básicos") }</span>
        </div>

        <button style={{width:"100%",height:80,border:`1.5px dashed ${C.border}`,borderRadius:12,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:18}}>
          <Icon n="image" size={20} color={C.muted}/>
          <span style={{fontSize:13,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>Agregar foto del producto</span>
        </button>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <FLbl c="Nombre del producto *"/>
            <TInput placeholder="Ej: Jabón lavanda 100g" value={nombre} onChange={setNombre}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <FLbl c="Stock inicial *"/>
              <TInput type="number" placeholder="0" value={stockInicial||""} onChange={setStockInicial}/>
            </div>
            <div>
              <FLbl c="Stock mínimo *"/>
              <TInput type="number" placeholder="3" value={stockMinimo||""} onChange={setStockMinimo}/>
            </div>
          </div>

          {stockInicial >= 0 && stockMinimo > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:10,background:status.bg}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:status.dot,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:status.color,fontFamily:"'Montserrat',sans-serif"}}>{status.label}</span>
              <span style={{fontSize:11,color:status.color,fontFamily:"'Inter',sans-serif",opacity:.8}}>con {stockInicial} {unidad.toLowerCase()}</span>
            </div>
          )}

          <div>
            <FLbl c="Unidad de medida"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
              {UNIDADES.map(u=>(
                <button key={u} onClick={()=>setUnidad(u)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${unidad===u?C.text:C.border}`,background:unidad===u?C.text:"transparent",color:unidad===u?"#fff":C.sub,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Block icon="dollar" title="Precios" subtitle={precioVenta>0?`Venta $${precioVenta.toLocaleString("es-AR")}${margen!=null?` · ${margen}% margen`:""}`: "Sin precio definido"} defaultOpen={false}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><FLbl c="Costo unitario"/><TInput type="number" placeholder="0" value={costo||""} onChange={setCosto}/></div>
            <div><FLbl c={translateText("Precio de venta")}/><TInput type="number" placeholder="0" value={precioVenta||""} onChange={setPrecioVenta}/></div>
          </div>
          {margen !== null && (
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,background:C.bg,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{translateText("Margen")}</div>
                <div style={{fontSize:22,fontWeight:800,color:margen>0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>{margen}%</div>
              </div>
              <div style={{flex:1,background:C.bg,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{translateText("Ganancia unit.") }</div>
                <div style={{fontSize:22,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>${(precioVenta-costo).toLocaleString("es-AR")}</div>
              </div>
            </div>
          )}
        </div>
      </Block>

      <Block icon="bell" title="Alertas de reposición" subtitle={alertaActiva?`Activa · Prioridad ${prioridadAlerta}`:"Sin alertas"} defaultOpen={true}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{translateText("Alerta de stock bajo") }</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{translateText("Aviso cuando llegue al mínimo") }</div>
            </div>
            <Toggle on={alertaActiva} setOn={setAlertaActiva}/>
          </div>

          {alertaActiva && (
            <>
              <div>
                <FLbl c="Cantidad mínima personalizada para el aviso"/>
                <TInput type="number" placeholder={String(stockMinimo)} value={umbralAlerta||""} onChange={setUmbralAlerta}/>
                <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:4}}>Si lo dejás vacío, se usa el stock mínimo ({stockMinimo})</div>
              </div>
              <div>
                <FLbl c="Prioridad de la alerta"/>
                <div style={{display:"flex",gap:8}}>
                  {PRIORIDADES.map(p=>(
                    <button key={p} onClick={()=>setPrioridadAlerta(p)} style={{flex:1,padding:"9px 0",borderRadius:12,border:`1.5px solid ${prioridadAlerta===p?PRI_COLOR[p]:C.border}`,background:prioridadAlerta===p?PRI_COLOR[p]+"18":"transparent",color:prioridadAlerta===p?PRI_COLOR[p]:C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{translateText("Notificaciones push") }</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{translateText("Avisar aunque no tengas la app abierta") }</div>
                </div>
                <Toggle on={notifPush} setOn={setNotifPush}/>
              </div>
              <div style={{background:PRI_COLOR[prioridadAlerta]+"12",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",gap:8}}>
                <Icon n="alert" size={14} color={PRI_COLOR[prioridadAlerta]}/>
                <span style={{fontSize:12,color:PRI_COLOR[prioridadAlerta],fontFamily:"'Inter',sans-serif",fontWeight:500}}>
                  {translateText("Recibirás alerta cuando el stock baje de") } <strong>{umbralAlerta||stockMinimo} {unidad.toLowerCase()}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      </Block>

      <Block icon="truck" title="Información de reposición" subtitle={proveedor||"Sin proveedor asignado"} defaultOpen={false}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><FLbl c={translateText("Proveedor")}/><TInput placeholder="Nombre del proveedor" value={proveedor} onChange={setProveedor}/></div>
          <div>
            <FLbl c="Tiempo estimado de reposición"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
              {TIEMPOS.map(t=>(
                <button key={t} onClick={()=>setTiempoReposicion(t)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${tiempoReposicion===t?C.text:C.border}`,background:tiempoReposicion===t?C.text:"transparent",color:tiempoReposicion===t?"#fff":C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Block>

      <button onClick={()=>setMasOpciones(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más opciones") }</span>
        <Icon n={masOpciones?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masOpciones && (
        <Block icon="tag" title="Organización" subtitle={ubicacion} defaultOpen={true}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><FLbl c={translateText("Categoría")}/><TInput placeholder="Ej: Jabones, Cremas..." value={categoria} onChange={setCategoria}/></div>
            <div><FLbl c="Código interno"/><TInput placeholder="Ej: JAB-001" value={codigoInterno} onChange={setCodigoInterno}/></div>
            <div>
              <FLbl c="Ubicación"/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
                {UBICACIONES.map(u=>(
                  <button key={u} onClick={()=>setUbicacion(u)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${ubicacion===u?C.text:C.border}`,background:ubicacion===u?C.text:"transparent",color:ubicacion===u?"#fff":C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div><FLbl c={translateText("Descripción")}/><TInput placeholder="Descripción del producto" value={descripcion} onChange={setDescripcion}/></div>
          </div>
        </Block>
      )}

      <PrimaryBtn label={translateText("Agregar producto")} onClick={handleSave} disabled={!nombre}/>
    </div>
  );
}

// ── ESTIMACIÓN DE DÍAS HASTA AGOTAR STOCK ──────────────────────
function diasHastaAgotar(producto){
  const ventas = (producto.historial||[]).filter(h=>h.tipo==="Venta");
  if(ventas.length<2||producto.stockInicial<=0) return null;
  const fechasMs = ventas.map(v=>{
    const [d,m,y]=v.fecha.split("/").map(Number);
    return new Date(y,m-1,d).getTime();
  }).sort((a,b)=>a-b);
  const dias = Math.max(1,Math.round((fechasMs[fechasMs.length-1]-fechasMs[0])/(1000*60*60*24)));
  const totalVendido = ventas.reduce((a,v)=>a+Math.abs(v.cantidad),0);
  const ritmoDiario = totalVendido/dias;
  if(ritmoDiario<=0) return null;
  return Math.max(0,Math.round(producto.stockInicial/ritmoDiario));
}

// ── STOCK SCREEN ──────────────────────────────────────────────
function Stock({productos,setProductos}){
  const [tab,        setTab]        = useState("Productos");
  const [modal,      setModal]      = useState(false);
  const [detalle,    setDetalle]    = useState(null);
  const [ajusteModal,setAjusteModal]= useState(null);
  const [ajusteDelta,setAjusteDelta]= useState(0);
  const [ajusteTipo, setAjusteTipo] = useState("Ingreso");
  const [toast,      setToast]      = useState(null);

  const porReponer = productos.filter(p => p.stockInicial <= (p.umbralAlerta||p.stockMinimo));
  const total      = productos.length;
  const agotados   = productos.filter(p => p.stockInicial <= 0).length;
  const bajosNotAgotados = productos.filter(p => p.stockInicial > 0 && p.stockInicial <= p.stockMinimo).length;

  useEffect(()=>{
    if(!toast) return;
    const t = setTimeout(()=>setToast(null),4000);
    return ()=>clearTimeout(t);
  },[toast]);

  const handleSaveProducto = (prod) => {
    setProductos(ps => [{ ...prod, stockInicial: prod.stockInicial }, ...ps]);
    setModal(false);
  };

  const handleAjuste = () => {
    if (!ajusteModal) return;
    const delta = ajusteTipo === "Venta" ? -Math.abs(ajusteDelta) : Math.abs(ajusteDelta);
    const nuevoStock = Math.max(0, ajusteModal.stockInicial + delta);
    const umbral = ajusteModal.umbralAlerta||ajusteModal.stockMinimo;
    if(ajusteModal.alertaActiva!==false && ajusteModal.stockInicial>umbral && nuevoStock<=umbral){
      setToast({nombre:ajusteModal.nombre,prioridad:ajusteModal.prioridadAlerta||"Media"});
    }
    setProductos(ps => ps.map(p => p.nombre === ajusteModal.nombre
      ? { ...p,
          stockInicial: nuevoStock,
          historial: [...(p.historial||[]), {
            tipo: ajusteTipo, cantidad: delta,
            fecha: new Date().toLocaleDateString("es-AR"),
            hora:  new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})
          }]
        }
      : p
    ));
    setAjusteModal(null);
    setAjusteDelta(0);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingTop:4}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Stock")}</h1>
          <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{total} producto{total!==1?"s":""}</p>
        </div>
        <OutlineBtn label="Producto" icon="plus" onClick={()=>setModal(true)}/>
      </div>

      <TabBar tabs={["Productos","Por reponer","Resumen","Historial"]} active={tab} setActive={setTab}/>

      {porReponer.length>0 && (
        <div onClick={()=>setTab("Por reponer")} style={{background:"#C0404012",border:"1px solid #C0404030",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:9,cursor:"pointer"}}>
          <Icon n="alert" size={15} color={C.red}/>
          <span style={{fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",fontWeight:600,flex:1}}>{porReponer.length} producto{porReponer.length!==1?"s":""} {porReponer.length===1?"necesita":"necesitan"} reposición</span>
          <Icon n="chevR" size={14} color={C.red}/>
        </div>
      )}

      {tab==="Productos" && (
        productos.length===0
          ? <DashedEmpty icon="box" text="Agregá tu primer producto" onClick={()=>setModal(true)}/>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {productos.map((p,i)=>{
                const st = getStockStatus(p.stockInicial, p.stockMinimo);
                const margen = p.costo>0&&p.precioVenta>0 ? Math.round(((p.precioVenta-p.costo)/p.precioVenta)*100) : null;
                return (
                  <Card key={i} style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setDetalle(p)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:10,height:10,borderRadius:"50%",background:st.dot,flexShrink:0}}/>
                          <span style={{fontWeight:700,fontSize:14,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</span>
                        </div>
                        {p.categoria&&<span style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{p.categoria}</span>}
                        <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                          {p.precioVenta>0&&<span style={{fontSize:11,color:C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>${p.precioVenta.toLocaleString("es-AR")}</span>}
                          {margen!==null&&<span style={{fontSize:10,color:C.green,fontFamily:"'Inter',sans-serif"}}>· {margen}% margen</span>}
                          <span style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif"}}>· {p.vendidos} vendidos</span>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0,marginLeft:12}}>
                        <div style={{textAlign:"right"}}>
                          <span style={{fontSize:22,fontWeight:800,color:st.color,fontFamily:"'Montserrat',sans-serif"}}>{p.stockInicial}</span>
                          <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginLeft:3}}>{p.unidad?.toLowerCase()}</span>
                        </div>
                        <span style={{fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:20,background:st.bg,color:st.color,fontFamily:"'Montserrat',sans-serif"}}>{st.label}</span>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={e=>{e.stopPropagation();setAjusteModal(p);setAjusteTipo("Venta");}}
                            style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:15,fontWeight:700,color:C.red,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                          <button onClick={e=>{e.stopPropagation();setAjusteModal(p);setAjusteTipo("Ingreso");}}
                            style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",fontSize:15,fontWeight:700,color:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
      )}

      {tab==="Por reponer" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {porReponer.length===0
            ? <div style={{border:`1.5px dashed ${C.border}`,borderRadius:16,padding:"44px 20px",textAlign:"center"}}>
                <Icon n="check" size={36} color={C.green}/>
                <p style={{color:C.green,fontSize:15,fontFamily:"'Montserrat',sans-serif",fontWeight:700,marginTop:12}}>{translateText("¡Todo el stock en orden!") }</p>
                <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{translateText("Ningún producto necesita reposición") }</p>
              </div>
            : <>
                <div style={{background:"#C0404012",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:8}}>
                  <Icon n="alert" size={16} color={C.red}/>
                  <span style={{fontSize:13,color:C.red,fontFamily:"'Inter',sans-serif",fontWeight:600}}>{porReponer.length} producto{porReponer.length!==1?"s":""} {porReponer.length===1?"necesita":"necesitan"} reposición</span>
                </div>
                {porReponer.map((p,i)=>{
                  const st=getStockStatus(p.stockInicial,p.stockMinimo);
                  const PRI_C={Baja:C.green,Media:C.amber,Alta:C.red};
                  return (
                    <Card key={i} style={{padding:"14px 16px",borderLeft:`4px solid ${st.color}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                          <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:st.color,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>{st.label}</span>
                            <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>· {p.stockInicial} / mín. {p.stockMinimo} {p.unidad?.toLowerCase()}</span>
                          </div>
                          {p.proveedor&&<div style={{fontSize:11,color:C.sub,fontFamily:"'Inter',sans-serif",marginTop:4}}>Proveedor: {p.proveedor}</div>}
                          <div style={{fontSize:11,color:C.sub,fontFamily:"'Inter',sans-serif",marginTop:2}}>Reposición estimada: {p.tiempoReposicion}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                          {p.alertaActiva&&(
                            <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20,background:PRI_C[p.prioridadAlerta]+"18",color:PRI_C[p.prioridadAlerta],fontFamily:"'Montserrat',sans-serif"}}>
                              {p.prioridadAlerta}
                            </span>
                          )}
                          <button onClick={()=>{setAjusteModal(p);setAjusteTipo("Ingreso");}}
                            style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${C.green}`,background:C.green+"15",color:C.green,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                            {translateText("+ Reponer") }
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
          }
        </div>
      )}

      {tab==="Resumen" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["Total",total,C.text],["Agotados",agotados,C.red],["Stock bajo",bajosNotAgotados,C.amber]].map(([l,v,c])=>(
              <Card key={l} style={{padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:8}}>{l}</div>
                <div style={{fontSize:28,fontWeight:800,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
              </Card>
            ))}
          </div>

          <Card style={{padding:"16px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'Montserrat',sans-serif",marginBottom:12}}>{translateText("Estado del inventario") }</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {productos.map((p,i)=>{
                const st=getStockStatus(p.stockInicial,p.stockMinimo);
                const pct=p.stockMinimo>0?Math.min((p.stockInicial/Math.max(p.stockMinimo*2,p.stockInicial))*100,100):50;
                return (
                  <div key={i}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.nombre}</span>
                      <span style={{fontSize:13,fontWeight:700,color:st.color,fontFamily:"'Montserrat',sans-serif"}}>{p.stockInicial} {p.unidad?.toLowerCase()}</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:C.border}}>
                      <div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:st.dot,transition:"width .6s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span style={{fontSize:9,color:C.muted,fontFamily:"'Inter',sans-serif"}}>0</span>
                      <span style={{fontSize:9,color:C.muted,fontFamily:"'Inter',sans-serif"}}>Mín: {p.stockMinimo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {productos.map((p,i)=>{
            const st=getStockStatus(p.stockInicial,p.stockMinimo);
            const margen=p.costo>0&&p.precioVenta>0?Math.round(((p.precioVenta-p.costo)/p.precioVenta)*100):null;
            const lastRep=p.historial?.filter(h=>h.tipo==="Ingreso inicial"||h.tipo==="Ingreso").pop();
            const diasAgotar = diasHastaAgotar(p);
            return (
              <Card key={i} style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                  <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:st.bg,color:st.color,fontFamily:"'Montserrat',sans-serif"}}>{st.label}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    ["Stock actual",  `${p.stockInicial} ${p.unidad?.toLowerCase()}`, C.text],
                    ["Vendidos",      `${p.vendidos} u`, C.sub],
                    ["Margen",        margen!==null?`${margen}%`:"—", C.green],
                    ["Última repos.", lastRep?.fecha||"—", C.sub],
                    ["Se agota en",   diasAgotar!=null?`${diasAgotar} día${diasAgotar!==1?"s":""}`:"—", diasAgotar!=null&&diasAgotar<=7?C.red:C.sub],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:C.bg,borderRadius:10,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:3}}>{l}</div>
                      <div style={{fontSize:14,fontWeight:700,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="Historial" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {productos.flatMap(p=>(p.historial||[]).map(h=>({...h,producto:p.nombre,unidad:p.unidad}))).length===0
            ? <DashedEmpty icon="history" text="Sin movimientos registrados"/>
            : productos.flatMap(p=>(p.historial||[]).map(h=>({...h,producto:p.nombre,unidad:p.unidad})))
                .sort((a,b)=>b.fecha.localeCompare(a.fecha))
                .map((h,i)=>(
              <Card key={i} style={{padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:10,background:h.cantidad>0?"#1A7A5015":"#C0404015",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon n={h.cantidad>0?"trending":"trendDn"} size={14} color={h.cantidad>0?C.green:C.red}/>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{h.producto}</div>
                      <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{h.tipo} · {h.fecha} {h.hora}</div>
                    </div>
                  </div>
                  <span style={{fontSize:15,fontWeight:800,color:h.cantidad>0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>
                    {h.cantidad>0?"+":""}{h.cantidad} {h.unidad?.toLowerCase()}
                  </span>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {modal && (
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end",zIndex:300,backdropFilter:"blur(4px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(false);}}>
          <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"95%",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,.15)",animation:"slideUp .22s ease"}}>
            <div style={{padding:"0 18px 32px"}}>
              <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"14px auto 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"18px 0 20px"}}>
                <div>
                  <h3 style={{margin:0,fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Nuevo producto")}</h3>
                  <p style={{margin:"3px 0 0",fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Cargá el producto en menos de 20 segundos") }</p>
                </div>
                <button onClick={()=>setModal(false)} style={{width:34,height:34,borderRadius:10,background:C.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon n="x" size={15} color={C.muted}/>
                </button>
              </div>
              <NuevoProductoForm onClose={()=>setModal(false)} onSave={handleSaveProducto}/>
            </div>
          </div>
        </div>
      )}

      {detalle && (
        <Sheet title={detalle.nombre} onClose={()=>setDetalle(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {(()=>{
              const st=getStockStatus(detalle.stockInicial,detalle.stockMinimo);
              const margen=detalle.costo>0&&detalle.precioVenta>0?Math.round(((detalle.precioVenta-detalle.costo)/detalle.precioVenta)*100):null;
              return (<>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 14px",borderRadius:14,background:st.bg}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:st.dot}}/>
                  <div>
                    <span style={{fontSize:15,fontWeight:800,color:st.color,fontFamily:"'Montserrat',sans-serif"}}>{detalle.stockInicial} {detalle.unidad?.toLowerCase()}</span>
                    <span style={{fontSize:13,color:st.color,fontFamily:"'Inter',sans-serif",marginLeft:8}}>{st.label}</span>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["Mín.",detalle.stockMinimo+" "+detalle.unidad?.toLowerCase(),C.amber],["Vendidos",detalle.vendidos+" u",C.sub],["Precio","$"+detalle.precioVenta?.toLocaleString("es-AR"),C.gold],["Margen",margen!==null?margen+"%":"—",C.green],["Se agota en",diasHastaAgotar(detalle)!=null?`${diasHastaAgotar(detalle)} días`:"—",C.sub]].map(([l,v,c])=>(
                    <div key={l} style={{background:C.bg,borderRadius:12,padding:"12px 12px"}}>
                      <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{l}</div>
                      <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
                    </div>
                  ))}
                </div>
                {detalle.proveedor&&<div style={{background:C.bg,borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Proveedor")}</div><div style={{fontSize:14,color:C.text,fontFamily:"'Inter',sans-serif"}}>{detalle.proveedor} · {detalle.tiempoReposicion}</div></div>}
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'Montserrat',sans-serif",marginBottom:8}}>{translateText("Historial reciente") }</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {(detalle.historial||[]).slice(-4).reverse().map((h,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:10,background:C.bg}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{h.tipo}</div>
                          <div style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{h.fecha} {h.hora}</div>
                        </div>
                        <span style={{fontSize:14,fontWeight:800,color:h.cantidad>0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>{h.cantidad>0?"+":""}{h.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setAjusteModal(detalle);setAjusteTipo("Ingreso");setDetalle(null);}} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${C.green}`,background:C.green+"15",color:C.green,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("+ Ingreso") }</button>
                  <button onClick={()=>{setAjusteModal(detalle);setAjusteTipo("Ajuste");setDetalle(null);}} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Ajuste") }</button>
                </div>
              </>);
            })()}
          </div>
        </Sheet>
      )}

      {ajusteModal && (
        <Sheet title={`Ajustar stock · ${ajusteModal.nombre}`} onClose={()=>setAjusteModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            <div>
              <FLbl c="Tipo de movimiento"/>
              <div style={{display:"flex",gap:8}}>
                {["Ingreso","Venta","Ajuste"].map(t=>(
                  <button key={t} onClick={()=>setAjusteTipo(t)} style={{flex:1,padding:"10px 0",borderRadius:12,border:`1.5px solid ${ajusteTipo===t?(t==="Venta"?C.red:t==="Ingreso"?C.green:C.gold):C.border}`,background:ajusteTipo===t?(t==="Venta"?C.red:t==="Ingreso"?C.green:C.gold)+"18":"transparent",color:ajusteTipo===t?(t==="Venta"?C.red:t==="Ingreso"?C.green:C.gold):C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FLbl c={translateText("Cantidad")}/>
              <TInput type="number" placeholder="0" value={ajusteDelta||""} onChange={setAjusteDelta}/>
            </div>
            <div style={{background:C.bg,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Stock actual:") } <strong>{ajusteModal.stockInicial}</strong></div>
              <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginTop:4}}>
                → {Math.max(0,ajusteModal.stockInicial+(ajusteTipo==="Venta"?-Math.abs(ajusteDelta):Math.abs(ajusteDelta)))} {ajusteModal.unidad?.toLowerCase()}
              </div>
            </div>
            <PrimaryBtn label="Confirmar ajuste" onClick={handleAjuste} disabled={!ajusteDelta}/>
          </div>
        </Sheet>
      )}

      {toast && (
        <div style={{position:"absolute",top:14,left:14,right:14,zIndex:500,animation:"slideUp .25s ease"}}>
          <div style={{background:C.text,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 6px 20px rgba(0,0,0,.25)"}}>
            <Icon n="bell" size={16} color="#F0EBE3"/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#F0EBE3",fontFamily:"'Montserrat',sans-serif"}}>Stock bajo · {toast.nombre}</div>
              <div style={{fontSize:10,color:"#C8BFB0",fontFamily:"'Inter',sans-serif",marginTop:1}}>Llegó al mínimo · Prioridad {toast.prioridad}</div>
            </div>
            <button onClick={()=>setToast(null)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
              <Icon n="x" size={13} color="#C8BFB0"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CALCULADORA DE PRECIO ──────────────────────────────────────
function CalculadoraPrecio({ onClose, productos, setProductos, initialTab }) {
  const [nombre,       setNombre]       = useState("");
  const [insumos,      setInsumos]      = useState([{ id:1, nombre:"", monto:0, fromStock:false, stockNombre:null, cantidadUsada:1 }]);
  const [costosExtra,  setCostosExtra]  = useState([]);
  const [cantProd,     setCantProd]     = useState(1);
  const [ganancia,     setGanancia]     = useState(30);
  const [plantillas,   setPlantillas]   = useState([
    { nombre:"Alfajores",  insumos:[{id:1,nombre:"Harina",monto:800},{id:2,nombre:"Chocolate",monto:1200}], cantProd:12 },
    { nombre:"Scrunchies", insumos:[{id:1,nombre:"Tela",monto:500},{id:2,nombre:"Elástico",monto:200}],    cantProd:10 },
  ]);
  const [historial,    setHistorial]    = useState([]);
  const [tab,          setTab]          = useState(initialTab||"calculadora");
  const [showPlant,    setShowPlant]    = useState(false);
  const [showExtra,    setShowExtra]    = useState(false);
  const [showStockPicker,setShowStockPicker]=useState(false);
  const [descontarStock,setDescontarStock]=useState(false);

  const [r3cantCompra, setR3cantCompra] = useState("");
  const [r3unidCompra, setR3unidCompra] = useState("kg");
  const [r3precio,     setR3precio]     = useState("");
  const [r3cantUso,    setR3cantUso]    = useState("");
  const [r3unidUso,    setR3unidUso]    = useState("gramos");

  const TIPOS_EXTRA = ["Mano de obra","Packaging","Etiquetas","Envío","Comisión MP","Comisión tarjeta","Luz/Gas","Otro"];
  const COMPARACION = [30,50,100,150,200];
  const UNIDADES_R3 = {
    kg:     { label:"kg",     ejemplo:"1 kg = 1000 gramos",     sub:[{val:"gramos",   label:"gramos",   factor:1000},{val:"kg",     label:"kg",     factor:1}] },
    litro:  { label:"litro",  ejemplo:"1 litro = 1000 ml",      sub:[{val:"ml",       label:"ml",       factor:1000},{val:"litro",  label:"litro",  factor:1}] },
    metro:  { label:"metro",  ejemplo:"1 metro = 100 cm",       sub:[{val:"cm",       label:"cm",       factor:100 },{val:"metro",  label:"metro",  factor:1}] },
    docena: { label:"docena", ejemplo:"1 docena = 12 unidades", sub:[{val:"unidades", label:"unidades",factor:12  },{val:"docena", label:"docena", factor:1}] },
    unidad: { label:"unidad", ejemplo:"Se compra y se usa por unidad", sub:[{val:"unidad", label:"unidad",  factor:1   }] },
  };

  const costoInsumosTotal = insumos.reduce((a,i)=>a+(i.monto||0),0);
  const costoExtraTotal   = costosExtra.reduce((a,e)=>{
    if(e.tipo==="fijo") return a+(e.valor||0);
    return a+(costoInsumosTotal*(e.valor||0)/100);
  },0);
  const costoTotal        = costoInsumosTotal + costoExtraTotal;
  const costoPorUnidad    = cantProd>0 ? costoTotal/cantProd : 0;
  const precioSugerido    = costoPorUnidad * (1 + ganancia/100);
  const gananciaPorUnidad = precioSugerido - costoPorUnidad;
  const gananciaTotalLote = gananciaPorUnidad * cantProd;
  const margen            = precioSugerido>0 ? Math.round((gananciaPorUnidad/precioSugerido)*100) : 0;

  const rentabilidad = margen>=40
    ? { emoji:"🟢", label:"Rentabilidad alta",  color:C.green }
    : margen>=20
    ? { emoji:"🟡", label:"Rentabilidad media", color:C.amber }
    : { emoji:"🔴", label:"Rentabilidad baja",  color:C.red   };

  const unidCompraInfo = UNIDADES_R3[r3unidCompra];
  const subOpcion      = unidCompraInfo?.sub.find(s=>s.val===r3unidUso);
  const factor         = subOpcion?.factor || 1;
  const costoUso       = r3cantCompra&&r3precio&&r3cantUso
    ? (parseFloat(r3precio)/parseFloat(r3cantCompra)/factor)*parseFloat(r3cantUso)
    : null;

  const agregarDesdeStock = (prod) => {
    setInsumos(s=>[...s.filter(x=>x.nombre), { id:Date.now(), nombre:`${prod.nombre} (${prod.unidad||"Unidad"})`, monto:prod.costo||0, fromStock:true, stockNombre:prod.nombre, cantidadUsada:1 }]);
    setShowStockPicker(false);
  };

  const guardarCalculo = () => {
    if (!nombre || !costoPorUnidad) return;
    setHistorial(h=>[{ fecha:new Date().toLocaleDateString("es-AR"), nombre, costoPorUnidad:Math.round(costoPorUnidad), precioSugerido:Math.round(precioSugerido), ganancia:Math.round(gananciaTotalLote), margen },...h].slice(0,20));

    if(descontarStock && setProductos){
      const consumos = insumos.filter(i=>i.fromStock);
      if(consumos.length>0){
        setProductos(ps=>ps.map(p=>{
          const ins = consumos.find(c=>c.stockNombre===p.nombre);
          if(!ins) return p;
          const consumido = (ins.cantidadUsada||1)*cantProd;
          return { ...p,
            stockInicial: Math.max(0,p.stockInicial-consumido),
            historial:[...(p.historial||[]),{tipo:"Ajuste",cantidad:-consumido,fecha:new Date().toLocaleDateString("es-AR"),hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}]
          };
        }));
      }
    }
  };

  const cargarPlantilla = (p) => {
    setNombre(p.nombre); setInsumos(p.insumos); setCantProd(p.cantProd); setShowPlant(false);
  };

  const guardarPlantilla = () => {
    if(!nombre) return;
    setPlantillas(ps=>[{nombre,insumos,cantProd},...ps.filter(p=>p.nombre!==nombre)]);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,paddingTop:4}}>
        <div style={{width:38,height:38,borderRadius:12,background:C.gold+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="calc" size={19} color={C.gold}/>
        </div>
        <div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Calculadora") }</h3>
          <p style={{margin:0,fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Calculá tu precio de venta ideal") }</p>
        </div>
        <button onClick={onClose} style={{marginLeft:"auto",width:34,height:34,borderRadius:10,background:C.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="x" size={15} color={C.muted}/>
        </button>
      </div>

      <div style={{display:"flex",gap:0,background:C.bg,borderRadius:12,padding:3,marginBottom:18}}>
        {[["calculadora","Precio"],["regla3","Regla de 3"],["historial","Historial"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",background:tab===id?C.card:"transparent",color:tab===id?C.text:C.muted,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",boxShadow:tab===id?"0 1px 6px rgba(0,0,0,.07)":"none",transition:"all .15s"}}>
            {label}
          </button>
        ))}
      </div>

      {tab==="calculadora" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{flex:1}}>
              <FLbl c="Nombre del producto"/>
              <TInput placeholder="Ej: Alfajores, Scrunchies..." value={nombre} onChange={setNombre}/>
            </div>
            <button onClick={()=>setShowPlant(s=>!s)} style={{flexShrink:0,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card,cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"'Montserrat',sans-serif",fontWeight:700,whiteSpace:"nowrap"}}>
              {translateText("Plantillas") }
            </button>
          </div>

          {showPlant && (
            <div style={{background:C.bg,borderRadius:14,padding:"14px 14px",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Mis plantillas") }</div>
              {plantillas.map((p,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderRadius:10,padding:"10px 12px"}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.nombre}</span>
                  <button onClick={()=>cargarPlantilla(p)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.gold}`,background:C.gold+"15",color:C.gold,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Usar") }</button>
                </div>
              ))}
              {nombre&&<button onClick={guardarPlantilla} style={{padding:"9px",borderRadius:10,border:`1.5px dashed ${C.border}`,background:"transparent",color:C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>+ Guardar "{nombre}" como plantilla</button>}
            </div>
          )}

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Insumos de producción") }</span>
              <div style={{display:"flex",gap:6}}>
                {productos&&productos.length>0&&(
                  <button onClick={()=>setShowStockPicker(true)} style={{fontSize:11,color:C.blue,fontFamily:"'Montserrat',sans-serif",fontWeight:700,background:"none",border:`1px solid ${C.blue}`,borderRadius:20,padding:"4px 10px",cursor:"pointer"}}>
                    {translateText("Del stock") }
                  </button>
                )}
                <button onClick={()=>setInsumos(s=>[...s,{id:Date.now(),nombre:"",monto:0,fromStock:false,stockNombre:null,cantidadUsada:1}])}
                  style={{fontSize:11,color:C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:700,background:"none",border:`1px solid ${C.gold}`,borderRadius:20,padding:"4px 10px",cursor:"pointer"}}>
                  {translateText("+ Agregar") }
                </button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {insumos.map((ins,i)=>(
                <div key={ins.id} style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {ins.fromStock&&<Icon n="box" size={13} color={C.blue}/>}
                    <input placeholder={`Insumo ${i+1} (ej: Harina)`} value={ins.nombre} readOnly={ins.fromStock}
                      onChange={e=>setInsumos(s=>s.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}
                      style={{flex:1,background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"9px 0",color:C.text,fontSize:14,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif"}}>$</span>
                      <input type="number" placeholder="0" value={ins.monto||""}
                        onChange={e=>setInsumos(s=>s.map((x,j)=>j===i?{...x,monto:parseFloat(e.target.value)||0}:x))}
                        style={{width:80,background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"9px 0",color:C.text,fontSize:14,outline:"none",fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"right"}}/>
                    </div>
                    {insumos.length>1&&(
                      <button onClick={()=>setInsumos(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}>
                        <Icon n="x" size={13} color={C.muted}/>
                      </button>
                    )}
                  </div>
                  {ins.fromStock&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:21}}>
                      <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Unidades usadas por producto:") }</span>
                      <input type="number" min="0" value={ins.cantidadUsada||""} onChange={e=>setInsumos(s=>s.map((x,j)=>j===i?{...x,cantidadUsada:parseFloat(e.target.value)||0}:x))}
                        style={{width:50,background:C.bg,border:"none",borderRadius:8,padding:"4px 6px",color:C.text,fontSize:12,outline:"none",fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center"}}/>
                    </div>
                  )}
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"flex-end",paddingTop:4,borderTop:`1px solid ${C.border}`}}>
                <span style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Subtotal insumos:") } </span>
                <span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif",marginLeft:8}}>${costoInsumosTotal.toLocaleString("es-AR")}</span>
              </div>
              {insumos.some(i=>i.fromStock)&&setProductos&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.blue+"10",borderRadius:10,padding:"9px 12px"}}>
                  <span style={{fontSize:11,color:C.blue,fontFamily:"'Inter',sans-serif"}}>{translateText("Descontar del stock al guardar el cálculo") }</span>
                  <Toggle on={descontarStock} setOn={setDescontarStock}/>
                </div>
              )}
            </div>
          </div>

          <button onClick={()=>setShowExtra(s=>!s)}
            style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontFamily:"'Montserrat',sans-serif",fontWeight:700,fontSize:13}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Icon n="plus" size={15} color={C.muted}/>
              <span>{translateText("Costos adicionales") }</span>
              {costoExtraTotal>0&&<span style={{fontSize:11,color:C.red,fontFamily:"'Montserrat',sans-serif"}}>+${costoExtraTotal.toLocaleString("es-AR")}</span>}
            </div>
            <Icon n={showExtra?"chevU":"chevD"} size={15} color={C.muted}/>
          </button>

          {showExtra && (
            <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Sumá gastos extra: mano de obra, packaging, envío, comisiones, etc.") }</div>
              {costosExtra.map((e,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <select value={e.nombre} onChange={ev=>setCostosExtra(s=>s.map((x,j)=>j===i?{...x,nombre:ev.target.value}:x))}
                    style={{flex:1,minWidth:100,background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"8px 0",color:C.text,fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif",cursor:"pointer"}}>
                    {TIPOS_EXTRA.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={e.tipo} onChange={ev=>setCostosExtra(s=>s.map((x,j)=>j===i?{...x,tipo:ev.target.value}:x))}
                    style={{width:72,background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"8px 0",color:C.gold,fontSize:12,outline:"none",fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                    <option value="fijo">{translateText("$ fijo") }</option>
                    <option value="pct">%</option>
                  </select>
                  <input type="number" placeholder="0" value={e.valor||""}
                    onChange={ev=>setCostosExtra(s=>s.map((x,j)=>j===i?{...x,valor:parseFloat(ev.target.value)||0}:x))}
                    style={{width:70,background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"8px 0",color:C.text,fontSize:14,outline:"none",fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"right"}}/>
                  <button onClick={()=>setCostosExtra(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                    <Icon n="x" size={13} color={C.muted}/>
                  </button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {TIPOS_EXTRA.slice(0,4).map(t=>(
                  <button key={t} onClick={()=>setCostosExtra(s=>[...s,{nombre:t,tipo:"fijo",valor:0}])}
                    style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:600,cursor:"pointer"}}>
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:12}}>{translateText("Producción del lote") }</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <FLbl c="Unidades producidas"/>
                <TInput type="number" placeholder="1" value={cantProd||""} onChange={setCantProd}/>
              </div>
              <div>
                <FLbl c="Costo total de producción"/>
                <div style={{padding:"11px 0",fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif",borderBottom:`1.5px solid ${C.border}`}}>${costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
              </div>
            </div>
          </div>

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Margen de ganancia") }</span>
              <span style={{fontSize:20,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{ganancia}%</span>
            </div>
            <input type="range" min="5" max="300" value={ganancia} onChange={e=>setGanancia(parseInt(e.target.value))} style={{width:"100%",accentColor:C.gold}}/>
          </div>

          <div style={{background:rentabilidad.color+"12",border:`1.5px solid ${rentabilidad.color}40`,borderRadius:18,padding:"20px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:12,fontWeight:800,color:rentabilidad.color,fontFamily:"'Montserrat',sans-serif"}}>{rentabilidad.emoji} {rentabilidad.label}</span>
              <span style={{fontSize:12,fontWeight:800,color:rentabilidad.color,fontFamily:"'Montserrat',sans-serif"}}>{margen}% margen</span>
            </div>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{translateText("Precio de venta recomendado") }</div>
              <div style={{fontSize:42,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${precioSugerido.toLocaleString("es-AR",{maximumFractionDigits:0})}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["Costo total",       "$"+costoTotal.toLocaleString("es-AR",{maximumFractionDigits:0}),      C.text],
                ["Costo por unidad",  "$"+costoPorUnidad.toLocaleString("es-AR",{maximumFractionDigits:0}),  C.text],
                ["Ganancia / unidad", "$"+gananciaPorUnidad.toLocaleString("es-AR",{maximumFractionDigits:0}),C.green],
                ["Ganancia del lote", "$"+gananciaTotalLote.toLocaleString("es-AR",{maximumFractionDigits:0}),C.green],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:C.card,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"'Montserrat',sans-serif"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:12}}>{translateText("Comparación rápida de precios") }</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"0 10px 6px",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Ganancia") }</span>
                <span style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",textAlign:"center"}}>{translateText("Precio")}</span>
                <span style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",textAlign:"right"}}>{translateText("Ganás") }</span>
              </div>
              {COMPARACION.map(g=>{
                const precioG = costoPorUnidad*(1+g/100);
                const gananciaG = precioG-costoPorUnidad;
                const activo = ganancia===g;
                return (
                  <button key={g} onClick={()=>setGanancia(g)} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",alignItems:"center",padding:"9px 10px",borderRadius:10,border:"none",background:activo?C.gold+"15":"transparent",cursor:"pointer"}}>
                    <span style={{fontSize:13,fontWeight:800,color:activo?C.gold:C.text,fontFamily:"'Montserrat',sans-serif",textAlign:"left"}}>{g}%</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",textAlign:"center"}}>${precioG.toLocaleString("es-AR",{maximumFractionDigits:0})}</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.green,fontFamily:"'Montserrat',sans-serif",textAlign:"right"}}>${gananciaG.toLocaleString("es-AR",{maximumFractionDigits:0})}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <PrimaryBtn label="Guardar cálculo" onClick={guardarCalculo} disabled={!nombre||!costoPorUnidad}/>
        </div>
      )}

      {tab==="regla3" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>Calculá cuánto te cuesta usar una parte de un insumo que compraste en otra unidad — sin fórmulas, paso a paso.</div>

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px",display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:C.gold,color:"#fff",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif"}}>1</div>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Lo que compraste") }</span>
            </div>
            <div>
              <FLbl c="Cantidad comprada"/>
              <TInput type="number" placeholder="1" value={r3cantCompra} onChange={setR3cantCompra}/>
            </div>
            <div>
              <FLbl c={translateText("Unidad")}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.keys(UNIDADES_R3).map(u=>(
                  <button key={u} onClick={()=>{setR3unidCompra(u);setR3unidUso(UNIDADES_R3[u].sub[0].val);}} style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${r3unidCompra===u?C.text:C.border}`,background:r3unidCompra===u?C.text:"transparent",color:r3unidCompra===u?"#fff":C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                    {UNIDADES_R3[u].label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:6,display:"flex",alignItems:"center",gap:5}}>
                <Icon n="info" size={12} color={C.muted}/> {unidCompraInfo?.ejemplo}
              </div>
            </div>
            <div>
              <FLbl c="Precio pagado en total"/>
              <TInput type="number" placeholder="0" value={r3precio} onChange={setR3precio}/>
            </div>
          </div>

          <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,padding:"16px 16px",display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:C.gold,color:"#fff",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif"}}>2</div>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Lo que usás por producto") }</span>
            </div>
            <div>
              <FLbl c="Cantidad utilizada"/>
              <TInput type="number" placeholder="0" value={r3cantUso} onChange={setR3cantUso}/>
            </div>
            <div>
              <FLbl c={translateText("Unidad")}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(unidCompraInfo?.sub||[]).map(s=>(
                  <button key={s.val} onClick={()=>setR3unidUso(s.val)} style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${r3unidUso===s.val?C.text:C.border}`,background:r3unidUso===s.val?C.text:"transparent",color:r3unidUso===s.val?"#fff":C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:costoUso!==null?C.green:C.border,color:"#fff",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif"}}>✓</div>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Resultado") }</span>
            </div>
            <div style={{background:costoUso!==null?C.gold+"12":C.bg,border:`1.5px solid ${costoUso!==null?C.gold+"30":C.border}`,borderRadius:16,padding:"20px 18px",textAlign:"center"}}>
              <div style={{fontSize:11,color:costoUso!==null?C.gold:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{translateText("Costo exacto por producto") }</div>
              <div style={{fontSize:36,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{costoUso!==null?`$${costoUso.toLocaleString("es-AR",{maximumFractionDigits:2})}`:"—"}</div>
              {costoUso===null&&<div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:8}}>{translateText("Completá los pasos 1 y 2 para ver el resultado") }</div>}
            </div>
          </div>
        </div>
      )}

      {tab==="historial" && (
        historial.length===0
          ? <DashedEmpty icon="calc" text="Todavía no guardaste ningún cálculo"/>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {historial.map((h,i)=>(
                <Card key={i} style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{h.nombre}</span>
                    <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{h.fecha}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                    <div><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase"}}>{translateText("Costo")}</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${h.costoPorUnidad.toLocaleString("es-AR")}</div></div>
                    <div><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase"}}>{translateText("Venta") }</div><div style={{fontSize:13,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>${h.precioSugerido.toLocaleString("es-AR")}</div></div>
                    <div><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase"}}>{translateText("Ganancia") }</div><div style={{fontSize:13,fontWeight:700,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>${h.ganancia.toLocaleString("es-AR")}</div></div>
                    <div><div style={{fontSize:9,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textTransform:"uppercase"}}>{translateText("Margen")}</div><div style={{fontSize:13,fontWeight:700,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>{h.margen}%</div></div>
                  </div>
                </Card>
              ))}
            </div>
      )}

      {showStockPicker&&(
        <Sheet title="Elegir producto del stock" onClose={()=>setShowStockPicker(false)}>
          {(!productos||productos.length===0)
            ? <DashedEmpty icon="box" text="No hay productos cargados en Stock"/>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {productos.map((p,i)=>(
                  <button key={i} onClick={()=>agregarDesdeStock(p)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                    <div style={{width:34,height:34,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon n="box" size={16} color={C.sub}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                      <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>Costo ${p.costo?.toLocaleString("es-AR")||0} · Stock: {p.stockInicial} {p.unidad?.toLowerCase()}</div>
                    </div>
                    <Icon n="plus" size={15} color={C.gold}/>
                  </button>
                ))}
              </div>
          }
        </Sheet>
      )}
    </div>
  );
}

// ── FINANZAS ──────────────────────────────────────────────────
// ── FINANZAS: helpers ───────────────────────────────────────────
const METODOS_PAGO = ["Efectivo","Transferencia","Mercado Pago","Tarjeta","Otro"];
const CATS_ING = ["Ventas","Adelantos","Otro"];
const CATS_EGR = ["Insumos","Packaging","Envíos","Publicidad","Servicios","Alquiler","Sueldos","Equipamiento","Impuestos","Otros"];
const TIPOS_GASTO = ["Variable","Fijo"];
const FRECUENCIAS_RECURRENTE = ["Semanal","Mensual","Anual","Personalizada"];
const PERIODOS = ["Hoy","Esta semana","Este mes","Mes anterior","Personalizado"];

function parseFechaAR(f){
  const [d,m,y] = f.split("/").map(Number);
  return new Date(y,m-1,d);
}

function rangoPeriodo(periodo, desde, hasta){
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  let inicio,fin;
  switch(periodo){
    case "Hoy": inicio=new Date(hoy); fin=new Date(hoy); break;
    case "Esta semana": inicio=new Date(hoy); inicio.setDate(hoy.getDate()-hoy.getDay()); fin=new Date(inicio); fin.setDate(inicio.getDate()+6); break;
    case "Mes anterior": inicio=new Date(hoy.getFullYear(),hoy.getMonth()-1,1); fin=new Date(hoy.getFullYear(),hoy.getMonth(),0); break;
    case "Personalizado": inicio=desde?new Date(desde+"T00:00"):new Date(hoy.getFullYear(),hoy.getMonth(),1); fin=hasta?new Date(hasta+"T00:00"):new Date(hoy); break;
    case "Este mes":
    default: inicio=new Date(hoy.getFullYear(),hoy.getMonth(),1); fin=new Date(hoy.getFullYear(),hoy.getMonth()+1,0);
  }
  fin=new Date(fin); fin.setHours(23,59,59,999);
  return {inicio,fin};
}

function rangoAnterior({inicio,fin}){
  const duracionMs = fin.getTime()-inicio.getTime();
  const finAnt = new Date(inicio.getTime()-1);
  const inicioAnt = new Date(finAnt.getTime()-duracionMs);
  return {inicio:inicioAnt, fin:finAnt};
}

function enRango(fechaStr,inicio,fin){
  const d = parseFechaAR(fechaStr);
  return d>=inicio && d<=fin;
}

function labelPeriodo(periodo){
  const hoy=new Date();
  if(periodo==="Este mes") return `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`;
  if(periodo==="Mes anterior"){ let m=hoy.getMonth()-1,y=hoy.getFullYear(); if(m<0){m=11;y--;} return `${MESES[m]} ${y}`; }
  return periodo;
}

// ── SELECTOR DE PERÍODO ─────────────────────────────────────────
function SelectorPeriodo({periodo,setPeriodo,desde,setDesde,hasta,setHasta}){
  const [open,setOpen]=useState(false);
  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        <Icon n="calendar" size={14} color={C.sub}/>
        <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{labelPeriodo(periodo)}</span>
        <Icon n={open?"chevU":"chevD"} size={13} color={C.muted}/>
      </button>
      {open&&(
        <div style={{marginTop:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px",display:"flex",flexDirection:"column",gap:4}}>
          {PERIODOS.map(p=>(
            <button key={p} onClick={()=>{setPeriodo(p);if(p!=="Personalizado")setOpen(false);}} style={{background:periodo===p?C.gold+"15":"transparent",border:"none",borderRadius:10,padding:"9px 12px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:periodo===p?C.gold:C.text,fontWeight:periodo===p?700:500,fontFamily:"'Inter',sans-serif"}}>{p}</span>
              {periodo===p&&<Icon n="check" size={14} color={C.gold}/>}
            </button>
          ))}
          {periodo==="Personalizado"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:"6px 6px 2px"}}>
              <div><FLbl c="Desde"/><TInput type="date" value={desde} onChange={setDesde}/></div>
              <div><FLbl c="Hasta"/><TInput type="date" value={hasta} onChange={setHasta}/></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── REGISTRAR VENTA ─────────────────────────────────────────────
function RegistrarVentaForm({productos,onClose,onSave}){
  const [showPicker,setShowPicker]=useState(false);
  const [busquedaProd,setBusquedaProd]=useState("");
  const [productoSel,setProductoSel]=useState(null);
  const [nombreLibre,setNombreLibre]=useState("");
  const [costoLibre,setCostoLibre]=useState(0);
  const [cantidad,setCantidad]=useState(1);
  const [precio,setPrecio]=useState(0);
  const [metodoPago,setMetodoPago]=useState("Efectivo");
  const [descontarStock,setDescontarStock]=useState(true);
  const [masOpciones,setMasOpciones]=useState(false);
  const [categoria,setCategoria]=useState(CATS_ING[0]);
  const [fecha,setFecha]=useState(new Date().toISOString().slice(0,10));
  const [nota,setNota]=useState("");

  const elegirProducto = (p) => {
    setProductoSel(p);
    setPrecio(p.precioVenta||0);
    setShowPicker(false);
    setBusquedaProd("");
  };

  const nombre = productoSel ? productoSel.nombre : nombreLibre;
  const costoUnit = productoSel ? (productoSel.costo||0) : (costoLibre||0);
  const ingreso = (precio||0)*(cantidad||0);
  const costoTotal = costoUnit*(cantidad||0);
  const ganancia = ingreso-costoTotal;
  const rentabilidad = ingreso>0 ? Math.round((ganancia/ingreso)*1000)/10 : 0;

  const productosFiltrados = (productos||[]).filter(p=>p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <FLbl c="Producto"/>
        {productoSel ? (
          <button onClick={()=>setShowPicker(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:C.bg,borderRadius:12,padding:"11px 14px",border:"none",cursor:"pointer",textAlign:"left"}}>
            <Icon n="box" size={16} color={C.sub}/>
            <span style={{flex:1,fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Inter',sans-serif"}}>{productoSel.nombre}</span>
            <Icon n="chevD" size={14} color={C.muted}/>
          </button>
        ) : (
          productos&&productos.length>0 ? (
            <button onClick={()=>setShowPicker(true)} style={{width:"100%",background:C.bg,borderRadius:12,padding:"11px 14px",border:"none",cursor:"pointer",textAlign:"left",color:C.muted,fontSize:14,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              Buscar o elegir producto del stock <Icon n="chevD" size={14} color={C.muted}/>
            </button>
          ) : (
            <TInput placeholder="Nombre del producto" value={nombreLibre} onChange={setNombreLibre}/>
          )
        )}
      </div>

      {!productoSel&&nombreLibre&&(
        <div><FLbl c="Costo (opcional, para calcular ganancia)"/><TInput type="number" placeholder="0" value={costoLibre||""} onChange={setCostoLibre}/></div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><FLbl c={translateText("Cantidad")}/><TInput type="number" placeholder="1" value={cantidad||""} onChange={setCantidad}/></div>
        <div><FLbl c="Precio unitario"/><TInput type="number" placeholder="0" value={precio||""} onChange={setPrecio}/></div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg,borderRadius:10,padding:"9px 12px"}}>
        <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Total")}</span>
        <span style={{fontSize:16,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${ingreso.toLocaleString("es-AR")}</span>
      </div>

      <div>
        <FLbl c={translateText("Método de pago")}/>
        <PillSelect options={METODOS_PAGO} value={metodoPago} onChange={setMetodoPago}/>
      </div>

      {productoSel&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>Descontar del stock</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>Resta {cantidad||0} {productoSel.unidad?.toLowerCase()} del inventario</div>
          </div>
          <Toggle on={descontarStock} setOn={setDescontarStock}/>
        </div>
      )}

      <button onClick={()=>setMasOpciones(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más opciones") }</span>
        <Icon n={masOpciones?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masOpciones&&(
        <div style={{display:"flex",flexDirection:"column",gap:16,background:C.bg,borderRadius:14,padding:"14px 14px"}}>
          <div><FLbl c={translateText("Fecha")}/><TInput type="date" value={fecha} onChange={setFecha}/></div>
          <div>
            <FLbl c={translateText("Categoría")}/>
            <PillSelect options={CATS_ING} value={categoria} onChange={setCategoria}/>
          </div>
          <div><FLbl c="Nota (opcional)"/><TInput placeholder="Detalle adicional" value={nota} onChange={setNota}/></div>
        </div>
      )}

      {ingreso>0&&(
        <div style={{background:C.green+"10",border:`1.5px solid ${C.green}30`,borderRadius:14,padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>Ingreso</span><span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${ingreso.toLocaleString("es-AR")}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Costo")}</span><span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${costoTotal.toLocaleString("es-AR")}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Ganancia") }</span><span style={{fontSize:14,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>${ganancia.toLocaleString("es-AR")}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Rentabilidad") }</span><span style={{fontSize:14,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{rentabilidad}%</span></div>
        </div>
      )}

      <PrimaryBtn label={translateText("Registrar venta")} disabled={!nombre||!cantidad||!precio} onClick={()=>{
        const d = new Date(fecha+"T00:00");
        onSave&&onSave({
          tipo:"Ingreso", monto:ingreso, concepto:`Venta: ${cantidad}x ${nombre}`, categoria, nota,
          fecha:d.toLocaleDateString("es-AR"), hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
          producto:productoSel?productoSel.nombre:null, cantidad, costoTotal, ganancia, metodoPago,
          descontarStock: productoSel? descontarStock : false,
        });
        onClose&&onClose();
      }}/>

      {showPicker&&(
        <Sheet title="Elegir producto" onClose={()=>setShowPicker(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <TInput placeholder="Buscar producto..." value={busquedaProd} onChange={setBusquedaProd}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {productosFiltrados.length===0
                ? <DashedEmpty icon="box" text="No se encontraron productos"/>
                : productosFiltrados.map((p,i)=>(
                    <button key={i} onClick={()=>elegirProducto(p)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Icon n="box" size={16} color={C.sub}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>${p.precioVenta?.toLocaleString("es-AR")||0} · Stock: {p.stockInicial} {p.unidad?.toLowerCase()}</div>
                      </div>
                    </button>
                  ))
              }
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ── REGISTRAR GASTO ──────────────────────────────────────────────
function RegistrarGastoForm({productos,onClose,onSave}){
  const [concepto,setConcepto]=useState("");
  const [monto,setMonto]=useState(0);
  const [categoria,setCategoria]=useState(CATS_EGR[0]);
  const [categoriaCustom,setCategoriaCustom]=useState("");
  const [tipoGasto,setTipoGasto]=useState("Variable");
  const [metodoPago,setMetodoPago]=useState("Efectivo");
  const [fecha,setFecha]=useState(new Date().toISOString().slice(0,10));
  const [masOpciones,setMasOpciones]=useState(false);
  const [nota,setNota]=useState("");
  const [recurrente,setRecurrente]=useState(false);
  const [frecuencia,setFrecuencia]=useState("Mensual");
  const [reponerStock,setReponerStock]=useState(false);
  const [showPicker,setShowPicker]=useState(false);
  const [productoSel,setProductoSel]=useState(null);
  const [cantidadReponer,setCantidadReponer]=useState(0);

  const categoriaFinal = categoria==="Otros" && categoriaCustom ? categoriaCustom : categoria;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Concepto"/><TInput placeholder="Ej: Harina" value={concepto} onChange={setConcepto}/></div>
      <div><FLbl c={translateText("Importe")}/><TInput type="number" placeholder="0" value={monto||""} onChange={setMonto}/></div>

      <div>
        <FLbl c={translateText("Categoría")}/>
        <PillSelect options={CATS_EGR} value={categoria} onChange={setCategoria}/>
        {categoria==="Otros"&&(
          <div style={{marginTop:8}}><TInput placeholder="Nombre de la categoría" value={categoriaCustom} onChange={setCategoriaCustom}/></div>
        )}
      </div>

      <div>
        <FLbl c="Tipo de gasto"/>
        <PillSelect options={TIPOS_GASTO} value={tipoGasto} onChange={setTipoGasto}
          colorMap={{Fijo:{color:C.amber,bg:C.amber+"18"},Variable:{color:C.sub,bg:C.text+"10"}}}/>
      </div>

      {categoria==="Insumos"&&productos&&productos.length>0&&(
        <div style={{background:C.blue+"10",borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{translateText("Reponer stock") }</div>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{translateText("Sumar esta compra al inventario") }</div>
            </div>
            <Toggle on={reponerStock} setOn={setReponerStock}/>
          </div>
          {reponerStock&&(
            <>
              <button onClick={()=>setShowPicker(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,background:C.card,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left"}}>
                <Icon n="box" size={14} color={C.sub}/>
                <span style={{flex:1,fontSize:13,fontWeight:600,color:productoSel?C.text:C.muted,fontFamily:"'Inter',sans-serif"}}>{productoSel?productoSel.nombre:"Elegir producto"}</span>
                <Icon n="chevD" size={13} color={C.muted}/>
              </button>
              {productoSel&&(
                <div><FLbl c={`Cantidad a sumar (${productoSel.unidad?.toLowerCase()})`}/><TInput type="number" placeholder="0" value={cantidadReponer||""} onChange={setCantidadReponer}/></div>
              )}
            </>
          )}
        </div>
      )}

      <button onClick={()=>setMasOpciones(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más opciones") }</span>
        <Icon n={masOpciones?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masOpciones && (
        <div style={{display:"flex",flexDirection:"column",gap:16,background:C.bg,borderRadius:14,padding:"14px 14px"}}>
          <div><FLbl c={translateText("Fecha")}/><TInput type="date" value={fecha} onChange={setFecha}/></div>
          <div>
            <FLbl c={translateText("Método de pago")}/>
            <PillSelect options={METODOS_PAGO} value={metodoPago} onChange={setMetodoPago}/>
          </div>
          <div><FLbl c="Nota (opcional)"/><TInput placeholder="Detalle adicional" value={nota} onChange={setNota}/></div>
          <div style={{height:1,background:C.border}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{translateText("Gasto recurrente") }</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{translateText("Ej: internet, alquiler") }</div>
            </div>
            <Toggle on={recurrente} setOn={setRecurrente}/>
          </div>
          {recurrente&&(
            <div>
              <FLbl c="Frecuencia"/>
              <PillSelect options={FRECUENCIAS_RECURRENTE} value={frecuencia} onChange={setFrecuencia}/>
            </div>
          )}
        </div>
      )}

      <PrimaryBtn label={translateText("Registrar gasto")} disabled={!concepto||!monto} onClick={()=>{
        const d = new Date(fecha+"T00:00");
        onSave&&onSave({
          tipo:"Egreso", monto:Math.abs(monto), concepto, categoria:categoriaFinal, fijo:tipoGasto==="Fijo", metodoPago, nota,
          fecha:d.toLocaleDateString("es-AR"), hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
          recurrente, frecuencia:recurrente?frecuencia:null,
          reponerStock: reponerStock&&productoSel?{producto:productoSel.nombre,cantidad:cantidadReponer||0}:null,
        });
        onClose&&onClose();
      }}/>

      {showPicker&&(
        <Sheet title="Elegir producto" onClose={()=>setShowPicker(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(productos||[]).map((p,i)=>(
              <button key={i} onClick={()=>{setProductoSel(p);setShowPicker(false);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <div style={{width:34,height:34,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon n="box" size={16} color={C.sub}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                  <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>Stock: {p.stockInicial} {p.unidad?.toLowerCase()}</div>
                </div>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ── EDITAR MOVIMIENTO (genérico) ─────────────────────────────────
function EditarMovimientoForm({movimiento,onClose,onSave}){
  const [concepto,setConcepto]=useState(movimiento.concepto);
  const [monto,setMonto]=useState(movimiento.monto);
  const [categoria,setCategoria]=useState(movimiento.categoria);
  const opciones = movimiento.tipo==="Ingreso" ? CATS_ING : CATS_EGR;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Concepto"/><TInput value={concepto} onChange={setConcepto}/></div>
      <div><FLbl c={translateText("Importe")}/><TInput type="number" value={monto||""} onChange={setMonto}/></div>
      <div>
        <FLbl c={translateText("Categoría")}/>
        <PillSelect options={opciones.includes(categoria)?opciones:[...opciones,categoria]} value={categoria} onChange={setCategoria}/>
      </div>
      <PrimaryBtn label="Guardar cambios" disabled={!concepto||!monto} onClick={()=>{
        onSave&&onSave({...movimiento,concepto,monto:Math.abs(monto),categoria});
        onClose&&onClose();
      }}/>
    </div>
  );
}

// ── HISTORIAL DE MOVIMIENTOS (completo) ──────────────────────────
function HistorialMovimientos({movs,onEditar,onEliminar}){
  const [tab,setTab]=useState("Todos");
  const [busqueda,setBusqueda]=useState("");
  const [categoriaFiltro,setCategoriaFiltro]=useState("Todas");
  const [detalle,setDetalle]=useState(null);
  const [editando,setEditando]=useState(null);
  const [confirmarBorrar,setConfirmarBorrar]=useState(null);

  const categoriasDisponibles = ["Todas",...new Set(movs.map(m=>m.categoria))];

  const filtrados = movs.filter(m=>{
    if(tab==="Ventas"&&m.tipo!=="Ingreso") return false;
    if(tab==="Gastos"&&m.tipo!=="Egreso") return false;
    if(categoriaFiltro!=="Todas"&&m.categoria!==categoriaFiltro) return false;
    if(busqueda&&!m.concepto.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>b.fecha.localeCompare(a.fecha));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <TInput placeholder="Buscar movimientos..." value={busqueda} onChange={setBusqueda}/>
      <TabBar tabs={["Todos","Ventas","Gastos"]} active={tab} setActive={setTab}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
        {categoriasDisponibles.map(c=>(
          <button key={c} onClick={()=>setCategoriaFiltro(c)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${categoriaFiltro===c?C.text:C.border}`,background:categoriaFiltro===c?C.text:"transparent",color:categoriaFiltro===c?"#fff":C.sub,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            {c}
          </button>
        ))}
      </div>

      {filtrados.length===0
        ? <DashedEmpty icon="dollar" text="Sin movimientos"/>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtrados.map((m,i)=>(
              <Card key={i} style={{padding:"12px 14px",cursor:"pointer"}} onClick={()=>setDetalle(m)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:10,background:m.tipo==="Ingreso"?"#1A7A5015":"#C0404015",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon n={m.tipo==="Ingreso"?"trending":"trendDn"} size={14} color={m.tipo==="Ingreso"?C.green:C.red}/>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{m.concepto}</div>
                      <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{m.categoria} · {m.fecha}{m.metodoPago?` · ${m.metodoPago}`:""}</div>
                    </div>
                  </div>
                  <span style={{fontSize:15,fontWeight:800,color:m.tipo==="Ingreso"?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>
                    {m.tipo==="Ingreso"?"+":"-"}${m.monto.toLocaleString("es-AR")}
                  </span>
                </div>
              </Card>
            ))}
          </div>
      }

      {detalle&&(
        <Sheet title={detalle.concepto} onClose={()=>setDetalle(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Importe") }</div><div style={{fontSize:16,fontWeight:800,color:detalle.tipo==="Ingreso"?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>{detalle.tipo==="Ingreso"?"+":"-"}${detalle.monto.toLocaleString("es-AR")}</div></div>
              <div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Fecha")}</div><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{detalle.fecha}</div></div>
              <div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Categoría")}</div><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{detalle.categoria}</div></div>
              {detalle.metodoPago&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Método de pago")}</div><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{detalle.metodoPago}</div></div>}
              {detalle.producto&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>Producto</div><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{detalle.producto}</div></div>}
              {detalle.ganancia!=null&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Ganancia") }</div><div style={{fontSize:14,fontWeight:700,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>${detalle.ganancia.toLocaleString("es-AR")}</div></div>}
              {detalle.fijo!=null&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Tipo") }</div><div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{detalle.fijo?"Fijo":"Variable"}</div></div>}
            </div>
            {detalle.nota&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>"{detalle.nota}"</div>}
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <button onClick={()=>{setEditando(detalle);setDetalle(null);}} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Icon n="edit" size={14} color={C.sub}/>{translateText("Editar")}</button>
              <button onClick={()=>{setConfirmarBorrar(detalle);setDetalle(null);}} style={{flex:1,padding:"12px",borderRadius:14,border:`1.5px solid ${C.red}`,background:C.red+"12",color:C.red,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <Icon n="trash" size={14} color={C.red}/>{translateText("Eliminar")}</button>
            </div>
          </div>
        </Sheet>
      )}

      {editando&&(
        <Sheet title="Editar movimiento" onClose={()=>setEditando(null)}>
          <EditarMovimientoForm movimiento={editando} onClose={()=>setEditando(null)} onSave={onEditar}/>
        </Sheet>
      )}

      {confirmarBorrar&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onClick={()=>setConfirmarBorrar(null)}>
          <div style={{background:C.card,borderRadius:20,padding:"24px 22px",width:"85%",maxWidth:320,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("¿Eliminar este movimiento?") }</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginBottom:18}}>{confirmarBorrar.concepto} · ${confirmarBorrar.monto.toLocaleString("es-AR")}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmarBorrar(null)} style={{flex:1,padding:"11px",borderRadius:12,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Cancelar")}</button>
              <button onClick={()=>{onEliminar(confirmarBorrar);setConfirmarBorrar(null);}} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:C.red,color:"#fff",fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Eliminar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANÁLISIS FINANCIERO ──────────────────────────────────────────
function AnalisisFinanciero({movs,periodo}){
  const {inicio,fin} = rangoPeriodo(periodo);
  const {inicio:inicioAnt,fin:finAnt} = rangoAnterior({inicio,fin});

  const movsPeriodo   = movs.filter(m=>enRango(m.fecha,inicio,fin));
  const movsAnterior  = movs.filter(m=>enRango(m.fecha,inicioAnt,finAnt));

  const ventas   = movsPeriodo.filter(m=>m.tipo==="Ingreso").reduce((a,m)=>a+m.monto,0);
  const gastos   = movsPeriodo.filter(m=>m.tipo==="Egreso").reduce((a,m)=>a+m.monto,0);
  const ganancia = ventas-gastos;
  const rentabilidad = ventas>0 ? Math.round((ganancia/ventas)*1000)/10 : 0;

  const ventasAnt = movsAnterior.filter(m=>m.tipo==="Ingreso").reduce((a,m)=>a+m.monto,0);
  const gastosAnt = movsAnterior.filter(m=>m.tipo==="Egreso").reduce((a,m)=>a+m.monto,0);

  const varVentas = ventasAnt>0 ? Math.round(((ventas-ventasAnt)/ventasAnt)*100) : null;
  const varGastos = gastosAnt>0 ? Math.round(((gastos-gastosAnt)/gastosAnt)*100) : null;

  const ingresosMovs = movsPeriodo.filter(m=>m.tipo==="Ingreso");
  const egresosMovs  = movsPeriodo.filter(m=>m.tipo==="Egreso");

  const costosFijos     = egresosMovs.filter(m=>m.fijo).reduce((a,m)=>a+m.monto,0);
  const costosVariables = egresosMovs.filter(m=>!m.fijo).reduce((a,m)=>a+m.monto,0);

  const porProducto = {};
  ingresosMovs.filter(m=>m.producto).forEach(m=>{
    const k=m.producto;
    porProducto[k]=porProducto[k]||{unidades:0,ingreso:0};
    porProducto[k].unidades+=(m.cantidad||0);
    porProducto[k].ingreso+=m.monto;
  });
  const productoTop = Object.entries(porProducto).sort((a,b)=>b[1].unidades-a[1].unidades)[0];

  const porCategoria = {};
  egresosMovs.forEach(m=>{ porCategoria[m.categoria]=(porCategoria[m.categoria]||0)+m.monto; });
  const categoriaTop = Object.entries(porCategoria).sort((a,b)=>b[1]-a[1])[0];

  const porMetodo = {};
  ingresosMovs.filter(m=>m.metodoPago).forEach(m=>{ porMetodo[m.metodoPago]=(porMetodo[m.metodoPago]||0)+1; });
  const metodoTop = Object.entries(porMetodo).sort((a,b)=>b[1]-a[1])[0];

  const hoy=new Date();
  const dias7 = Array.from({length:7},(_,i)=>{
    const d=new Date(hoy); d.setDate(d.getDate()-(6-i));
    const key=d.toLocaleDateString("es-AR");
    const ing = movs.filter(m=>m.tipo==="Ingreso"&&m.fecha===key).reduce((a,m)=>a+m.monto,0);
    const egr = movs.filter(m=>m.tipo==="Egreso"&&m.fecha===key).reduce((a,m)=>a+m.monto,0);
    return {v:ing, egr, label:d.toLocaleDateString("es-AR",{weekday:"narrow"})};
  });
  const dias7Labels = dias7.map(d=>d.label);
  const maxBarra = Math.max(ventas,gastos,Math.abs(ganancia),1);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card style={{padding:"14px"}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Ventas")}</div>
          <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${ventas.toLocaleString("es-AR")}</div>
        </Card>
        <Card style={{padding:"14px"}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Gastos")}</div>
          <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${gastos.toLocaleString("es-AR")}</div>
        </Card>
        <Card style={{padding:"14px"}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Ganancia estimada") }</div>
          <div style={{fontSize:18,fontWeight:800,color:ganancia>=0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>${ganancia.toLocaleString("es-AR")}</div>
        </Card>
        <Card style={{padding:"14px"}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Rentabilidad") }</div>
          <div style={{fontSize:18,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{rentabilidad}%</div>
        </Card>
      </div>

      {(varVentas!=null||varGastos!=null)&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {varVentas!=null&&(
            <div style={{display:"flex",alignItems:"center",gap:8,background:(varVentas>=0?C.green:C.red)+"10",borderRadius:12,padding:"11px 14px"}}>
              <Icon n={varVentas>=0?"trending":"trendDn"} size={15} color={varVentas>=0?C.green:C.red}/>
              <span style={{fontSize:12,color:varVentas>=0?C.green:C.red,fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                Vendiste {Math.abs(varVentas)}% {varVentas>=0?"más":"menos"} que el período anterior
              </span>
            </div>
          )}
          {varGastos!=null&&(
            <div style={{display:"flex",alignItems:"center",gap:8,background:(varGastos<=0?C.green:C.red)+"10",borderRadius:12,padding:"11px 14px"}}>
              <Icon n={varGastos<=0?"trending":"trendDn"} size={15} color={varGastos<=0?C.green:C.red}/>
              <span style={{fontSize:12,color:varGastos<=0?C.green:C.red,fontFamily:"'Inter',sans-serif",fontWeight:600}}>
                Tus gastos {varGastos>=0?"aumentaron":"bajaron"} un {Math.abs(varGastos)}% respecto al período anterior
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <SLbl c="Ventas, gastos y ganancia"/>
        <Card style={{padding:"14px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Ventas",ventas,C.green],["Gastos",gastos,C.red],["Ganancia",ganancia,C.gold]].map(([l,v,c])=>(
              <div key={l}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{l}</span>
                  <span style={{fontSize:12,fontWeight:700,color:c,fontFamily:"'Montserrat',sans-serif"}}>${Math.abs(v).toLocaleString("es-AR")}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:C.bg}}>
                  <div style={{height:"100%",width:`${Math.min((Math.abs(v)/maxBarra)*100,100)}%`,borderRadius:4,background:c,transition:"width .5s ease"}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SLbl c="Evolución de ventas (últimos 7 días)"/>
        <Card style={{padding:"14px"}}>
          <WeekBars data={dias7.map(d=>({v:d.v}))} labels={dias7Labels} color={C.green} h={70}/>
        </Card>
      </div>
      <div>
        <SLbl c="Evolución de gastos (últimos 7 días)"/>
        <Card style={{padding:"14px"}}>
          <WeekBars data={dias7.map(d=>({v:d.egr}))} labels={dias7Labels} color={C.red} h={70}/>
        </Card>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <SLbl c="Datos destacados"/>
        {productoTop&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
            <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Producto más vendido") }</span>
            <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{productoTop[0]} ({productoTop[1].unidades} u.)</span>
          </div>
        )}
        {categoriaTop&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
            <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Categoría con mayores gastos") }</span>
            <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{categoriaTop[0]} (${categoriaTop[1].toLocaleString("es-AR")})</span>
          </div>
        )}
        {metodoTop&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
            <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Método de pago más usado") }</span>
            <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{metodoTop[0]}</span>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
          <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{translateText("Costos fijos / variables") }</span>
          <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${costosFijos.toLocaleString("es-AR")} / ${costosVariables.toLocaleString("es-AR")}</span>
        </div>
      </div>
    </div>
  );
}

// ── FINANZAS ──────────────────────────────────────────────────
function Finanzas({movs,setMovs,productos,setProductos}){
  const [modalVenta,setModalVenta]=useState(false);
  const [modalGasto,setModalGasto]=useState(false);
  const [calcOpen,setCalcOpen]=useState(false);
  const [calcTab,setCalcTab]=useState("calculadora");
  const [vista,setVista]=useState("resumen"); // resumen | analisis | historial
  const [periodo,setPeriodo]=useState("Este mes");
  const [desde,setDesde]=useState("");
  const [hasta,setHasta]=useState("");

  const {inicio,fin} = rangoPeriodo(periodo,desde,hasta);
  const movsPeriodo = movs.filter(m=>enRango(m.fecha,inicio,fin));

  const ventas   = movsPeriodo.filter(m=>m.tipo==="Ingreso").reduce((a,m)=>a+m.monto,0);
  const gastos   = movsPeriodo.filter(m=>m.tipo==="Egreso").reduce((a,m)=>a+m.monto,0);
  const ganancia = ventas-gastos;
  const rentabilidad = ventas>0 ? Math.round((ganancia/ventas)*1000)/10 : 0;

  const registrarVenta = (mov) => {
    setMovs(ms=>[mov,...ms]);
    if(mov.producto && mov.descontarStock && setProductos){
      setProductos(ps=>ps.map(p=>p.nombre===mov.producto
        ? { ...p,
            stockInicial: Math.max(0,p.stockInicial-mov.cantidad),
            vendidos: (p.vendidos||0)+mov.cantidad,
            historial:[...(p.historial||[]),{tipo:"Venta",cantidad:-mov.cantidad,fecha:mov.fecha,hora:mov.hora}]
          }
        : p
      ));
    }
  };

  const registrarGasto = (mov) => {
    setMovs(ms=>[mov,...ms]);
    if(mov.reponerStock && mov.reponerStock.cantidad>0 && setProductos){
      setProductos(ps=>ps.map(p=>p.nombre===mov.reponerStock.producto
        ? { ...p,
            stockInicial: p.stockInicial+mov.reponerStock.cantidad,
            historial:[...(p.historial||[]),{tipo:"Ingreso",cantidad:mov.reponerStock.cantidad,fecha:mov.fecha,hora:mov.hora}]
          }
        : p
      ));
    }
  };

  const editarMovimiento = (actualizado) => {
    setMovs(ms=>ms.map(m=>m===actualizado||(m.concepto===actualizado.concepto&&m.fecha===actualizado.fecha&&m.monto===actualizado.monto)?actualizado:m));
  };
  const eliminarMovimiento = (aEliminar) => {
    setMovs(ms=>ms.filter(m=>m!==aEliminar));
  };

  const abrirCalc = (tab) => { setCalcTab(tab); setCalcOpen(true); };

  if(vista==="analisis"){
    return (
      <SubPage title="Análisis financiero" onBack={()=>setVista("resumen")}>
        <AnalisisFinanciero movs={movs} periodo={periodo}/>
      </SubPage>
    );
  }

  if(vista==="historial"){
    return (
      <SubPage title="Historial de movimientos" onBack={()=>setVista("resumen")}>
        <HistorialMovimientos movs={movs} onEditar={editarMovimiento} onEliminar={eliminarMovimiento}/>
      </SubPage>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:4}}>
        <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Finanzas")}</h1>
      </div>

      <SelectorPeriodo periodo={periodo} setPeriodo={setPeriodo} desde={desde} setDesde={setDesde} hasta={hasta} setHasta={setHasta}/>

      {/* ═══ RESUMEN SIMPLE ═══ */}
      <Card style={{padding:"18px 18px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:5}}>{translateText("Ventas")}</div>
            <div style={{fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${ventas.toLocaleString("es-AR")}</div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:5}}>{translateText("Gastos")}</div>
            <div style={{fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>${gastos.toLocaleString("es-AR")}</div>
          </div>
        </div>
        <div style={{height:1,background:C.border,margin:"14px 0"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:5}}>{translateText("Ganancia estimada") }</div>
            <div style={{fontSize:22,fontWeight:800,color:ganancia>=0?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>${ganancia.toLocaleString("es-AR")}</div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:5}}>{translateText("Rentabilidad") }</div>
            <div style={{fontSize:22,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{rentabilidad}%</div>
          </div>
        </div>
        <button onClick={()=>setVista("analisis")} style={{marginTop:16,width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,color:C.gold,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
          {translateText("Ver análisis detallado") } <Icon n="chevR" size={14} color={C.gold}/>
        </button>
      </Card>

      {/* ═══ ACCIONES RÁPIDAS ═══ */}
      <div>
        <SLbl c="Acciones rápidas"/>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>setModalVenta(true)} style={{background:C.green,border:"none",borderRadius:16,padding:"18px 14px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <Icon n="plus" size={20} color="#fff"/>
              <span style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"'Montserrat',sans-serif"}}>{translateText("Registrar venta") }</span>
            </button>
            <button onClick={()=>setModalGasto(true)} style={{background:C.red,border:"none",borderRadius:16,padding:"18px 14px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <Icon n="plus" size={20} color="#fff"/>
              <span style={{fontSize:14,fontWeight:800,color:"#fff",fontFamily:"'Montserrat',sans-serif"}}>{translateText("Registrar gasto") }</span>
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={()=>abrirCalc("calculadora")} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <Icon n="calc" size={15} color={C.sub}/>
              <span style={{fontSize:12,fontWeight:700,color:C.sub,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Calcular precio") }</span>
            </button>
            <button onClick={()=>abrirCalc("regla3")} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <Icon n="calc" size={15} color={C.sub}/>
              <span style={{fontSize:12,fontWeight:700,color:C.sub,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Regla de 3") }</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SLbl c="Movimientos recientes" style={{marginBottom:0}}/>
        </div>
        {movsPeriodo.length===0
          ? <DashedEmpty icon="dollar" text="Sin movimientos en este período"/>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[...movsPeriodo].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,5).map((m,i)=>(
                <Card key={i} style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:10,background:m.tipo==="Ingreso"?"#1A7A5015":"#C0404015",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Icon n={m.tipo==="Ingreso"?"trending":"trendDn"} size={14} color={m.tipo==="Ingreso"?C.green:C.red}/>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{m.concepto}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{m.categoria} · {m.fecha}</div>
                      </div>
                    </div>
                    <span style={{fontSize:15,fontWeight:800,color:m.tipo==="Ingreso"?C.green:C.red,fontFamily:"'Montserrat',sans-serif"}}>
                      {m.tipo==="Ingreso"?"+":"-"}${m.monto.toLocaleString("es-AR")}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
        }
        <button onClick={()=>setVista("historial")} style={{marginTop:10,width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,color:C.gold,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
          {translateText("Ver todos los movimientos") } <Icon n="chevR" size={14} color={C.gold}/>
        </button>
      </div>

      {modalVenta&&(
        <Sheet title={translateText("Registrar venta")} onClose={()=>setModalVenta(false)}>
          <RegistrarVentaForm productos={productos||[]} onClose={()=>setModalVenta(false)} onSave={registrarVenta}/>
        </Sheet>
      )}

      {modalGasto&&(
        <Sheet title={translateText("Registrar gasto")} onClose={()=>setModalGasto(false)}>
          <RegistrarGastoForm productos={productos||[]} onClose={()=>setModalGasto(false)} onSave={registrarGasto}/>
        </Sheet>
      )}

      {calcOpen&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end",zIndex:300,backdropFilter:"blur(4px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setCalcOpen(false);}}>
          <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"95%",overflowY:"auto",boxShadow:"0 -4px 32px rgba(0,0,0,.15)",animation:"slideUp .22s ease"}}>
            <div style={{padding:"0 18px 32px"}}>
              <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"14px auto 0"}}/>
              <CalculadoraPrecio onClose={()=>setCalcOpen(false)} productos={productos} setProductos={setProductos} initialTab={calcTab}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROVEEDORES ───────────────────────────────────────────────
// ── PROVEEDORES: config y helpers ──────────────────────────────
const NIVEL_PRECIO_CFG = {
  "Barato":    { color:C.green, bg:C.green+"18", rank:0 },
  "Intermedio":{ color:C.amber, bg:C.amber+"18", rank:1 },
  "Caro":      { color:C.red,   bg:C.red+"18",   rank:2 },
};
const TIEMPO_PROV_ORDER = { "1 día":0, "3 días":1, "1 semana":2, "2 semanas":3, "Personalizado":9 };

function soloDigitos(s){ return (s||"").replace(/\D/g,""); }

function tiempoEntregaLabel(p){
  return p.tiempoReposicion==="Personalizado" && p.tiempoPersonalizado ? p.tiempoPersonalizado : p.tiempoReposicion;
}

function TablaComparacion({items}){
  if(items.length<2) return null;

  const conPrecio  = items.filter(p=>p.nivelPrecios);
  const conTiempo  = items.filter(p=>p.tiempoReposicion && p.tiempoReposicion!=="Personalizado");
  const masBarato = conPrecio.length>0 ? conPrecio.reduce((a,b)=>NIVEL_PRECIO_CFG[b.nivelPrecios].rank<NIVEL_PRECIO_CFG[a.nivelPrecios].rank?b:a) : null;
  const masRapido  = conTiempo.length>0 ? conTiempo.reduce((a,b)=>(TIEMPO_PROV_ORDER[b.tiempoReposicion]<TIEMPO_PROV_ORDER[a.tiempoReposicion]?b:a)) : null;

  const filas = [
    {label:"Rubro",         render:p=>p.rubro||"—"},
    {label:"Precio",        render:p=>p.nivelPrecios||"—",                 destacar:p=>p===masBarato},
    {label:"Entrega",       render:p=>tiempoEntregaLabel(p)||"—",          destacar:p=>p===masRapido},
    {label:"Compra mínima", render:p=>p.compraMinima?`${p.compraMinima} u.`:"—"},
    {label:"Descuento",     render:p=>p.promociones||"—"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:`96px repeat(${items.length},minmax(104px,1fr))`,gap:1,background:C.border,borderRadius:14,overflow:"hidden",minWidth:96+items.length*104}}>
          <div style={{background:C.bg}}/>
          {items.map((p,i)=>(
            <div key={i} style={{background:C.text,padding:"10px 8px",textAlign:"center"}}>
              <span style={{fontSize:11,fontWeight:800,color:"#fff",fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</span>
            </div>
          ))}
          {filas.map((fila,fi)=>[
            <div key={`l${fi}`} style={{background:C.card,padding:"10px 8px",display:"flex",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.muted,fontWeight:700,fontFamily:"'Montserrat',sans-serif"}}>{fila.label}</span>
            </div>,
            ...items.map((p,pi)=>{
              const destacado = fila.destacar && fila.destacar(p);
              return (
                <div key={`c${fi}-${pi}`} style={{background:destacado?C.gold+"14":C.card,padding:"10px 8px",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:11,fontWeight:destacado?800:600,color:destacado?C.gold:C.text,fontFamily:"'Inter',sans-serif"}}>{fila.render(p)}</span>
                </div>
              );
            })
          ])}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {masBarato&&<div style={{fontSize:11,color:C.green,fontFamily:"'Inter',sans-serif"}}>💰 <strong>{masBarato.nombre}</strong> {translateText("tiene el mejor precio") }</div>}
        {masRapido&&<div style={{fontSize:11,color:C.blue,fontFamily:"'Inter',sans-serif"}}>⚡ <strong>{masRapido.nombre}</strong> {translateText("entrega más rápido") }</div>}
      </div>
    </div>
  );
}

// ── NUEVO PROVEEDOR FORM ───────────────────────────────────────
function NuevoProveedorForm({initial,onClose,onSave}){
  const [nombre,setNombre]=useState(initial?.nombre||"");
  const [rubro,setRubro]=useState(initial?.rubro||"");
  const [telefono,setTelefono]=useState(initial?.telefono||"");
  const [masInfo,setMasInfo]=useState(false);
  const [email,setEmail]=useState(initial?.email||"");
  const [web,setWeb]=useState(initial?.web||"");
  const [redes,setRedes]=useState(initial?.redes||"");
  const [direccion,setDireccion]=useState(initial?.direccion||"");
  const [nivelPrecios,setNivelPrecios]=useState(initial?.nivelPrecios||"");
  const [tiempoReposicion,setTiempoReposicion]=useState(initial?.tiempoReposicion||"");
  const [tiempoPersonalizado,setTiempoPersonalizado]=useState(initial?.tiempoPersonalizado||"");
  const [compraMinima,setCompraMinima]=useState(initial?.compraMinima||"");
  const [promociones,setPromociones]=useState(initial?.promociones||"");
  const [ultimaCompra,setUltimaCompra]=useState(initial?.ultimaCompra||"");
  const [observaciones,setObservaciones]=useState(initial?.observaciones||"");
  const [archivos,setArchivos]=useState(initial?.archivos||[]);
  const [nombreArchivo,setNombreArchivo]=useState("");

  const agregarArchivo=()=>{
    if(!nombreArchivo) return;
    setArchivos(a=>[...a,nombreArchivo]);
    setNombreArchivo("");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Nombre *"/><TInput placeholder="Nombre del proveedor" value={nombre} onChange={setNombre}/></div>
      <div><FLbl c="Rubro"/><TInput placeholder="Ej: Insumos, packaging..." value={rubro} onChange={setRubro}/></div>
      <div><FLbl c={translateText("Teléfono")}/><TInput placeholder="11-1234-5678" type="tel" value={telefono} onChange={setTelefono}/></div>

      <button onClick={()=>setMasInfo(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más información") }</span>
        <Icon n={masInfo?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masInfo && (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <SLbl c="Contacto"/>
            <div><FLbl c="Email"/><TInput placeholder="proveedor@email.com" type="email" value={email} onChange={setEmail}/></div>
            <div><FLbl c="Página web"/><TInput placeholder="www.proveedor.com" value={web} onChange={setWeb}/></div>
            <div><FLbl c="Redes sociales"/><TInput placeholder="@usuario o link" value={redes} onChange={setRedes}/></div>
            <div><FLbl c="Ubicación o dirección"/><TInput placeholder="Dirección o zona" value={direccion} onChange={setDireccion}/></div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <SLbl c="Información comercial"/>
            <div>
              <FLbl c="Nivel de precios"/>
              <PillSelect options={["Barato","Intermedio","Caro"]} value={nivelPrecios} onChange={setNivelPrecios} colorMap={NIVEL_PRECIO_CFG}/>
            </div>
            <div>
              <FLbl c="Tiempo estimado de entrega"/>
              <PillSelect options={["1 día","3 días","1 semana","2 semanas","Personalizado"]} value={tiempoReposicion} onChange={setTiempoReposicion}/>
              {tiempoReposicion==="Personalizado"&&(
                <div style={{marginTop:10}}>
                  <TInput placeholder="Escribí el tiempo de entrega (ej: entre 4 y 6 días)" value={tiempoPersonalizado} onChange={setTiempoPersonalizado}/>
                </div>
              )}
            </div>
            <div><FLbl c={translateText("Compra mínima")}/><TInput type="number" placeholder="0" value={compraMinima} onChange={setCompraMinima}/></div>
            <div><FLbl c="Promociones o descuentos habituales"/><TInput placeholder="Ej: 10% desde 20 unidades" value={promociones} onChange={setPromociones}/></div>
            <div><FLbl c="Última compra (opcional)"/><TInput type="date" value={ultimaCompra} onChange={setUltimaCompra}/></div>
          </div>

          <div>
            <SLbl c="Observaciones"/>
            <TInput placeholder="Ej: Responde tarde, muy buena atención..." value={observaciones} onChange={setObservaciones}/>
          </div>

          <div>
            <SLbl c="Archivos"/>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <TInput placeholder="Nombre del archivo (catálogo, lista de precios...)" value={nombreArchivo} onChange={setNombreArchivo}/>
              <button onClick={agregarArchivo} style={{flexShrink:0,width:44,height:44,borderRadius:12,border:`1.5px dashed ${C.border}`,background:C.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon n="plus" size={16} color={C.sub}/>
              </button>
            </div>
            {archivos.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {archivos.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:C.bg,borderRadius:10,padding:"8px 12px"}}>
                    <Icon n="file" size={14} color={C.sub}/>
                    <span style={{flex:1,fontSize:12,color:C.text,fontFamily:"'Inter',sans-serif"}}>{a}</span>
                    <button onClick={()=>setArchivos(ar=>ar.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                      <Icon n="x" size={12} color={C.muted}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PrimaryBtn label={initial?"Guardar cambios":"Guardar proveedor"} disabled={!nombre} onClick={()=>{
        onSave&&onSave({
          ...initial,
          nombre,rubro,telefono,email,web,redes,direccion,nivelPrecios,
          tiempoReposicion,tiempoPersonalizado:tiempoReposicion==="Personalizado"?tiempoPersonalizado:"",
          compraMinima,promociones,ultimaCompra,observaciones,archivos,
          favorito:initial?.favorito||false,
        });
        onClose&&onClose();
      }}/>
    </div>
  );
}

function ProveedorDetalle({p,onClose}){
  const waLink = p.telefono ? `https://wa.me/54${soloDigitos(p.telefono)}` : null;
  const mapsLink = p.direccion ? `https://maps.google.com/?q=${encodeURIComponent(p.direccion)}` : null;
  return (
    <Sheet title={p.nombre} onClose={onClose}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {p.favorito&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:C.gold+"18",color:C.gold,fontFamily:"'Montserrat',sans-serif",display:"flex",alignItems:"center",gap:4}}><Icon n="star" size={10} color={C.gold} fill={C.gold}/>{translateText("Favorito") }</span>}
          {p.rubro&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:C.bg,color:C.sub,fontFamily:"'Montserrat',sans-serif"}}>{p.rubro}</span>}
          {p.nivelPrecios&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:NIVEL_PRECIO_CFG[p.nivelPrecios].bg,color:NIVEL_PRECIO_CFG[p.nivelPrecios].color,fontFamily:"'Montserrat',sans-serif"}}>{p.nivelPrecios}</span>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {tiempoEntregaLabel(p)&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Entrega")}</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{tiempoEntregaLabel(p)}</div></div>}
          {p.compraMinima&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Compra mínima") }</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.compraMinima} u.</div></div>}
          {p.ultimaCompra&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Última compra") }</div><div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{new Date(p.ultimaCompra+"T00:00").toLocaleDateString("es-AR")}</div></div>}
          {p.promociones&&<div style={{background:C.bg,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",fontFamily:"'Montserrat',sans-serif",marginBottom:3}}>{translateText("Promociones") }</div><div style={{fontSize:13,fontWeight:700,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>{p.promociones}</div></div>}
        </div>

        {(p.telefono||p.email||p.web||p.redes||p.direccion)&&(
          <div>
            <SLbl c="Contacto"/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {p.telefono&&<div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.telefono}</div>}
              {p.email&&<div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.email}</div>}
              {p.web&&<div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.web}</div>}
              {p.redes&&<div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.redes}</div>}
              {p.direccion&&<div style={{fontSize:13,color:C.text,fontFamily:"'Inter',sans-serif"}}>{p.direccion}</div>}
            </div>
          </div>
        )}

        {p.observaciones&&(
          <div>
            <SLbl c="Observaciones"/>
            <div style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif"}}>"{p.observaciones}"</div>
          </div>
        )}

        {p.archivos&&p.archivos.length>0&&(
          <div>
            <SLbl c="Archivos"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {p.archivos.map((a,j)=>(
                <span key={j} style={{fontSize:11,color:C.sub,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:4,background:C.bg,borderRadius:20,padding:"4px 10px"}}>
                  <Icon n="file" size={11} color={C.sub}/>{a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          {waLink&&(
            <a href={waLink} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:"none",padding:"10px 0",borderRadius:12,border:`1.5px solid ${C.green}`,background:C.green+"15",color:C.green,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <Icon n="msg" size={13} color={C.green}/> {translateText("WhatsApp") }
            </a>
          )}
          {mapsLink&&(
            <a href={mapsLink} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:"none",padding:"10px 0",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.bg,color:C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <Icon n="truck" size={13} color={C.sub}/> {translateText("Ver mapa") }
            </a>
          )}
        </div>
      </div>
    </Sheet>
  );
}

// ── PROVEEDORES SCREEN ─────────────────────────────────────────
const RUBROS_FILTRO = ["Todos","Insumos","Packaging","Servicios","Otros"];
const ORDEN_OPTS = ["Nombre","Precio","Tiempo de entrega","Última compra"];

function Proveedores(){
  const [tab,setTab]=useState("Lista");
  const [modal,setModal]=useState(false);
  const [busqueda,setBusqueda]=useState("");
  const [rubroFiltro,setRubroFiltro]=useState("Todos");
  const [orden,setOrden]=useState("Nombre");
  const [showOrden,setShowOrden]=useState(false);
  const [menuAbierto,setMenuAbierto]=useState(null);
  const [detalle,setDetalle]=useState(null);
  const [editando,setEditando]=useState(null);
  const [confirmarBorrar,setConfirmarBorrar]=useState(null);
  const [comparando,setComparando]=useState([]);
  const [proveedores,setProveedores]=usePersistentState("emprender_v2_proveedores",[]);

  const toggleFavorito = (p) => {
    setProveedores(ps=>ps.map(x=>x===p?{...x,favorito:!x.favorito}:x));
  };
  const guardarEdicion = (actualizado) => {
    setProveedores(ps=>ps.map(x=>x.nombre===editando.nombre?actualizado:x));
  };
  const eliminarProveedor = (p) => {
    setProveedores(ps=>ps.filter(x=>x!==p));
    setComparando(c=>c.filter(n=>n!==p.nombre));
  };
  const toggleComparar = (nombre) => {
    setComparando(c=>c.includes(nombre)?c.filter(n=>n!==nombre):[...c,nombre]);
  };

  const favoritos = proveedores.filter(p=>p.favorito);
  const entregaRapida = proveedores.filter(p=>p.tiempoReposicion==="1 día"||p.tiempoReposicion==="3 días").length;

  const coincideRubro = (p) => {
    if(rubroFiltro==="Todos") return true;
    const r = (p.rubro||"").toLowerCase();
    if(rubroFiltro==="Otros") return r&&!["insumos","packaging","servicios"].includes(r);
    return r===rubroFiltro.toLowerCase();
  };
  const coincideBusqueda = (p) => {
    if(!busqueda) return true;
    const q=busqueda.toLowerCase();
    return [p.nombre,p.rubro,p.telefono,p.email].some(v=>(v||"").toLowerCase().includes(q));
  };

  const ordenarLista = (lista) => {
    const arr=[...lista];
    if(orden==="Nombre") arr.sort((a,b)=>a.nombre.localeCompare(b.nombre));
    else if(orden==="Precio") arr.sort((a,b)=>(NIVEL_PRECIO_CFG[a.nivelPrecios]?.rank??9)-(NIVEL_PRECIO_CFG[b.nivelPrecios]?.rank??9));
    else if(orden==="Tiempo de entrega") arr.sort((a,b)=>(TIEMPO_PROV_ORDER[a.tiempoReposicion]??9)-(TIEMPO_PROV_ORDER[b.tiempoReposicion]??9));
    else if(orden==="Última compra") arr.sort((a,b)=>(b.ultimaCompra||"").localeCompare(a.ultimaCompra||""));
    return arr;
  };

  const visibles = ordenarLista(proveedores.filter(p=>coincideRubro(p)&&coincideBusqueda(p)));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingTop:4}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Proveedores")}</h1>
          <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{proveedores.length} proveedor{proveedores.length!==1?"es":""} registrado{proveedores.length!==1?"s":""}</p>
        </div>
        <OutlineBtn label={translateText("Nuevo")} icon="plus" onClick={()=>setModal(true)}/>
      </div>

      {/* Resumen rápido */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        <Card style={{padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{proveedores.length}</div>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,fontFamily:"'Montserrat',sans-serif",marginTop:2}}>{translateText("Total")}</div>
        </Card>
        <Card style={{padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{favoritos.length}</div>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,fontFamily:"'Montserrat',sans-serif",marginTop:2}}>{translateText("Favoritos") }</div>
        </Card>
        <Card style={{padding:"10px 8px",textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>{entregaRapida}</div>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.6,fontFamily:"'Montserrat',sans-serif",marginTop:2}}>{translateText("Entrega rápida") }</div>
        </Card>
      </div>

      <TabBar tabs={["Lista","Comparar"]} active={tab} setActive={setTab}/>

      {tab==="Lista" && (
        <>
          <TInput placeholder="Buscar proveedor..." value={busqueda} onChange={setBusqueda}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",flex:1}}>
              {RUBROS_FILTRO.map(r=>(
                <button key={r} onClick={()=>setRubroFiltro(r)} style={{flexShrink:0,padding:"6px 13px",borderRadius:20,border:`1px solid ${rubroFiltro===r?C.text:C.border}`,background:rubroFiltro===r?C.text:"transparent",color:rubroFiltro===r?"#fff":C.sub,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{position:"relative",flexShrink:0}}>
              <button onClick={()=>setShowOrden(s=>!s)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                <Icon n="bars" size={13} color={C.sub}/>
                <Icon n="chevD" size={12} color={C.muted}/>
              </button>
              {showOrden&&(
                <div style={{position:"absolute",top:36,right:0,zIndex:50,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:6,minWidth:150,boxShadow:"0 6px 20px rgba(0,0,0,.1)"}}>
                  {ORDEN_OPTS.map(o=>(
                    <button key={o} onClick={()=>{setOrden(o);setShowOrden(false);}} style={{width:"100%",textAlign:"left",background:orden===o?C.bg:"transparent",border:"none",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,color:orden===o?C.gold:C.text,fontWeight:orden===o?700:500,fontFamily:"'Inter',sans-serif"}}>
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {favoritos.length>0 && !busqueda && rubroFiltro==="Todos" && (
            <div>
              <SLbl c={translateText("Favoritos")}/>
              <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
                {favoritos.map((p,i)=>(
                  <div key={i} style={{flexShrink:0,width:150,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <Icon n="star" size={11} color={C.gold} fill={C.gold}/>
                      <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</span>
                    </div>
                    {p.rubro&&<div style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{p.rubro}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibles.length===0
            ? <DashedEmpty icon="truck" text={proveedores.length===0?"Agregá tu primer proveedor":"No se encontraron proveedores"} onClick={proveedores.length===0?()=>setModal(true):undefined}/>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {visibles.map((p,i)=>{
                  const waLink = p.telefono ? `https://wa.me/54${soloDigitos(p.telefono)}` : null;
                  const mapsLink = p.direccion ? `https://maps.google.com/?q=${encodeURIComponent(p.direccion)}` : null;
                  return (
                    <Card key={i} style={{padding:"14px 16px",position:"relative"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                          <button onClick={()=>toggleFavorito(p)} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0,display:"flex"}}>
                            <Icon n="star" size={16} color={p.favorito?C.gold:C.border} fill={p.favorito?C.gold:"none"}/>
                          </button>
                          <span style={{fontWeight:700,fontSize:15,color:C.text,fontFamily:"'Montserrat',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                          {p.nivelPrecios&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:NIVEL_PRECIO_CFG[p.nivelPrecios].bg,color:NIVEL_PRECIO_CFG[p.nivelPrecios].color,fontFamily:"'Montserrat',sans-serif"}}>{p.nivelPrecios}</span>}
                          <div style={{position:"relative"}}>
                            <button onClick={()=>setMenuAbierto(menuAbierto===p.nombre?null:p.nombre)} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex"}}>
                              <Icon n="moreV" size={16} color={C.muted}/>
                            </button>
                            {menuAbierto===p.nombre&&(
                              <div style={{position:"absolute",top:26,right:0,zIndex:60,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:5,minWidth:130,boxShadow:"0 6px 20px rgba(0,0,0,.12)"}}>
                                <button onClick={()=>{setDetalle(p);setMenuAbierto(null);}} style={{width:"100%",textAlign:"left",background:"none",border:"none",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                                  <Icon n="user" size={13} color={C.sub}/> Ver
                                </button>
                                <button onClick={()=>{setEditando(p);setMenuAbierto(null);}} style={{width:"100%",textAlign:"left",background:"none",border:"none",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                                  <Icon n="edit" size={13} color={C.sub}/>{translateText("Editar")}</button>
                                <button onClick={()=>{setConfirmarBorrar(p);setMenuAbierto(null);}} style={{width:"100%",textAlign:"left",background:"none",border:"none",borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                                  <Icon n="trash" size={13} color={C.red}/>{translateText("Eliminar")}</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                        {p.rubro&&<span style={{fontSize:11,color:C.gold,fontFamily:"'Inter',sans-serif"}}>{p.rubro}</span>}
                        {tiempoEntregaLabel(p)&&<span style={{fontSize:11,color:C.sub,fontFamily:"'Inter',sans-serif"}}>· Entrega: {tiempoEntregaLabel(p)}</span>}
                        {p.compraMinima&&<span style={{fontSize:11,color:C.sub,fontFamily:"'Inter',sans-serif"}}>· Mín: {p.compraMinima} u.</span>}
                        {p.ultimaCompra&&<span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>· Última compra: {new Date(p.ultimaCompra+"T00:00").toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>}
                      </div>
                      {p.promociones&&<div style={{fontSize:12,color:C.green,fontFamily:"'Inter',sans-serif",marginBottom:4}}>{p.promociones}</div>}
                      {p.observaciones&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginBottom:8}}>"{p.observaciones}"</div>}
                      {p.archivos&&p.archivos.length>0&&(
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                          {p.archivos.map((a,j)=>(
                            <span key={j} style={{fontSize:10,color:C.sub,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:3,background:C.bg,borderRadius:20,padding:"3px 9px"}}>
                              <Icon n="file" size={10} color={C.sub}/>{a}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{display:"flex",gap:8}}>
                        {waLink&&(
                          <a href={waLink} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:"none",padding:"8px 0",borderRadius:12,border:`1.5px solid ${C.green}`,background:C.green+"15",color:C.green,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            <Icon n="msg" size={13} color={C.green}/> {translateText("WhatsApp") }
                          </a>
                        )}
                        {mapsLink&&(
                          <a href={mapsLink} target="_blank" rel="noreferrer" style={{flex:1,textDecoration:"none",padding:"8px 0",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.bg,color:C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            <Icon n="truck" size={13} color={C.sub}/> {translateText("Ver mapa") }
                          </a>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
          }
        </>
      )}

      {tab==="Comparar" && (
        proveedores.length<2
          ? <DashedEmpty icon="trending" text="Agregá al menos 2 proveedores para compararlos"/>
          : <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <SLbl c="Elegí 2 o más proveedores"/>
                <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
                  {proveedores.map((p,i)=>{
                    const sel = comparando.includes(p.nombre);
                    return (
                      <button key={i} onClick={()=>toggleComparar(p.nombre)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"8px 13px",borderRadius:20,border:`1.5px solid ${sel?C.gold:C.border}`,background:sel?C.gold+"15":C.card,cursor:"pointer"}}>
                        {sel&&<Icon n="check" size={12} color={C.gold} sw={2.5}/>}
                        <span style={{fontSize:12,fontWeight:700,color:sel?C.gold:C.text,fontFamily:"'Montserrat',sans-serif",whiteSpace:"nowrap"}}>{p.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {comparando.length<2
                ? <DashedEmpty icon="trending" text="Seleccioná al menos 2 proveedores para ver la comparación"/>
                : <TablaComparacion items={proveedores.filter(p=>comparando.includes(p.nombre))}/>
              }
            </div>
      )}

      {modal&&(
        <Sheet title="Nuevo proveedor" onClose={()=>setModal(false)}>
          <NuevoProveedorForm onClose={()=>setModal(false)} onSave={p=>setProveedores(ps=>[p,...ps])}/>
        </Sheet>
      )}

      {detalle&&<ProveedorDetalle p={detalle} onClose={()=>setDetalle(null)}/>}

      {editando&&(
        <Sheet title="Editar proveedor" onClose={()=>setEditando(null)}>
          <NuevoProveedorForm initial={editando} onClose={()=>setEditando(null)} onSave={guardarEdicion}/>
        </Sheet>
      )}

      {confirmarBorrar&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onClick={()=>setConfirmarBorrar(null)}>
          <div style={{background:C.card,borderRadius:20,padding:"24px 22px",width:"85%",maxWidth:320,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>¿Eliminar este proveedor?</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginBottom:18}}>{confirmarBorrar.nombre}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmarBorrar(null)} style={{flex:1,padding:"11px",borderRadius:12,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Cancelar")}</button>
              <button onClick={()=>{eliminarProveedor(confirmarBorrar);setConfirmarBorrar(null);}} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:C.red,color:"#fff",fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Eliminar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── METAS ─────────────────────────────────────────────────────
// ── METAS: config y helpers ────────────────────────────────────
const TIPOS_META = {
  "Ventas":       { icon:"trending", prefix:"$",  sufijo:"",  desc:"Se sigue con los ingresos por ventas registrados en Finanzas" },
  "Ganancias":    { icon:"dollar",   prefix:"$",  sufijo:"",  desc:"Se sigue con el balance (ingresos − egresos) de Finanzas" },
  "Producción":   { icon:"box",      prefix:"",   sufijo:" u",desc:"Se sigue con las unidades ingresadas en Stock" },
  "Stock":        { icon:"box",      prefix:"",   sufijo:" u",desc:"Se sigue con el total de unidades actuales en Stock" },
  "Ahorro":       { icon:"target",   prefix:"$",  sufijo:"",  desc:"Se sigue con el balance acumulado (ingresos − egresos)" },
  "Personalizada":{ icon:"edit",     prefix:"",   sufijo:"",  desc:"Cargás el avance manualmente" },
};
const PRIORIDAD_META_CFG = {
  Alta:  { color:C.red,   bg:C.red+"18"   },
  Media: { color:C.amber, bg:C.amber+"18" },
  Baja:  { color:C.green, bg:C.green+"18" },
};

function computeMetaActual(meta, productos, movs){
  switch(meta.tipo){
    case "Ventas":
      return movs.filter(m=>m.tipo==="Ingreso"&&m.categoria==="Ventas").reduce((a,m)=>a+m.monto,0);
    case "Ganancias":
    case "Ahorro": {
      const ing = movs.filter(m=>m.tipo==="Ingreso").reduce((a,m)=>a+m.monto,0);
      const egr = movs.filter(m=>m.tipo==="Egreso").reduce((a,m)=>a+m.monto,0);
      return Math.max(0, ing-egr);
    }
    case "Producción":
      return productos.reduce((a,p)=>a+(p.historial||[]).filter(h=>h.tipo==="Ingreso inicial"||h.tipo==="Ingreso").reduce((s,h)=>s+h.cantidad,0),0);
    case "Stock":
      return productos.reduce((a,p)=>a+p.stockInicial,0);
    case "Personalizada":
    default:
      return meta.actualManual||0;
  }
}

function diasRestantes(fechaLimite){
  if(!fechaLimite) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const lim = new Date(fechaLimite+"T00:00");
  return Math.round((lim-hoy)/(1000*60*60*24));
}

// ── NUEVA META FORM ────────────────────────────────────────────
function NuevaMetaForm({onClose,onSave}){
  const [nombre,setNombre]=useState("");
  const [tipo,setTipo]=useState("Ventas");
  const [objetivo,setObjetivo]=useState(0);
  const [actualManual,setActualManual]=useState(0);
  const [fechaLimite,setFechaLimite]=useState("");
  const [masOpciones,setMasOpciones]=useState(false);
  const [descripcion,setDescripcion]=useState("");
  const [prioridad,setPrioridad]=useState("Media");
  const [recordatorios,setRecordatorios]=useState(true);

  const cfg = TIPOS_META[tipo];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Nombre de la meta *"/><TInput placeholder="Ej: Facturar $500.000 este mes" value={nombre} onChange={setNombre}/></div>

      <div>
        <FLbl c="Tipo de meta"/>
        <PillSelect options={Object.keys(TIPOS_META)} value={tipo} onChange={setTipo}/>
        <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:8,display:"flex",alignItems:"center",gap:6}}>
          <Icon n="info" size={13} color={C.muted}/> {cfg.desc}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:tipo==="Personalizada"?"1fr 1fr":"1fr",gap:14}}>
        <div>
          <FLbl c={`Valor objetivo ${cfg.prefix?"($)":cfg.sufijo?"(unidades)":""}`}/>
          <TInput type="number" placeholder="0" value={objetivo||""} onChange={setObjetivo}/>
        </div>
        {tipo==="Personalizada" && (
          <div><FLbl c="Valor actual"/><TInput type="number" placeholder="0" value={actualManual||""} onChange={setActualManual}/></div>
        )}
      </div>

      <div><FLbl c="Fecha límite"/><TInput type="date" value={fechaLimite} onChange={setFechaLimite}/></div>

      <button onClick={()=>setMasOpciones(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más opciones") }</span>
        <Icon n={masOpciones?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masOpciones && (
        <div style={{display:"flex",flexDirection:"column",gap:16,background:C.bg,borderRadius:14,padding:"14px 14px"}}>
          <div><FLbl c="Descripción o notas"/><TInput placeholder="Detalles adicionales" value={descripcion} onChange={setDescripcion}/></div>
          <div>
            <FLbl c={translateText("Prioridad")}/>
            <PillSelect options={["Baja","Media","Alta"]} value={prioridad} onChange={setPrioridad} colorMap={PRIORIDAD_META_CFG}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>{translateText("Recordatorios") }</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{translateText("Avisar cuando falte poco tiempo") }</div>
            </div>
            <Toggle on={recordatorios} setOn={setRecordatorios}/>
          </div>
        </div>
      )}

      <PrimaryBtn label="Guardar meta" disabled={!nombre||!objetivo||!fechaLimite} onClick={()=>{
        onSave&&onSave({
          nombre, tipo, objetivo:Number(objetivo), actualManual:Number(actualManual)||0,
          fechaLimite, descripcion, prioridad, recordatorios,
          fechaCreacion:new Date().toLocaleDateString("es-AR"),
          completada:false, fechaCompletada:null,
        });
        onClose&&onClose();
      }}/>
    </div>
  );
}

// ── METAS SCREEN ───────────────────────────────────────────────
function Metas({productos,movs}){
  const [modal,setModal]=useState(false);
  const [celebrando,setCelebrando]=useState(null);
  const [metas,setMetas]=usePersistentState("emprender_v2_metas",[]);

  // Recalcula el progreso automático y detecta metas recién cumplidas
  useEffect(()=>{
    const recienCumplida = metas.find(m=>!m.completada && computeMetaActual(m,productos,movs)>=m.objetivo && m.objetivo>0);
    if(recienCumplida){
      const hoy = new Date().toLocaleDateString("es-AR");
      setMetas(ms=>ms.map(m=>m===recienCumplida?{...m,completada:true,fechaCompletada:hoy}:m));
      setCelebrando(recienCumplida);
    }
    // eslint-disable-next-line
  },[productos,movs,metas]);

  const activas   = metas.filter(m=>!m.completada);
  const cumplidas = metas.filter(m=>m.completada);
  const pctCumplimiento = metas.length>0 ? Math.round((cumplidas.length/metas.length)*100) : 0;
  const tiempoPromedio = (()=>{
    const tiempos = cumplidas.filter(m=>m.fechaCreacion&&m.fechaCompletada).map(m=>{
      const [d1,mo1,y1]=m.fechaCreacion.split("/").map(Number);
      const [d2,mo2,y2]=m.fechaCompletada.split("/").map(Number);
      return Math.round((new Date(y2,mo2-1,d2)-new Date(y1,mo1-1,d1))/(1000*60*60*24));
    });
    if(tiempos.length===0) return null;
    return Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length);
  })();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingTop:4}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Metas")}</h1>
          <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{activas.length} activas · {cumplidas.length} cumplidas</p>
        </div>
        <OutlineBtn label="Nueva" icon="plus" onClick={()=>setModal(true)}/>
      </div>

      {/* Estadísticas */}
      <div style={{display:"grid",gridTemplateColumns:tiempoPromedio!=null?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:8}}>
        <Card style={{padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("Activas") }</div>
          <div style={{fontSize:20,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{activas.length}</div>
        </Card>
        <Card style={{padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("Cumplidas") }</div>
          <div style={{fontSize:20,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>{cumplidas.length}</div>
        </Card>
        <Card style={{padding:"12px 10px",textAlign:"center"}}>
          <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("% Cumpl.") }</div>
          <div style={{fontSize:20,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{pctCumplimiento}%</div>
        </Card>
        {tiempoPromedio!=null && (
          <Card style={{padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:8,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("Prom. días") }</div>
            <div style={{fontSize:20,fontWeight:800,color:C.sub,fontFamily:"'Montserrat',sans-serif"}}>{tiempoPromedio}</div>
          </Card>
        )}
      </div>

      {/* Metas activas */}
      {activas.length===0
        ? <DashedEmpty icon="target" text="Definí tu primera meta" onClick={()=>setModal(true)}/>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {activas.map((m,i)=>{
              const cfg = TIPOS_META[m.tipo];
              const actual = computeMetaActual(m,productos,movs);
              const pct = m.objetivo>0 ? Math.min((actual/m.objetivo)*100,100) : 0;
              const restante = Math.max(0,m.objetivo-actual);
              const dias = diasRestantes(m.fechaLimite);
              const priCfg = PRIORIDAD_META_CFG[m.prioridad]||PRIORIDAD_META_CFG.Media;
              return (
                <Card key={i} style={{padding:"16px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Icon n={cfg.icon} size={16} color={C.sub}/>
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{m.nombre}</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{m.tipo}</div>
                      </div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:"3px 9px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif",flexShrink:0}}>{m.prioridad}</span>
                  </div>

                  <div style={{height:8,borderRadius:4,background:C.border,marginBottom:8}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:pct>=100?C.green:C.gold,transition:"width .6s ease"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{cfg.prefix}{actual.toLocaleString("es-AR")}{cfg.sufijo} de {cfg.prefix}{m.objetivo.toLocaleString("es-AR")}{cfg.sufijo}</span>
                    <span style={{fontSize:12,fontWeight:700,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{Math.round(pct)}%</span>
                  </div>

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>Faltan {cfg.prefix}{restante.toLocaleString("es-AR")}{cfg.sufijo}</span>
                    {dias!==null && <span style={{fontSize:11,color:dias<=3?C.red:C.muted,fontFamily:"'Inter',sans-serif",fontWeight:dias<=3?700:400}}>{dias>=0?`${dias} días restantes`:"Vencida"}</span>}
                  </div>

                  {m.tipo==="Personalizada" && (
                    <div style={{display:"flex",gap:8,marginTop:12}}>
                      <button onClick={()=>setMetas(ms=>ms.map(x=>x===m?{...x,actualManual:Math.max(0,(x.actualManual||0)-1)}:x))}
                        style={{flex:1,padding:"8px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.red,fontWeight:700,cursor:"pointer"}}>−</button>
                      <button onClick={()=>setMetas(ms=>ms.map(x=>x===m?{...x,actualManual:(x.actualManual||0)+1}:x))}
                        style={{flex:1,padding:"8px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.green,fontWeight:700,cursor:"pointer"}}>+</button>
                    </div>
                  )}

                  {dias!==null && dias<=3 && dias>=0 && (
                    <div style={{marginTop:10,background:C.red+"12",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:7}}>
                      <Icon n="alert" size={13} color={C.red}/>
                      <span style={{fontSize:11,color:C.red,fontFamily:"'Inter',sans-serif",fontWeight:600}}>{translateText("¡Falta poco tiempo para cumplirla!") }</span>
                    </div>
                  )}
                  {m.descripcion&&<div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:10}}>{m.descripcion}</div>}
                </Card>
              );
            })}
          </div>
      }

      {/* Metas cumplidas */}
      {cumplidas.length>0&&(
        <div>
          <SLbl c="Metas cumplidas"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {cumplidas.map((m,i)=>{
              const cfg = TIPOS_META[m.tipo];
              return (
                <Card key={i} style={{padding:"12px 14px",background:C.green+"08"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:9,background:C.green+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon n="check" size={15} color={C.green} sw={2.5}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{m.nombre}</div>
                      <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>Cumplida el {m.fechaCompletada}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {modal&&(
        <Sheet title={translateText("Nueva meta")} onClose={()=>setModal(false)}>
          <NuevaMetaForm onClose={()=>setModal(false)} onSave={m=>setMetas(ms=>[m,...ms])}/>
        </Sheet>
      )}

      {celebrando&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}}
          onClick={()=>setCelebrando(null)}>
          <div style={{background:C.card,borderRadius:24,padding:"36px 28px",textAlign:"center",width:"85%",maxWidth:320,boxShadow:"0 8px 40px rgba(0,0,0,.25)",animation:"popIn .35s cubic-bezier(.34,1.56,.64,1)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div style={{fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("¡Meta cumplida!") }</div>
            <div style={{fontSize:14,color:C.sub,fontFamily:"'Inter',sans-serif",marginBottom:20}}>{celebrando.nombre}</div>
            <PrimaryBtn label="Genial" onClick={()=>setCelebrando(null)}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CALENDARIO ────────────────────────────────────────────────
// ── CALENDARIO: config y helpers ───────────────────────────────
const TIPO_EVENTO_CFG = {
  "Tarea":        { icon:"check",  color:C.blue  },
  "Recordatorio": { icon:"bell",   color:C.gold  },
  "Pago":         { icon:"trendDn",color:C.red   },
  "Cobro":        { icon:"trending",color:C.green},
  "Producción":   { icon:"box",    color:C.sub   },
  "Personalizado":{ icon:"tag",    color:C.muted },
};
const PRIORIDAD_EVT_CFG = {
  Alta:  { color:C.red,   bg:C.red+"18"   },
  Media: { color:C.amber, bg:C.amber+"18" },
  Baja:  { color:C.green, bg:C.green+"18" },
};
const REPETIR_OPTS = ["Ninguno","Diario","Semanal","Mensual","Personalizado"];
const RECORDATORIO_OPTS = ["Ninguno","5 minutos antes","15 minutos antes","1 hora antes","1 día antes","Personalizado"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function tipoLabel(ev){
  return ev.tipo==="Personalizado" && ev.tipoPersonalizado ? ev.tipoPersonalizado : ev.tipo;
}

function fechaKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function hoyKey(){ return fechaKey(new Date()); }

function construirMatrizMes(anio,mes){
  const primerDia = new Date(anio,mes,1);
  const inicio = new Date(primerDia); inicio.setDate(inicio.getDate()-primerDia.getDay());
  const semanas=[];
  let cursor=new Date(inicio);
  for(let s=0;s<6;s++){
    const semana=[];
    for(let d=0;d<7;d++){ semana.push(new Date(cursor)); cursor.setDate(cursor.getDate()+1); }
    semanas.push(semana);
  }
  return semanas;
}

// ── NUEVO EVENTO FORM ───────────────────────────────────────────
const UNIDADES_REPETICION = ["días","semanas","meses"];

function NuevoEventoForm({fechaInicial,initial,onClose,onSave}){
  const [titulo,setTitulo]=useState(initial?.titulo||"");
  const [tipo,setTipo]=useState(initial?.tipo||"Tarea");
  const [tipoPersonalizado,setTipoPersonalizado]=useState(initial?.tipoPersonalizado||"");
  const [fecha,setFecha]=useState(initial?.fecha||fechaInicial||hoyKey());
  const [hora,setHora]=useState(initial?.hora||"");
  const [descripcion,setDescripcion]=useState(initial?.descripcion||"");
  const [masOpciones,setMasOpciones]=useState(false);
  const [repetir,setRepetir]=useState(initial?.repetir||"Ninguno");
  const [repetirCada,setRepetirCada]=useState(initial?.repetirCada||1);
  const [repetirUnidad,setRepetirUnidad]=useState(initial?.repetirUnidad||"semanas");
  const [recordatorio,setRecordatorio]=useState(initial?.recordatorio||"Ninguno");
  const [prioridad,setPrioridad]=useState(initial?.prioridad||"Media");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Título *"/><TInput placeholder="Ej: Pagar proveedor de telas" value={titulo} onChange={setTitulo}/></div>

      <div>
        <FLbl c="Tipo de evento"/>
        <PillSelect options={Object.keys(TIPO_EVENTO_CFG)} value={tipo} onChange={setTipo}
          colorMap={Object.fromEntries(Object.entries(TIPO_EVENTO_CFG).map(([k,v])=>[k,{color:v.color,bg:v.color+"18"}]))}/>
        {tipo==="Personalizado"&&(
          <div style={{marginTop:12}}>
            <FLbl c="Tipo de evento personalizado"/>
            <TInput placeholder="Ej: Turno con proveedor, Reunión, Llamar cliente..." value={tipoPersonalizado} onChange={setTipoPersonalizado}/>
          </div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><FLbl c="Fecha *"/><TInput type="date" value={fecha} onChange={setFecha}/></div>
        <div><FLbl c="Hora"/><TInput type="time" value={hora} onChange={setHora}/></div>
      </div>

      <div><FLbl c="Descripción o notas"/><TInput placeholder="Detalles adicionales" value={descripcion} onChange={setDescripcion}/></div>

      <button onClick={()=>setMasOpciones(o=>!o)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>
        <span>{translateText("Más opciones") }</span>
        <Icon n={masOpciones?"chevU":"chevD"} size={16} color={C.muted}/>
      </button>

      {masOpciones && (
        <div style={{display:"flex",flexDirection:"column",gap:16,background:C.bg,borderRadius:14,padding:"14px 14px"}}>
          <div>
            <FLbl c="Repetir"/>
            <PillSelect options={REPETIR_OPTS} value={repetir} onChange={setRepetir}/>
            {repetir==="Personalizado"&&(
              <div style={{marginTop:12}}>
                <FLbl c="Repetición personalizada"/>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif",flexShrink:0}}>{translateText("Cada") }</span>
                  <input type="number" min="1" value={repetirCada||""} onChange={e=>setRepetirCada(parseInt(e.target.value)||1)}
                    style={{width:56,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 10px",fontSize:14,color:C.text,outline:"none",fontFamily:"'Montserrat',sans-serif",fontWeight:700,textAlign:"center"}}/>
                  <div style={{flex:1}}>
                    <Dropdown value={repetirUnidad} options={UNIDADES_REPETICION} onChange={setRepetirUnidad}/>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <FLbl c="Recordarme"/>
            <PillSelect options={RECORDATORIO_OPTS} value={recordatorio} onChange={setRecordatorio}/>
          </div>
          <div>
            <FLbl c={translateText("Prioridad")}/>
            <PillSelect options={["Alta","Media","Baja"]} value={prioridad} onChange={setPrioridad} colorMap={PRIORIDAD_EVT_CFG}/>
          </div>
        </div>
      )}

      <PrimaryBtn label={initial?"Guardar cambios":"Guardar evento"} disabled={!titulo||!fecha} onClick={()=>{
        onSave&&onSave({
          titulo,tipo,tipoPersonalizado:tipo==="Personalizado"?tipoPersonalizado:"",
          fecha,hora,descripcion,
          repetir,repetirCada:repetir==="Personalizado"?repetirCada:null,repetirUnidad:repetir==="Personalizado"?repetirUnidad:null,
          recordatorio,prioridad,completado:initial?.completado||false,
        });
        onClose&&onClose();
      }}/>
    </div>
  );
}

// ── CALENDARIO SCREEN ───────────────────────────────────────────
function Calendario(){
  const hoy = new Date();
  const [vista,setVista]=useState("Mes");
  const [fechaCursor,setFechaCursor]=useState(new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()));
  const [seleccionada,setSeleccionada]=useState(hoyKey());
  const [busqueda,setBusqueda]=useState("");
  const [modal,setModal]=useState(false);
  const [showFiltros,setShowFiltros]=useState(false);
  const [filtroTipos,setFiltroTipos]=useState([]);
  const [filtroEstado,setFiltroEstado]=useState("Todos");
  const [eventos,setEventos]=usePersistentState("emprender_v2_eventos",[]);

  const eventosFiltrados = eventos.filter(ev=>
    (filtroTipos.length===0||filtroTipos.includes(ev.tipo)) &&
    (filtroEstado==="Todos"||(filtroEstado==="Pendientes"?!ev.completado:ev.completado))
  );
  const eventosPorDia = eventosFiltrados.reduce((acc,ev)=>{ (acc[ev.fecha]=acc[ev.fecha]||[]).push(ev); return acc; },{});

  const eventosDelDia = (eventosPorDia[seleccionada]||[]).slice().sort((a,b)=>(a.hora||"99:99").localeCompare(b.hora||"99:99"));
  const resultadosBusqueda = busqueda
    ? eventosFiltrados.filter(ev=>ev.titulo.toLowerCase().includes(busqueda.toLowerCase())).slice().sort((a,b)=>a.fecha.localeCompare(b.fecha))
    : null;

  const proximos = eventosFiltrados
    .filter(ev=>!ev.completado && ev.fecha>hoyKey())
    .sort((a,b)=>a.fecha.localeCompare(b.fecha)||( a.hora||"99:99").localeCompare(b.hora||"99:99"))
    .slice(0,5);

  const toggleCompletado = (ev) => {
    setEventos(es=>es.map(e=>e===ev?{...e,completado:!e.completado}:e));
  };
  const toggleFiltroTipo = (t) => {
    setFiltroTipos(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t]);
  };

  const irAHoy = () => { setFechaCursor(new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate())); setSeleccionada(hoyKey()); };
  const navegar = (delta) => {
    const d = new Date(fechaCursor);
    if(vista==="Mes") d.setMonth(d.getMonth()+delta);
    else if(vista==="Semana") d.setDate(d.getDate()+7*delta);
    else d.setDate(d.getDate()+delta);
    setFechaCursor(d);
    if(vista==="Día") setSeleccionada(fechaKey(d));
  };

  const semanas = construirMatrizMes(fechaCursor.getFullYear(),fechaCursor.getMonth());
  const inicioSemana = new Date(fechaCursor); inicioSemana.setDate(inicioSemana.getDate()-fechaCursor.getDay());
  const semanaActual = Array.from({length:7},(_,i)=>{ const d=new Date(inicioSemana); d.setDate(d.getDate()+i); return d; });
  const fechaSelDate = new Date(seleccionada+"T00:00");

  const tituloNav = vista==="Mes"
    ? `${MESES[fechaCursor.getMonth()]} ${fechaCursor.getFullYear()}`
    : vista==="Semana"
    ? `${semanaActual[0].getDate()} ${MESES[semanaActual[0].getMonth()].slice(0,3)} – ${semanaActual[6].getDate()} ${MESES[semanaActual[6].getMonth()].slice(0,3)}`
    : fechaCursor.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});

  const puntosDia = (key) => (eventosPorDia[key]||[]).slice(0,3).map(ev=>(TIPO_EVENTO_CFG[ev.tipo]||TIPO_EVENTO_CFG.Personalizado).color);

  const renderEventItem = (ev,i,mostrarFecha) => {
    const cfg = TIPO_EVENTO_CFG[ev.tipo]||TIPO_EVENTO_CFG.Personalizado;
    const priCfg = PRIORIDAD_EVT_CFG[ev.prioridad]||PRIORIDAD_EVT_CFG.Media;
    return (
      <Card key={i} style={{padding:"12px 14px",opacity:ev.completado?.6:1}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>toggleCompletado(ev)} style={{width:26,height:26,borderRadius:8,border:`1.5px solid ${ev.completado?C.green:C.border}`,background:ev.completado?C.green:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {ev.completado&&<Icon n="check" size={13} color="#fff" sw={3}/>}
          </button>
          <div style={{width:34,height:34,borderRadius:10,background:cfg.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon n={cfg.icon} size={16} color={cfg.color}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:ev.completado?C.muted:C.text,fontFamily:"'Montserrat',sans-serif",textDecoration:ev.completado?"line-through":"none"}}>{ev.titulo}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>
              {tipoLabel(ev)}{ev.hora?` · ${ev.hora}`:""}{mostrarFecha?` · ${new Date(ev.fecha+"T00:00").toLocaleDateString("es-AR",{day:"numeric",month:"short"})}`:""}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
            <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{ev.prioridad}</span>
            <span style={{fontSize:9,fontWeight:600,color:ev.completado?C.green:C.muted,fontFamily:"'Inter',sans-serif"}}>{ev.completado?"Completado":"Pendiente"}</span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingTop:4}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Calendario")}</h1>
          <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{translateText("Organizá tu emprendimiento") }</p>
        </div>
        <OutlineBtn label={translateText("Nuevo")} icon="plus" onClick={()=>setModal(true)}/>
      </div>

      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><TInput placeholder="Buscar eventos por nombre..." value={busqueda} onChange={setBusqueda}/></div>
        <button onClick={()=>setShowFiltros(s=>!s)} style={{flexShrink:0,width:44,height:44,borderRadius:12,border:`1.5px solid ${filtroTipos.length||filtroEstado!=="Todos"?C.gold:C.border}`,background:filtroTipos.length||filtroEstado!=="Todos"?C.gold+"15":C.card,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="tag" size={16} color={filtroTipos.length||filtroEstado!=="Todos"?C.gold:C.sub}/>
        </button>
      </div>

      {showFiltros&&(
        <Card style={{padding:"14px"}}>
          <div style={{marginBottom:10}}>
            <FLbl c="Tipo de evento"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.keys(TIPO_EVENTO_CFG).map(t=>{
                const activo=filtroTipos.includes(t);
                const cfg=TIPO_EVENTO_CFG[t];
                return (
                  <button key={t} onClick={()=>toggleFiltroTipo(t)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${activo?cfg.color:C.border}`,background:activo?cfg.color+"18":"transparent",color:activo?cfg.color:C.sub,fontSize:11,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FLbl c={translateText("Estado")}/>
            <PillSelect options={["Todos","Pendientes","Completados"]} value={filtroEstado} onChange={setFiltroEstado}/>
          </div>
        </Card>
      )}

      {!busqueda && (
        <>
          <TabBar tabs={["Mes","Semana","Día"]} active={vista} setActive={setVista}/>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={()=>navegar(-1)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon n="chevL" size={15} color={C.sub}/>
            </button>
            <span style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",textTransform:"capitalize"}}>{tituloNav}</span>
            <button onClick={()=>navegar(1)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon n="chevR" size={15} color={C.sub}/>
            </button>
          </div>

          {vista==="Mes" && (
            <Card style={{padding:"14px 10px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
                {DIAS_SEMANA.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:700,fontFamily:"'Montserrat',sans-serif"}}>{d}</div>)}
              </div>
              {semanas.map((semana,si)=>(
                <div key={si} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2}}>
                  {semana.map((d,di)=>{
                    const key=fechaKey(d);
                    const esMesActual = d.getMonth()===fechaCursor.getMonth();
                    const puntos = puntosDia(key);
                    const esSel = key===seleccionada;
                    const esHoy = key===hoyKey();
                    return (
                      <button key={di} onClick={()=>setSeleccionada(key)} style={{aspectRatio:"0.85",background:esSel?C.text:"transparent",border:esHoy&&!esSel?`1.5px solid ${C.gold}`:"1.5px solid transparent",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,opacity:esMesActual?1:.32}}>
                        <span style={{fontSize:13,fontWeight:esSel||esHoy?700:500,color:esSel?"#fff":C.text,fontFamily:"'Inter',sans-serif"}}>{d.getDate()}</span>
                        <div style={{display:"flex",gap:2,height:5,alignItems:"center"}}>
                          {puntos.map((c,pi)=><div key={pi} style={{width:4,height:4,borderRadius:"50%",background:esSel?"#fff":c}}/>)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </Card>
          )}

          {vista==="Semana" && (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {semanaActual.map((d,i)=>{
                const key=fechaKey(d);
                const evsDia=(eventosPorDia[key]||[]).slice().sort((a,b)=>(a.hora||"99:99").localeCompare(b.hora||"99:99"));
                const esSel=key===seleccionada;
                const esHoy=key===hoyKey();
                return (
                  <button key={i} onClick={()=>setSeleccionada(key)} style={{width:"100%",textAlign:"left",background:esSel?C.text:C.card,border:`1.5px solid ${esSel?C.text:esHoy?C.gold:C.border}`,borderRadius:14,padding:"10px 12px",cursor:"pointer",display:"flex",gap:12}}>
                    <div style={{width:40,flexShrink:0,textAlign:"center"}}>
                      <div style={{fontSize:9,fontWeight:700,color:esSel?"#fff":C.muted,fontFamily:"'Montserrat',sans-serif"}}>{DIAS_SEMANA[d.getDay()]}</div>
                      <div style={{fontSize:16,fontWeight:800,color:esSel?"#fff":C.text,fontFamily:"'Montserrat',sans-serif"}}>{d.getDate()}</div>
                    </div>
                    <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:3,justifyContent:"center"}}>
                      {evsDia.length===0
                        ? <span style={{fontSize:11,color:esSel?"#C8BFB0":C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Sin eventos") }</span>
                        : evsDia.slice(0,2).map((ev,j)=>{
                            const cfg=TIPO_EVENTO_CFG[ev.tipo]||TIPO_EVENTO_CFG.Personalizado;
                            return (
                              <div key={j} style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:cfg.color,flexShrink:0}}/>
                                <span style={{fontSize:12,color:esSel?"#fff":C.text,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.hora?`${ev.hora} · `:""}{ev.titulo}</span>
                              </div>
                            );
                          })
                      }
                      {evsDia.length>2&&<span style={{fontSize:10,color:esSel?"#C8BFB0":C.gold,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>+{evsDia.length-2} más</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {vista==="Día" && (
            eventosDelDia.length===0
              ? <DashedEmpty icon="calendar" text="Sin eventos este día" onClick={()=>setModal(true)}/>
              : <div style={{display:"flex",flexDirection:"column"}}>
                  {eventosDelDia.map((ev,i)=>{
                    const cfg=TIPO_EVENTO_CFG[ev.tipo]||TIPO_EVENTO_CFG.Personalizado;
                    const priCfg=PRIORIDAD_EVT_CFG[ev.prioridad]||PRIORIDAD_EVT_CFG.Media;
                    return (
                      <div key={i} style={{display:"flex",gap:10}}>
                        <div style={{width:44,flexShrink:0,textAlign:"right",fontSize:11,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700,paddingTop:12}}>{ev.hora||"—"}</div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                          <div style={{width:11,height:11,borderRadius:"50%",background:cfg.color,marginTop:12}}/>
                          {i<eventosDelDia.length-1&&<div style={{width:2,flex:1,background:C.border,minHeight:36}}/>}
                        </div>
                        <div style={{flex:1,paddingBottom:14,minWidth:0}}>
                          <Card style={{padding:"11px 13px",opacity:ev.completado?.6:1,cursor:"pointer"}} onClick={()=>toggleCompletado(ev)}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                              <div style={{minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:ev.completado?C.muted:C.text,fontFamily:"'Montserrat',sans-serif",textDecoration:ev.completado?"line-through":"none"}}>{ev.titulo}</div>
                                <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2}}>{tipoLabel(ev)}</div>
                              </div>
                              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                                <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:priCfg.bg,color:priCfg.color,fontFamily:"'Montserrat',sans-serif"}}>{ev.prioridad}</span>
                                <span style={{fontSize:9,fontWeight:600,color:ev.completado?C.green:C.muted,fontFamily:"'Inter',sans-serif"}}>{ev.completado?"Completado":"Pendiente"}</span>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
          )}
        </>
      )}

      {!busqueda && vista!=="Día" && (
        <div>
          <SLbl c={`Eventos del ${fechaSelDate.toLocaleDateString("es-AR",{day:"numeric",month:"short"})}`}/>
          {eventosDelDia.length===0
            ? <DashedEmpty icon="calendar" text="Sin eventos este día" onClick={()=>setModal(true)}/>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {eventosDelDia.map((ev,i)=>renderEventItem(ev,i,false))}
              </div>
          }
        </div>
      )}

      {busqueda && (
        <div>
          <SLbl c="Resultados"/>
          {resultadosBusqueda.length===0
            ? <DashedEmpty icon="calendar" text="Sin resultados"/>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {resultadosBusqueda.map((ev,i)=>renderEventItem(ev,i,true))}
              </div>
          }
        </div>
      )}

      {!busqueda && proximos.length>0 && (
        <div>
          <SLbl c={translateText("Próximamente")}/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {proximos.map((ev,i)=>renderEventItem(ev,i,true))}
          </div>
        </div>
      )}

      {vista!=="Mes"&&(
        <button onClick={irAHoy} style={{position:"fixed",bottom:96,right:20,zIndex:50,background:C.text,color:"#fff",border:"none",borderRadius:20,padding:"9px 16px",fontSize:12,fontWeight:700,fontFamily:"'Montserrat',sans-serif",cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,.2)"}}>{translateText("Hoy")}</button>
      )}
      {vista==="Mes"&&(
        <button onClick={irAHoy} style={{alignSelf:"flex-start",background:"none",border:"none",cursor:"pointer",color:C.gold,fontSize:12,fontWeight:700,fontFamily:"'Montserrat',sans-serif",display:"flex",alignItems:"center",gap:4}}>
          <Icon n="calendar" size={13} color={C.gold}/> {translateText("Ir a hoy") }
        </button>
      )}

      {modal&&(
        <Sheet title="Nuevo evento" onClose={()=>setModal(false)}>
          <NuevoEventoForm fechaInicial={seleccionada} onClose={()=>setModal(false)} onSave={ev=>setEventos(es=>[...es,ev])}/>
        </Sheet>
      )}
    </div>
  );
}

// ── HISTORIAL GENERAL ─────────────────────────────────────────
const PERIODOS_HISTORIAL = ["Últimos 7 días","Últimos 30 días","Este año","Personalizado"];
const CATS_ACTIVIDAD = {
  Ventas:  { color:C.green, icon:"trending" },
  Gastos:  { color:C.red,   icon:"trendDn"  },
  Stock:   { color:C.blue,  icon:"box"      },
  Pedidos: { color:C.gold,  icon:"orders"   },
};

function rangoHistorial(periodo,desde,hasta){
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  let inicio, fin=new Date(hoy);
  if(periodo==="Últimos 7 días"){ inicio=new Date(hoy); inicio.setDate(inicio.getDate()-6); }
  else if(periodo==="Últimos 30 días"){ inicio=new Date(hoy); inicio.setDate(inicio.getDate()-29); }
  else if(periodo==="Este año"){ inicio=new Date(hoy.getFullYear(),0,1); }
  else { inicio = desde?new Date(desde+"T00:00"):new Date(hoy.getFullYear(),hoy.getMonth(),1); fin = hasta?new Date(hasta+"T00:00"):new Date(hoy); }
  fin.setHours(23,59,59,999);
  return {inicio,fin};
}

function construirActividad(productos,movs,pedidos){
  const eventos=[];
  movs.forEach(m=>{
    eventos.push({
      categoria: m.tipo==="Ingreso"?"Ventas":"Gastos",
      label: m.concepto,
      detalle: `${m.categoria} · ${m.tipo==="Ingreso"?"+":"-"}$${m.monto.toLocaleString("es-AR")}`,
      fecha:m.fecha, hora:m.hora||"",
    });
  });
  productos.forEach(p=>{
    (p.historial||[]).forEach(h=>{
      eventos.push({
        categoria:"Stock",
        label:`${h.tipo}: ${p.nombre}`,
        detalle:`${h.cantidad>0?"+":""}${h.cantidad} ${p.unidad?.toLowerCase()||""}`,
        fecha:h.fecha, hora:h.hora||"",
      });
    });
  });
  pedidos.forEach(pe=>{
    eventos.push({
      categoria:"Pedidos",
      label:`Nuevo pedido: ${pe.clienteNombre||"Sin nombre"}`,
      detalle:`$${(pe.total||0).toLocaleString("es-AR")}`,
      fecha:pe.fechaCreacion||"", hora:pe.horaCreacion||"",
    });
  });
  return eventos;
}

function bucketsActividad(periodo,inicio,fin){
  if(periodo==="Últimos 7 días"){
    const b=[]; let d=new Date(inicio);
    while(d<=fin){ b.push({label:DIAS_SEMANA[d.getDay()],from:new Date(d),to:new Date(d)}); d.setDate(d.getDate()+1); }
    return b;
  }
  if(periodo==="Este año"){
    const b=[]; let d=new Date(inicio.getFullYear(),0,1);
    for(let m=0;m<12;m++){ const from=new Date(inicio.getFullYear(),m,1); const to=new Date(inicio.getFullYear(),m+1,0); b.push({label:MESES[m].slice(0,3),from,to}); }
    return b;
  }
  const diasSpan = Math.round((fin-inicio)/(1000*60*60*24));
  if(diasSpan<=9){
    const b=[]; let d=new Date(inicio);
    while(d<=fin){ b.push({label:DIAS_SEMANA[d.getDay()],from:new Date(d),to:new Date(d)}); d.setDate(d.getDate()+1); }
    return b;
  }
  if(diasSpan<=90){
    const b=[]; let d=new Date(inicio);
    while(d<=fin){ const from=new Date(d); const to=new Date(d); to.setDate(to.getDate()+6); b.push({label:`${from.getDate()}/${from.getMonth()+1}`,from,to:to>fin?fin:to}); d.setDate(d.getDate()+7); }
    return b;
  }
  const b=[]; let d=new Date(inicio.getFullYear(),inicio.getMonth(),1);
  while(d<=fin){ const from=new Date(d); const to=new Date(d.getFullYear(),d.getMonth()+1,0); b.push({label:MESES[d.getMonth()].slice(0,3),from,to}); d.setMonth(d.getMonth()+1); }
  return b;
}

function Historial({productos,movs,pedidos}){
  const [periodo,setPeriodo]=useState("Últimos 30 días");
  const [desde,setDesde]=useState("");
  const [hasta,setHasta]=useState("");

  const {inicio,fin} = rangoHistorial(periodo,desde,hasta);
  const todos = construirActividad(productos,movs,pedidos);
  const eventos = todos
    .filter(e=>e.fecha)
    .filter(e=>{ const d=parseFechaAR(e.fecha); return d>=inicio&&d<=fin; })
    .sort((a,b)=>{ const da=parseFechaAR(a.fecha),db=parseFechaAR(b.fecha); if(db-da!==0) return db-da; return (b.hora||"").localeCompare(a.hora||""); });

  const ventasRealizadas = movs.filter(m=>m.tipo==="Ingreso"&&m.categoria==="Ventas"&&(()=>{const d=parseFechaAR(m.fecha);return d>=inicio&&d<=fin;})()).length;
  const ingresosStock = productos.flatMap(p=>(p.historial||[]).map(h=>h)).filter(h=>h.cantidad>0&&(()=>{const d=parseFechaAR(h.fecha);return d>=inicio&&d<=fin;})()).length;
  const pedidosCreados = pedidos.filter(p=>p.fechaCreacion&&(()=>{const d=parseFechaAR(p.fechaCreacion);return d>=inicio&&d<=fin;})()).length;

  const buckets = bucketsActividad(periodo,inicio,fin);
  const chartData = buckets.map(b=>({v:eventos.filter(e=>{const d=parseFechaAR(e.fecha); return d>=b.from&&d<=b.to;}).length}));
  const chartLabels = buckets.map(b=>b.label);

  const conteoTipos = Object.keys(CATS_ACTIVIDAD).map(c=>({tipo:c,cantidad:eventos.filter(e=>e.categoria===c).length}));
  const maxTipo = Math.max(...conteoTipos.map(c=>c.cantidad),1);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{paddingTop:4}}>
        <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>Historial</h1>
        <p style={{color:C.muted,fontSize:13,fontFamily:"'Inter',sans-serif",marginTop:4}}>{translateText("Actividad del emprendimiento") }</p>
      </div>

      <div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PERIODOS_HISTORIAL.map(p=>(
            <button key={p} onClick={()=>setPeriodo(p)} style={{padding:"7px 14px",borderRadius:20,border:`1px solid ${periodo===p?C.text:C.border}`,background:periodo===p?C.text:"transparent",color:periodo===p?"#fff":C.sub,fontSize:12,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>
              {p}
            </button>
          ))}
        </div>
        {periodo==="Personalizado"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
            <div><FLbl c="Desde"/><TInput type="date" value={desde} onChange={setDesde}/></div>
            <div><FLbl c="Hasta"/><TInput type="date" value={hasta} onChange={setHasta}/></div>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div>
        <SLbl c="Resumen del período"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Card style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Movimientos totales") }</div>
            <div style={{fontSize:19,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{eventos.length}</div>
          </Card>
          <Card style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Ventas realizadas") }</div>
            <div style={{fontSize:19,fontWeight:800,color:C.green,fontFamily:"'Montserrat',sans-serif"}}>{ventasRealizadas}</div>
          </Card>
          <Card style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Ingresos de stock") }</div>
            <div style={{fontSize:19,fontWeight:800,color:C.blue,fontFamily:"'Montserrat',sans-serif"}}>{ingresosStock}</div>
          </Card>
          <Card style={{padding:"12px 14px"}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Pedidos creados") }</div>
            <div style={{fontSize:19,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{pedidosCreados}</div>
          </Card>
        </div>
        {eventos.length>0&&(
          <Card style={{padding:"11px 14px",marginTop:8}}>
            <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:"'Montserrat',sans-serif",marginBottom:4}}>{translateText("Movimiento más reciente") }</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{eventos[0].label}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{eventos[0].detalle} · {eventos[0].fecha}</div>
          </Card>
        )}
      </div>

      {/* Gráfico de actividad */}
      {eventos.length>0&&(
        <div>
          <SLbl c="Actividad en el período"/>
          <Card style={{padding:"14px"}}>
            <WeekBars data={chartData} labels={chartLabels} color={C.gold} h={80}/>
          </Card>
        </div>
      )}

      {/* Tipo de movimiento predominante */}
      {eventos.length>0&&(
        <div>
          <SLbl c="Tipo de movimiento"/>
          <Card style={{padding:"14px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {conteoTipos.map(({tipo,cantidad})=>(
                <div key={tipo}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{tipo}</span>
                    <span style={{fontSize:12,fontWeight:700,color:CATS_ACTIVIDAD[tipo].color,fontFamily:"'Montserrat',sans-serif"}}>{cantidad}</span>
                  </div>
                  <div style={{height:7,borderRadius:4,background:C.bg}}>
                    <div style={{height:"100%",width:`${(cantidad/maxTipo)*100}%`,borderRadius:4,background:CATS_ACTIVIDAD[tipo].color,transition:"width .5s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Lista de movimientos */}
      <div>
        <SLbl c="Movimientos"/>
        {eventos.length===0
          ? <DashedEmpty icon="history" text="Sin actividad en este período"/>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {eventos.slice(0,30).map((ev,i)=>{
                const cfg = CATS_ACTIVIDAD[ev.categoria]||CATS_ACTIVIDAD.Stock;
                return (
                  <Card key={i} style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:10,background:cfg.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Icon n={cfg.icon} size={16} color={cfg.color}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.label}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{ev.detalle}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:10,color:C.sub,fontFamily:"'Inter',sans-serif"}}>{ev.fecha}</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{ev.hora}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

// ── MENÚ "MÁS" ────────────────────────────────────────────────
function MasMenu({onClose,onSelect}){
  const items=[
    {id:"metas",      icon:"target",   label:"Metas"},
    {id:"calendario", icon:"calendar", label:"Calendario"},
    {id:"proveedores",icon:"truck",    label:"Proveedores"},
    {id:"historial",  icon:"history",  label:"Historial"},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300,backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.card,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:430,boxShadow:"0 -4px 32px rgba(0,0,0,.15)",animation:"slideUp .22s ease"}}>
        <div style={{padding:"0 20px 36px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"14px auto 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 24px"}}>
            <h3 style={{margin:0,fontSize:20,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Más secciones") }</h3>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:10,background:C.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon n="x" size={15} color={C.muted}/>
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {items.map(it=>(
              <button key={it.id} onClick={()=>onSelect(it.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{width:64,height:64,borderRadius:18,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon n={it.icon} size={26} color={C.text}/>
                </div>
                <span style={{fontSize:12,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif",textAlign:"center"}}>{translateText(it.label)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CONFIGURACIÓN ─────────────────────────────────────────────
function ConfigRow({icon,label,sub,onClick,danger,right}){
  return (
    <button onClick={onClick} style={{width:"100%",background:C.card,border:"none",borderBottom:`1px solid ${C.border}`,padding:"14px 16px",cursor:onClick?"pointer":"default",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
      <Icon n={icon} size={19} color={danger?C.red:C.sub}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,color:danger?C.red:C.text,fontFamily:"'Montserrat',sans-serif"}}>{label}</div>
        {sub&&<div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>}
      </div>
      {right!==undefined ? right : (onClick && <Icon n="chevR" size={16} color={C.muted}/>)}
    </button>
  );
}

function ConfigSection({title,children}){
  return (
    <div>
      <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.4,marginBottom:8,paddingLeft:2,fontFamily:"'Montserrat',sans-serif"}}>{translateText(title)}</div>
      <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        {children}
      </div>
    </div>
  );
}

function CampoPassword({label,value,onChange}){
  const [ver,setVer]=useState(false);
  return (
    <div>
      <FLbl c={label}/>
      <div style={{position:"relative"}}>
        <input type={ver?"text":"password"} value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"11px 30px 11px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
        <button onClick={()=>setVer(v=>!v)} style={{position:"absolute",right:0,top:8,background:"none",border:"none",cursor:"pointer",padding:4}}>
          <Icon n={ver?"eyeOff":"eye"} size={15} color={C.muted}/>
        </button>
      </div>
    </div>
  );
}

// ── EDITAR NOMBRE ─────────────────────────────────────────────
function EditarNombreForm({valorInicial,onClose,onSave}){
  const [nombre,setNombre]=useState(valorInicial||"");
  const [error,setError]=useState("");
  const guardar=()=>{
    if(!nombre.trim()){ setError("El nombre no puede estar vacío"); return; }
    onSave(nombre.trim());
    onClose();
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Tu nombre"/><TInput value={nombre} onChange={v=>{setNombre(v);setError("");}}/></div>
      {error&&<div style={{fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}><Icon n="alert" size={13} color={C.red}/>{error}</div>}
      <PrimaryBtn label={translateText("Guardar")} onClick={guardar} disabled={!nombre.trim()}/>
    </div>
  );
}

// ── CAMBIAR CORREO ───────────────────────────────────────────────
function CambiarCorreoForm({emailActual,passwordReal,onClose,onGuardar}){
  const [paso,setPaso]=useState("form");
  const [nuevoEmail,setNuevoEmail]=useState("");
  const [passwordActual,setPasswordActual]=useState("");
  const [error,setError]=useState("");

  const enviarVerificacion = () => {
    if(!nuevoEmail.includes("@")||!nuevoEmail.includes(".")){ setError("Ingresá un correo válido"); return; }
    if(passwordActual!==passwordReal){ setError("Contraseña incorrecta"); return; }
    setError("");
    setPaso("pendiente");
  };

  if(paso==="pendiente"){
    return (
      <div style={{display:"flex",flexDirection:"column",gap:16,alignItems:"center",textAlign:"center"}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:C.gold+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="mail" size={24} color={C.gold}/>
        </div>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{translateText("Revisá tu correo") }</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>{translateText("Te enviamos un enlace de verificación a") } <strong>{nuevoEmail}</strong>. Confirmalo para completar el cambio.</div>
        </div>
        <PrimaryBtn label="Ya confirmé el correo" onClick={()=>{onGuardar(nuevoEmail);onClose();}}/>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><FLbl c="Correo actual"/><div style={{fontSize:14,color:C.muted,fontFamily:"'Inter',sans-serif",padding:"11px 0",borderBottom:`1.5px solid ${C.border}`}}>{emailActual}</div></div>
      <div><FLbl c="Nuevo correo"/><TInput type="email" placeholder="nuevo@email.com" value={nuevoEmail} onChange={v=>{setNuevoEmail(v);setError("");}}/></div>
      <CampoPassword label="Confirmá tu contraseña actual" value={passwordActual} onChange={v=>{setPasswordActual(v);setError("");}}/>
      {error&&<div style={{fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}><Icon n="alert" size={13} color={C.red}/>{error}</div>}
      <PrimaryBtn label="Enviar verificación" onClick={enviarVerificacion} disabled={!nuevoEmail||!passwordActual}/>
    </div>
  );
}

// ── CAMBIAR CONTRASEÑA ───────────────────────────────────────────
function CambiarPasswordForm({passwordActualReal,onClose,onGuardar}){
  const [actual,setActual]=useState("");
  const [nueva,setNueva]=useState("");
  const [confirmar,setConfirmar]=useState("");
  const [error,setError]=useState("");

  const guardar = () => {
    if(actual!==passwordActualReal){ setError("La contraseña actual no es correcta"); return; }
    if(nueva.length<6){ setError("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if(nueva!==confirmar){ setError("Las contraseñas nuevas no coinciden"); return; }
    setError("");
    onGuardar(nueva);
    onClose();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <CampoPassword label="Contraseña actual" value={actual} onChange={v=>{setActual(v);setError("");}}/>
      <CampoPassword label="Nueva contraseña" value={nueva} onChange={v=>{setNueva(v);setError("");}}/>
      <CampoPassword label="Confirmar nueva contraseña" value={confirmar} onChange={v=>{setConfirmar(v);setError("");}}/>
      {error&&<div style={{fontSize:12,color:C.red,fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}><Icon n="alert" size={13} color={C.red}/>{error}</div>}
      <PrimaryBtn label="Guardar contraseña" onClick={guardar} disabled={!actual||!nueva||!confirmar}/>
    </div>
  );
}

// ── GESTIÓN DE DATOS PERSONALES ──────────────────────────────────
function GestionDatosContent({onDescargar,onImportar,consentimiento,setConsentimiento,onSolicitarEliminar}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <button onClick={onDescargar} style={{width:"100%",textAlign:"left",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <Icon n="file" size={18} color={C.sub}/>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Descargar mis datos") }</div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{translateText("Exportá toda tu información en un archivo") }</div>
        </div>
        <Icon n="chevR" size={15} color={C.muted}/>
      </button>

      <label style={{width:"100%",textAlign:"left",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxSizing:"border-box"}}>
        <Icon n="history" size={18} color={C.sub}/>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Restaurar una copia") }</div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{translateText("Importá un archivo .json exportado desde Emprender") }</div>
        </div>
        <input type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f&&onImportar)onImportar(f);e.target.value="";}} style={{display:"none"}}/>
        <Icon n="chevR" size={15} color={C.muted}/>
      </label>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Uso de datos para mejoras") }</div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{translateText("Consentimiento para análisis interno") }</div>
        </div>
        <Toggle on={consentimiento} setOn={setConsentimiento}/>
      </div>

      <button onClick={onSolicitarEliminar} style={{width:"100%",textAlign:"left",background:C.red+"10",border:`1px solid ${C.red}30`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <Icon n="trash" size={18} color={C.red}/>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:C.red,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Eliminar mi cuenta") }</div>
          <div style={{fontSize:11,color:C.red,fontFamily:"'Inter',sans-serif",marginTop:1,opacity:.85}}>{translateText("Esta acción no se puede deshacer") }</div>
        </div>
      </button>
    </div>
  );
}

// ── PERMISOS DE LA APP ───────────────────────────────────────────
function PermisosContent(){
  const [permisos,setPermisos]=useState({Notificaciones:true,Cámara:false,Almacenamiento:true,Ubicación:false});
  const items=[
    {k:"Notificaciones", icon:"bell",  desc:"Avisos de stock, pagos y recordatorios"},
    {k:"Cámara",         icon:"image", desc:"Para fotos de productos y comprobantes"},
    {k:"Almacenamiento", icon:"file",  desc:"Guardar archivos adjuntos"},
    {k:"Ubicación",      icon:"truck", desc:"Sugerir direcciones de entrega"},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>
        Estos permisos se administran desde la configuración de tu teléfono. Acá podés ver su estado dentro de la app.
      </div>
      {items.map(it=>(
        <div key={it.k} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <Icon n={it.icon} size={18} color={C.sub}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{it.k}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:1}}>{it.desc}</div>
          </div>
          <Toggle on={permisos[it.k]} setOn={v=>setPermisos(p=>({...p,[it.k]:v}))}/>
        </div>
      ))}
    </div>
  );
}

// ── POLÍTICA DE PRIVACIDAD ───────────────────────────────────────
function PoliticaPrivacidadContent(){
  const secciones=[
    {t:"Qué datos recopilamos", d:"Guardamos la información que cargás en la app: productos, pedidos, movimientos financieros, proveedores y los datos de tu cuenta (nombre y correo)."},
    {t:"Cómo usamos tus datos", d:"Tus datos se usan únicamente para brindarte las funciones de la app y, si lo autorizás, para mejorar la experiencia general."},
    {t:"Con quién los compartimos", d:"No vendemos ni compartimos tu información con terceros con fines comerciales."},
    {t:"Tus derechos", d:"Podés descargar o eliminar tu información en cualquier momento desde Configuración > Gestión de datos personales."},
    {t:"Seguridad", d:"Trabajamos para proteger tu información aplicando buenas prácticas de seguridad."},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <p style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{translateText("Última actualización: julio de 2026") }</p>
      {secciones.map((s,i)=>(
        <div key={i}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:6}}>{s.t}</div>
          <div style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif",lineHeight:1.6}}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

// ── PREGUNTAS FRECUENTES ─────────────────────────────────────────
const FAQS = [
  {categoria:"Cuenta", preguntas:[
    {q:"¿Cómo cambio mi nombre?", a:"Andá a Configuración > Cuenta > Nombre y guardá el cambio."},
    {q:"¿Puedo tener más de un emprendimiento?", a:"Sí, desde el selector arriba a la izquierda podés crear y cambiar entre emprendimientos."},
  ]},
  {categoria:"Stock", preguntas:[
    {q:"¿Cómo recibo alertas de stock bajo?", a:"Activalas al crear o editar un producto, en la sección Alertas de reposición."},
    {q:"¿Puedo ver el historial de movimientos de un producto?", a:"Sí, tocá el producto y después la pestaña Historial dentro de Stock."},
  ]},
  {categoria:"Finanzas", preguntas:[
    {q:"¿Cómo registro una venta rápido?", a:"Desde Finanzas, tocá 'Registrar venta' y elegí el producto del stock: el precio y el costo se completan solos."},
    {q:"¿Qué diferencia hay entre gasto fijo y variable?", a:"Los fijos se repiten todos los meses (alquiler, servicios); los variables cambian según tu producción."},
  ]},
  {categoria:"Pedidos", preguntas:[
    {q:"¿Puedo ver el detalle de un pedido ya creado?", a:"Sí, tocá cualquier pedido de la lista para ver toda su información."},
  ]},
];

function FAQContent(){
  const [busqueda,setBusqueda]=useState("");
  const filtradas = FAQS.map(cat=>({
    ...cat,
    preguntas: cat.preguntas.filter(p=>p.q.toLowerCase().includes(busqueda.toLowerCase())||p.a.toLowerCase().includes(busqueda.toLowerCase())),
  })).filter(cat=>cat.preguntas.length>0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <TInput placeholder="Buscar en preguntas frecuentes..." value={busqueda} onChange={setBusqueda}/>
      {filtradas.length===0
        ? <DashedEmpty icon="help" text="Sin resultados"/>
        : filtradas.map(cat=>(
            <div key={cat.categoria}>
              <SLbl c={cat.categoria}/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {cat.preguntas.map((p,i)=>(
                  <Block key={i} icon="help" title={p.q} defaultOpen={false}>
                    <div style={{fontSize:13,color:C.sub,fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>{p.a}</div>
                  </Block>
                ))}
              </div>
            </div>
          ))
      }
    </div>
  );
}

// ── CONTACTO ────────────────────────────────────────────────────
function ContactoSoporteForm(){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif"}}>Contacto</div>
      <div style={{fontSize:15,fontWeight:600,color:C.text,fontFamily:"'Inter',sans-serif"}}>
        emprender.app.contacto@gmail.com
      </div>
    </div>
  );
}

// ── IDIOMA ────────────────────────────────────────────────────────
const IDIOMAS = [{id:"Español",disponible:true}];
function IdiomaForm({idioma,setIdioma,onClose,mostrarToast}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {IDIOMAS.map(l=>(
        <button key={l.id} disabled={!l.disponible} onClick={()=>{setIdioma("Español");mostrarToast("Idioma actualizado");onClose();}}
          style={{width:"100%",textAlign:"left",background:idioma===l.id?C.gold+"12":"transparent",border:`1px solid ${idioma===l.id?C.gold:C.border}`,borderRadius:12,padding:"12px 14px",cursor:l.disponible?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:l.disponible?1:.5}}>
          <span style={{fontSize:14,fontWeight:600,color:idioma===l.id?C.gold:C.text,fontFamily:"'Inter',sans-serif"}}>{l.id}</span>
          {idioma===l.id ? <Icon n="check" size={15} color={C.gold}/> : !l.disponible && <span style={{fontSize:10,color:C.muted,fontFamily:"'Montserrat',sans-serif",fontWeight:700}}>{translateText("Próximamente")}</span>}
        </button>
      ))}
    </div>
  );
}

// ── CONFIGURACIÓN ─────────────────────────────────────────────────
function Configuracion({temaOscuro,cambiarTema,persona,actualizarPersona,email,setEmail,passwordMock,setPasswordMock,idioma,setIdioma,consentimientoDatos,setConsentimientoDatos,onCerrarSesion,onEliminarCuenta,onExportarDatos,onImportarDatos,mostrarToast}){
  const [notifGenerales,setNotifGenerales]=useState(true);
  const [notifTareas,setNotifTareas]=useState(true);
  const [notifVencimientos,setNotifVencimientos]=useState(false);
  const [vista,setVista]=useState("principal");
  const [abierto,setAbierto]=useState(null);
  const [confirmarLogout,setConfirmarLogout]=useState(false);
  const [confirmarEliminar,setConfirmarEliminar]=useState(false);

  const toggleNotif = (setter,valor,etiqueta) => { setter(valor); mostrarToast(`${etiqueta} ${valor?"activadas":"desactivadas"}`); };

  if(vista==="politica") return <SubPage title="Política de privacidad" onBack={()=>setVista("principal")}><PoliticaPrivacidadContent/></SubPage>;
  if(vista==="permisos") return <SubPage title="Permisos de la app" onBack={()=>setVista("principal")}><PermisosContent/></SubPage>;
  if(vista==="faq") return <SubPage title="Preguntas frecuentes" onBack={()=>setVista("principal")}><FAQContent/></SubPage>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20,position:"relative"}}>
      <div style={{paddingTop:4}}>
        <h1 style={{fontSize:24,fontWeight:800,color:C.text,margin:0,fontFamily:"'Montserrat',sans-serif"}}>{translateText("Configuración")}</h1>
      </div>

      <ConfigSection title={translateText("Cuenta")}>
        <ConfigRow icon="user" label={translateText("Nombre")} sub={persona||"Sin nombre"} onClick={()=>setAbierto("nombre")}/>
        <ConfigRow icon="mail" label="Correo" sub={email} onClick={()=>setAbierto("correo")}/>
        <ConfigRow icon="lock" label="Cambiar contraseña" onClick={()=>setAbierto("password")}/>
        <ConfigRow icon="logout" label={translateText("Cerrar sesión")} danger onClick={()=>setConfirmarLogout(true)}/>
      </ConfigSection>

      <ConfigSection title="Privacidad y seguridad">
        <ConfigRow icon="shield" label="Política de privacidad" onClick={()=>setVista("politica")}/>
        <ConfigRow icon="file"   label="Gestión de datos personales" onClick={()=>setAbierto("datos")}/>
        <ConfigRow icon="bell"   label="Permisos de la app" sub="Notificaciones, cámara" onClick={()=>setVista("permisos")}/>
      </ConfigSection>

      <ConfigSection title="Notificaciones">
        <ConfigRow icon="bell" label="Notificaciones generales" right={<Toggle on={notifGenerales} setOn={v=>toggleNotif(setNotifGenerales,v,"Notificaciones generales")}/>}/>
        <ConfigRow icon="bell" label="Recordatorios de tareas" right={<Toggle on={notifTareas} setOn={v=>toggleNotif(setNotifTareas,v,"Recordatorios de tareas")}/>}/>
        <ConfigRow icon="bell" label="Avisos de vencimientos" right={<Toggle on={notifVencimientos} setOn={v=>toggleNotif(setNotifVencimientos,v,"Avisos de vencimientos")}/>}/>
      </ConfigSection>

      <ConfigSection title="Apariencia">
        <ConfigRow icon="moon" label="Modo oscuro" sub={temaOscuro?"Activado":"Desactivado"} right={<Toggle on={temaOscuro} setOn={v=>{cambiarTema(v);mostrarToast(`Modo ${v?"oscuro":"claro"} activado`);}}/>}/>
        <ConfigRow icon="file" label={translateText("Idioma")} sub={idioma} onClick={()=>setAbierto("idioma")}/>
      </ConfigSection>

      <ConfigSection title="Ayuda">
        <ConfigRow icon="help" label="Preguntas frecuentes" onClick={()=>setVista("faq")}/>
        <ConfigRow icon="msg"  label="Contactar soporte" onClick={()=>setAbierto("soporte")}/>
      </ConfigSection>

      {abierto==="nombre"&&(
        <Sheet title="Editar nombre" onClose={()=>setAbierto(null)}>
          <EditarNombreForm valorInicial={persona} onClose={()=>setAbierto(null)} onSave={n=>{actualizarPersona(n);}}/>
        </Sheet>
      )}
      {abierto==="correo"&&(
        <Sheet title="Cambiar correo" onClose={()=>setAbierto(null)}>
          <CambiarCorreoForm emailActual={email} passwordReal={passwordMock} onClose={()=>setAbierto(null)} onGuardar={nuevo=>{setEmail(nuevo);mostrarToast("Correo actualizado");}}/>
        </Sheet>
      )}
      {abierto==="password"&&(
        <Sheet title="Cambiar contraseña" onClose={()=>setAbierto(null)}>
          <CambiarPasswordForm passwordActualReal={passwordMock} onClose={()=>setAbierto(null)} onGuardar={nueva=>{setPasswordMock(nueva);mostrarToast("Contraseña actualizada");}}/>
        </Sheet>
      )}
      {abierto==="datos"&&(
        <Sheet title="Gestión de datos personales" onClose={()=>setAbierto(null)}>
          <GestionDatosContent onDescargar={onExportarDatos} onImportar={onImportarDatos} consentimiento={consentimientoDatos} setConsentimiento={v=>{setConsentimientoDatos(v);mostrarToast("Preferencia guardada");}} onSolicitarEliminar={()=>{setAbierto(null);setConfirmarEliminar(true);}}/>
        </Sheet>
      )}
      {abierto==="idioma"&&(
        <Sheet title={translateText("Idioma")} onClose={()=>setAbierto(null)}>
          <IdiomaForm idioma={idioma} setIdioma={setIdioma} onClose={()=>setAbierto(null)} mostrarToast={mostrarToast}/>
        </Sheet>
      )}
      {abierto==="soporte"&&(
        <Sheet title="Contactar soporte" onClose={()=>setAbierto(null)}>
          <ContactoSoporteForm email={email} onClose={()=>setAbierto(null)} mostrarToast={mostrarToast}/>
        </Sheet>
      )}

      {confirmarLogout&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onClick={()=>setConfirmarLogout(false)}>
          <div style={{background:C.card,borderRadius:20,padding:"24px 22px",width:"85%",maxWidth:320,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif",marginBottom:18}}>{translateText("¿Estás segura de que querés cerrar sesión?") }</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmarLogout(false)} style={{flex:1,padding:"11px",borderRadius:12,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Cancelar")}</button>
              <button onClick={onCerrarSesion} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:C.red,color:"#fff",fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Cerrar sesión") }</button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400}} onClick={()=>setConfirmarEliminar(false)}>
          <div style={{background:C.card,borderRadius:20,padding:"24px 22px",width:"85%",maxWidth:320,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:C.red,fontFamily:"'Montserrat',sans-serif",marginBottom:8}}>{translateText("¿Eliminar tu cuenta?") }</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"'Inter',sans-serif",marginBottom:18,lineHeight:1.5}}>Se borrarán todos tus datos: productos, pedidos, movimientos y emprendimientos. Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmarEliminar(false)} style={{flex:1,padding:"11px",borderRadius:12,border:`1.5px solid ${C.border}`,background:"transparent",color:C.sub,fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Cancelar")}</button>
              <button onClick={onEliminarCuenta} style={{flex:1,padding:"11px",borderRadius:12,border:"none",background:C.red,color:"#fff",fontSize:13,fontFamily:"'Montserrat',sans-serif",fontWeight:700,cursor:"pointer"}}>{translateText("Eliminar")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PANTALLA DE LOGIN ────────────────────────────────────────────
function PantallaLogin({onIniciarSesion,onVolver,modoInicial="login"}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmarPassword,setConfirmarPassword]=useState("");
  const [verPass,setVerPass]=useState(false);
  const registro=modoInicial==="register";

  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <button onClick={onVolver} style={{width:38,height:38,borderRadius:12,background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon n="chevL" size={18} color={C.sub}/></button>
          <span style={{fontSize:11,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif",letterSpacing:.5}}>{registro?"CREAR CUENTA":"INICIAR SESIÓN"}</span>
          <div style={{width:38}}/>
        </div>
        <div style={{textAlign:"center",marginBottom:6}}>
          <img src="/logo-emprender.png" alt="Emprender" style={{width:76,height:76,objectFit:"contain",margin:"0 auto 12px",display:"block"}}/>
          <h1 style={{fontSize:25,fontWeight:900,color:C.text,fontFamily:"'Montserrat',sans-serif",margin:0}}>{registro?"Crear tu cuenta":"Bienvenido de vuelta"}</h1>
          <p style={{fontSize:13,color:C.muted,fontFamily:"'Inter',sans-serif",marginTop:7,lineHeight:1.45}}>{registro?"Comenzá a organizar tu emprendimiento":"Ingresá para continuar con tu emprendimiento"}</p>
        </div>
        <div><FLbl c={translateText("Correo electrónico")}/><TInput type="email" placeholder="tu@email.com" value={email} onChange={setEmail}/></div>
        <div>
          <FLbl c={translateText("Contraseña")}/>
          <div style={{position:"relative"}}>
            <input type={verPass?"text":"password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
              style={{width:"100%",background:"transparent",border:"none",borderBottom:`1.5px solid ${C.border}`,padding:"11px 30px 11px 0",color:C.text,fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",boxSizing:"border-box"}}/>
            <button onClick={()=>setVerPass(v=>!v)} style={{position:"absolute",right:0,top:8,background:"none",border:"none",cursor:"pointer",padding:4}}><Icon n={verPass?"eyeOff":"eye"} size={15} color={C.muted}/></button>
          </div>
        </div>
        {registro&&<div><FLbl c="Confirmar contraseña"/><TInput type="password" placeholder="••••••••" value={confirmarPassword} onChange={setConfirmarPassword}/></div>}
        <PrimaryBtn label={registro?"Crear cuenta":"Iniciar sesión"} onClick={()=>onIniciarSesion({email,password,confirmarPassword,registro})}/>
      </div>
    </div>
  );
}


const NAV=[
  {id:"inicio",  icon:"home",     label:"Inicio"},
  {id:"pedidos", icon:"orders",   label:"Pedidos"},
  {id:"stock",   icon:"box",      label:"Stock"},
  {id:"finanzas",icon:"bars",     label:"Finanzas"},
  {id:"mas",     icon:"menu",     label:"Más"},
  {id:"config",  icon:"settings", label:"Config"},
];

export default function App(){
  const [sesionActiva,setSesionActiva]=useState(false);
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setSesionActiva(true);
      setPantallaInicio(false);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session) {
        setSesionActiva(true);
        setPantallaInicio(false);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
  const [pantallaInicio,setPantallaInicio]=useState(true);
  const [modoLogin,setModoLogin]=useState("login");
  const [sec,setSec]=useState("inicio");
  const [empOpen,setEmpOpen]=useState(false);
  const [emprendimientos,setEmprendimientos]=usePersistentState("emprender_v2_emprendimientos",[]);
  const [empActualId,setEmpActualId]=usePersistentState("emprender_v2_emp_actual",null);
  const [wizardOpen,setWizardOpen]=useState(false);
  const [onboardingCompleted,setOnboardingCompleted]=usePersistentState("emprender_v2_onboarding_completed",false);
  const empActual = emprendimientos.find(e=>e.id===empActualId) || emprendimientos[0] || {id:null,nombre:"",persona:"",rubro:""};

  const [email,setEmail]=usePersistentState("emprender_v2_email","");
  const [passwordMock,setPasswordMock]=usePersistentState("emprender_v2_password","");
  const [consentimientoDatos,setConsentimientoDatos]=usePersistentState("emprender_v2_consentimiento",false);
  const [idioma,setIdiomaState]=usePersistentState("emprender_v2_idioma","Español");
  const setIdioma=()=>{CURRENT_LANG="Español"; setIdiomaState("Español"); try{localStorage.setItem("emprender_v2_idioma",JSON.stringify("Español"));}catch(_){}};
  CURRENT_LANG="Español";
  const [toast,setToast]=useState(null);

  useEffect(()=>{
    CURRENT_LANG="Español";
    try{document.documentElement.lang="es";}catch(_){}
  },[idioma]);

  const mostrarToast = (mensaje,tipo="exito") => {
    setToast({mensaje,tipo});
  };

  useEffect(()=>{
    if(sesionActiva && !onboardingCompleted) setWizardOpen(true);
  },[sesionActiva,onboardingCompleted]);
  useEffect(()=>{
    if(!toast) return;
    const t=setTimeout(()=>setToast(null),3000);
    return ()=>clearTimeout(t);
  },[toast]);

  const actualizarPersona = (nuevoNombre) => {
    setEmprendimientos(es=>es.map(e=>e.id===empActualId?{...e,persona:nuevoNombre}:e));
    mostrarToast("Nombre actualizado");
  };

  const cerrarSesion = async () => {
  await supabase.auth.signOut();
  setSesionActiva(false);
  setPantallaInicio(true);
  setSec("inicio");
};
    
  const eliminarCuenta = () => {
    Object.keys(localStorage).filter(k=>k.startsWith("emprender_v2_")).forEach(k=>localStorage.removeItem(k));
    setEmprendimientos([]); setEmpActualId(null); setProductos([]); setMovs([]); setPedidos([]); setOnboardingCompleted(false);
    setSesionActiva(false);
    mostrarToast("Datos eliminados");
  };

  const exportarDatos = () => {
    const datos={version:3,exportadoEl:new Date().toISOString(),app:"Emprender"};
    Object.keys(localStorage).filter(k=>k.startsWith("emprender_v2_")).forEach(k=>{
      try{datos[k]=JSON.parse(localStorage.getItem(k));}catch(_){datos[k]=localStorage.getItem(k);}
    });
    const blob = new Blob([JSON.stringify(datos,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="respaldo-emprender.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    mostrarToast("Copia de seguridad descargada");
  };

  const importarDatos = async (file) => {
    try{
      const text=await file.text(); const data=JSON.parse(text);
      const keys=Object.keys(data).filter(k=>k.startsWith("emprender_v2_"));
      if(!keys.length) throw new Error("archivo");
      keys.forEach(k=>localStorage.setItem(k,JSON.stringify(data[k])));
      mostrarToast("Copia restaurada. Reiniciando…");
      setTimeout(()=>window.location.reload(),700);
    }catch(_){mostrarToast("No se pudo restaurar la copia","error");}
  };

  const seleccionarEmp = (id) => { setEmpActualId(id); setEmpOpen(false); };
  const finalizarWizard = ({nombre,persona,rubro}) => {
    const nuevo = { id:Date.now(), nombre, persona, rubro };
    setEmprendimientos(es=>[...es,nuevo]);
    setEmpActualId(nuevo.id);
    setOnboardingCompleted(true);
    setWizardOpen(false);
    setEmpOpen(false);
  };
  const [masOpen,setMasOpen]=useState(false);
  const [notifOpen,setNotifOpen]=useState(false);
  const [temaOscuro,setTemaOscuro]=usePersistentState("emprender_v2_tema",false);
  const cambiarTema = (oscuro) => { setTema(oscuro); setTemaOscuro(oscuro); };

  const [productos,setProductos]=usePersistentState("emprender_v2_productos",[]);
  const [movs,setMovs]=usePersistentState("emprender_v2_movs",[]);
  const [pedidos,setPedidos]=usePersistentState("emprender_v2_pedidos",[]);

  const productosEnAlerta = productos.filter(p => p.alertaActiva!==false && p.stockInicial <= (p.umbralAlerta||p.stockMinimo));
  const pedidosPendientes = pedidos.filter(p => ["Pendiente","En preparación","Listo para entregar"].includes(p.estado));

  const screens={
    inicio:      <Inicio setSec={setSec} emprendimiento={empActual} productos={productos} movs={movs} pedidos={pedidos}/>,
    pedidos:     <Pedidos pedidos={pedidos} setPedidos={setPedidos}/>,
    stock:       <Stock productos={productos} setProductos={setProductos}/>,
    finanzas:    <Finanzas movs={movs} setMovs={setMovs} productos={productos} setProductos={setProductos}/>,
    config:      <Configuracion
                    temaOscuro={temaOscuro} cambiarTema={cambiarTema}
                    persona={empActual.persona} actualizarPersona={actualizarPersona}
                    email={email} setEmail={setEmail}
                    passwordMock={passwordMock} setPasswordMock={setPasswordMock}
                    idioma="Español" setIdioma={setIdioma}
                    consentimientoDatos={consentimientoDatos} setConsentimientoDatos={setConsentimientoDatos}
                    onCerrarSesion={cerrarSesion} onEliminarCuenta={eliminarCuenta} onExportarDatos={exportarDatos} onImportarDatos={importarDatos}
                    mostrarToast={mostrarToast}
                  />,
    proveedores: <SubPage title={translateText("Proveedores")} onBack={()=>{setSec("inicio");setMasOpen(true);}}><Proveedores/></SubPage>,
    metas:       <SubPage title={translateText("Metas")} onBack={()=>{setSec("inicio");setMasOpen(true);}}><Metas productos={productos} movs={movs}/></SubPage>,
    calendario:  <SubPage title={translateText("Calendario")} onBack={()=>{setSec("inicio");setMasOpen(true);}}><Calendario/></SubPage>,
    historial:   <SubPage title="Historial" onBack={()=>{setSec("inicio");setMasOpen(true);}}><Historial productos={productos} movs={movs} pedidos={pedidos}/></SubPage>,
  };

  const isSubPage = ["proveedores","metas","calendario","historial"].includes(sec);

  const handleNav = (id) => {
    if (id==="mas") setMasOpen(true);
    else setSec(id);
  };

  if(pantallaInicio){
    return <WelcomeEmprender onLogin={()=>{setModoLogin("login");setPantallaInicio(false)}} onRegister={()=>{setModoLogin("register");setPantallaInicio(false)}}/>;
  }

  if(!sesionActiva){
    return <PantallaLogin
  modoInicial={modoLogin}
  onVolver={()=>setPantallaInicio(true)}
  onIniciarSesion={async ({email,password,confirmarPassword,registro})=>{
    if(registro && password !== confirmarPassword){
      alert("Las contraseñas no coinciden.");
      return;
    }

    if(!email || !password){
      alert("Completá el correo electrónico y la contraseña.");
      return;
    }

    const {data,error} = registro
      ? await supabase.auth.signUp({email,password})
      : await supabase.auth.signInWithPassword({email,password});

    if(error){
      alert(error.message);
      return;
    }

    if(registro && !data.session){
      alert("Cuenta creada. Revisá tu correo para confirmar el registro.");
      return;
    }

    setSesionActiva(true);
  }}
/>;
  }

  return (
    <div style={{position:"relative",maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"'Inter',sans-serif"}}>
      <style>{`@keyframes slideUp{from{transform:translateY(24px);opacity:.6}to{transform:translateY(0);opacity:1}} @keyframes popIn{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.05);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>

      {!isSubPage && (
        <div style={{background:C.navBg,borderBottom:`1px solid ${C.border}`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <button onClick={()=>setEmpOpen(o=>!o)} style={{flex:1,minWidth:0,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:C.gold+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:16,fontWeight:800,color:C.gold,fontFamily:"'Montserrat',sans-serif"}}>{empActual.nombre.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:15,fontWeight:800,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{empActual.nombre}</span>
                <Icon n="chevD" size={13} color={C.muted}/>
              </div>
              <div style={{fontSize:11,color:C.muted,fontFamily:"'Inter',sans-serif"}}>{empActual.rubro||"Emprendimiento"}</div>
            </div>
          </button>
          <button onClick={()=>setNotifOpen(true)} style={{position:"relative",width:38,height:38,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon n="bell" size={17} color={C.sub}/>
            {(productosEnAlerta.length+pedidosPendientes.length)>0&&(
              <span style={{position:"absolute",top:-2,right:-2,minWidth:16,height:16,padding:"0 3px",borderRadius:8,background:C.red,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Montserrat',sans-serif"}}>{productosEnAlerta.length+pedidosPendientes.length}</span>
            )}
          </button>
        </div>
      )}
      {empOpen&&<EmpDrop emprendimientos={emprendimientos} empActualId={empActualId} onSelect={seleccionarEmp} onNuevo={()=>{setWizardOpen(true);setEmpOpen(false);}} onClose={()=>setEmpOpen(false)}/>}
      {wizardOpen&&<OnboardingEmprendimiento onClose={()=>setWizardOpen(false)} onFinish={finalizarWizard}/>}
      {notifOpen&&(
        <Sheet title="Notificaciones" fixed onClose={()=>setNotifOpen(false)}>
          {productosEnAlerta.length===0 && pedidosPendientes.length===0
            ? <DashedEmpty icon="bell" text="Sin novedades por ahora"/>
            : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pedidosPendientes.map((p,i)=>(
                  <div key={`pedido-${i}`} onClick={()=>{setNotifOpen(false);setSec("pedidos");}} style={{background:C.gold+"10",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                    <Icon n="orders" size={16} color={C.gold}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>Pedido de {p.clienteNombre||"cliente"}</div>
                      <div style={{fontSize:11,color:C.gold,fontFamily:"'Inter',sans-serif",marginTop:1}}>{p.estado} · {moneyAR(p.total)}</div>
                    </div>
                  </div>
                ))}
                {productosEnAlerta.map((p,i)=>(
                  <div key={`stock-${i}`} onClick={()=>{setNotifOpen(false);setSec("stock");}} style={{background:C.red+"10",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                    <Icon n="alert" size={16} color={C.red}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Montserrat',sans-serif"}}>{p.nombre}</div>
                      <div style={{fontSize:11,color:C.red,fontFamily:"'Inter',sans-serif",marginTop:1}}>Stock bajo: {p.stockInicial} {p.unidad?.toLowerCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Sheet>
      )}

      <div style={isSubPage?{}:{padding:"16px 18px 100px"}}>
        {screens[sec]}
      </div>

      {masOpen&&<MasMenu onClose={()=>setMasOpen(false)} onSelect={(id)=>{setSec(id);setMasOpen(false);}}/>}

      {!isSubPage && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:C.navBg,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 6px calc(env(safe-area-inset-bottom,0px) + 8px)"}}>
          {NAV.map(n=>{
            const active = n.id==="mas" ? masOpen : sec===n.id;
            return (
              <button key={n.id} onClick={()=>handleNav(n.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 0"}}>
                <Icon n={n.icon} size={20} color={active?C.gold:C.muted}/>
                <span style={{fontSize:10,fontWeight:active?700:500,color:active?C.gold:C.muted,fontFamily:"'Montserrat',sans-serif"}}>{translateText(n.label)}</span>
              </button>
            );
          })}
        </div>
      )}

      {toast&&(
        <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 36px)",maxWidth:394,zIndex:600,animation:"slideUp .25s ease"}}>
          <div style={{background:toast.tipo==="error"?C.red:C.text,borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 6px 20px rgba(0,0,0,.25)"}}>
            <Icon n={toast.tipo==="error"?"alert":"check"} size={16} color="#fff"/>
            <span style={{fontSize:13,fontWeight:600,color:"#fff",fontFamily:"'Inter',sans-serif",flex:1}}>{toast.mensaje}</span>
          </div>
        </div>
      )}
    </div>
  );
}
