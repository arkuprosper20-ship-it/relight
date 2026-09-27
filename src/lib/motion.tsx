import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = { opacity?: number; y?: number; x?: number; scale?: number };
type Transition = { duration?: number; ease?: number[] | readonly number[] | string; delay?: number };
export interface MotionProps { children?: ReactNode; initial?: Variant; animate?: Variant; whileHover?: Variant; whileInView?: Variant; viewport?: { once?: boolean; margin?: string }; transition?: Transition; exit?: Variant; className?: string; style?: CSSProperties; [key:string]: unknown; }
function classes(v?: Variant){ if(!v) return ""; const a:string[]=[]; if(v.opacity!==undefined)a.push(v.opacity===0?"opacity-0":v.opacity>=1?"opacity-100":"opacity-70"); if(v.y)a.push(v.y<0?"-translate-y-2":"translate-y-2"); if(v.x)a.push(v.x<0?"-translate-x-2":"translate-x-2"); if(v.scale&&v.scale!==1)a.push(v.scale<1?"scale-95":"scale-105"); return a.join(" "); }
function motionProps(p:MotionProps){ const {initial,animate,whileInView,whileHover,viewport,transition,exit,className,style,children,...rest}=p; void initial; void viewport; void exit; void whileHover; const duration=transition?.duration ? Math.round(transition.duration*1000) : 300; const delay=transition?.delay ? Math.round(transition.delay*1000) : 0; return {className:cn("transition-all",classes(animate||whileInView),className),style:{...style,transitionDuration:`${duration}ms`,transitionDelay:`${delay}ms`},...rest,children}; }
const make=(Tag:any)=>(p:MotionProps)=>{ const q=motionProps(p); return <Tag {...q}/>; };
export const motion={div:make("div"),main:make("main"),span:make("span"),h1:make("h1"),h2:make("h2"),h3:make("h3"),p:make("p"),section:make("section"),button:make("button")};
