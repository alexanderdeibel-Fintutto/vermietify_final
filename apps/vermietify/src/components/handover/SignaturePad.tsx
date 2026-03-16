 import React, { useRef, useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Eraser, Check } from "lucide-react";
 
 interface SignaturePadProps {
   onSave: (signatureDataUrl: string) => void;
   onCancel?: () => void;
   width?: number;
   height?: number;
 }
 
 export function SignaturePad({ onSave, onCancel, width = 400, height = 200 }: SignaturePadProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [hasDrawn, setHasDrawn] = useState(false);
 
   useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
 
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
     // Set up canvas
     ctx.fillStyle = "#ffffff";
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     ctx.strokeStyle = "#000000";
     ctx.lineWidth = 2;
     ctx.lineCap = "round";
     ctx.lineJoin = "round";
   }, []);
 
   const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
     const canvas = canvasRef.current;
     if (!canvas) return { x: 0, y: 0 };
 
     const rect = canvas.getBoundingClientRect();
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
 
     if ("touches" in e) {
       return {
         x: (e.touches[0].clientX - rect.left) * scaleX,
         y: (e.touches[0].clientY - rect.top) * scaleY,
       };
     }
     return {
       x: (e.clientX - rect.left) * scaleX,
       y: (e.clientY - rect.top) * scaleY,
     };
   };
 
   const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
     e.preventDefault();
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext("2d");
     if (!ctx) return;
 
     const { x, y } = getCoordinates(e);
     ctx.beginPath();
     ctx.moveTo(x, y);
     setIsDrawing(true);
   };
 
   const draw = (e: React.TouchEvent | React.MouseEvent) => {
     if (!isDrawing) return;
     e.preventDefault();
 
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext("2d");
     if (!ctx) return;
 
     const { x, y } = getCoordinates(e);
     ctx.lineTo(x, y);
     ctx.stroke();
     setHasDrawn(true);
   };
 
   const stopDrawing = () => {
     setIsDrawing(false);
   };
 
   const clearCanvas = () => {
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext("2d");
     if (!ctx || !canvas) return;
 
     ctx.fillStyle = "#ffffff";
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     setHasDrawn(false);
   };
 
   const saveSignature = () => {
     const canvas = canvasRef.current;
     if (!canvas || !hasDrawn) return;
 
     const dataUrl = canvas.toDataURL("image/png");
     onSave(dataUrl);
   };
 
   return (
     <div className="space-y-4">
       <div className="border rounded-lg overflow-hidden bg-white">
         <canvas
           ref={canvasRef}
           width={width}
           height={height}
           className="w-full touch-none cursor-crosshair"
           onMouseDown={startDrawing}
           onMouseMove={draw}
           onMouseUp={stopDrawing}
           onMouseLeave={stopDrawing}
           onTouchStart={startDrawing}
           onTouchMove={draw}
           onTouchEnd={stopDrawing}
         />
       </div>
       <p className="text-xs text-muted-foreground text-center">
         Unterschreiben Sie im Feld oben
       </p>
       <div className="flex gap-2 justify-end">
         <Button variant="outline" size="sm" onClick={clearCanvas}>
           <Eraser className="h-4 w-4 mr-2" />
           Löschen
         </Button>
         {onCancel && (
           <Button variant="outline" size="sm" onClick={onCancel}>
             Abbrechen
           </Button>
         )}
         <Button size="sm" onClick={saveSignature} disabled={!hasDrawn}>
           <Check className="h-4 w-4 mr-2" />
           Bestätigen
         </Button>
       </div>
     </div>
   );
 }