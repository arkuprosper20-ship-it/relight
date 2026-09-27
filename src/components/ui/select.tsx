import * as React from "react";
import { cn } from "@/lib/utils";
export function Select({value,onValueChange,children,defaultValue}: {value?:string; onValueChange?:(v:string)=>void; children:React.ReactNode; defaultValue?:string}) { return <div data-select-value={value ?? defaultValue}>{React.Children.map(children,c=>React.isValidElement(c)?React.cloneElement(c as React.ReactElement<any>,{value,onValueChange}):c)}</div>; }
export function SelectTrigger({className,children}:any){return <button type="button" className={cn("flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm",className)}>{children}</button>}
export function SelectValue({placeholder}:any){return <span>{placeholder}</span>}
export function SelectContent({children}:any){return <div className="mt-1 rounded-md border bg-background p-1 shadow-lg">{children}</div>}
export function SelectItem({value,children,onValueChange}:any){return <button type="button" className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={()=>onValueChange?.(value)}>{children}</button>}
