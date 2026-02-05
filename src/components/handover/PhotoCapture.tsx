 import React, { useRef, useState, useCallback } from "react";
 import { Button } from "@/components/ui/button";
 import { Camera, RefreshCw, Check, X, Upload } from "lucide-react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
 interface PhotoCaptureProps {
   onCapture: (imageBlob: Blob) => void;
   onCancel?: () => void;
   trigger?: React.ReactNode;
 }
 
 export function PhotoCapture({ onCapture, onCancel, trigger }: PhotoCaptureProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [stream, setStream] = useState<MediaStream | null>(null);
   const [capturedImage, setCapturedImage] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const startCamera = useCallback(async () => {
     try {
       setError(null);
       const mediaStream = await navigator.mediaDevices.getUserMedia({
         video: { facingMode: "environment", width: 1280, height: 720 },
       });
       setStream(mediaStream);
       if (videoRef.current) {
         videoRef.current.srcObject = mediaStream;
       }
     } catch (err) {
       console.error("Camera error:", err);
       setError("Kamera konnte nicht gestartet werden. Bitte laden Sie ein Foto hoch.");
     }
   }, []);
 
   const stopCamera = useCallback(() => {
     if (stream) {
       stream.getTracks().forEach((track) => track.stop());
       setStream(null);
     }
   }, [stream]);
 
   const handleOpen = () => {
     setIsOpen(true);
     setCapturedImage(null);
     setError(null);
     setTimeout(startCamera, 100);
   };
 
   const handleClose = () => {
     stopCamera();
     setIsOpen(false);
     setCapturedImage(null);
     onCancel?.();
   };
 
   const capturePhoto = () => {
     const video = videoRef.current;
     const canvas = canvasRef.current;
     if (!video || !canvas) return;
 
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
     canvas.width = video.videoWidth;
     canvas.height = video.videoHeight;
     ctx.drawImage(video, 0, 0);
 
     const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
     setCapturedImage(dataUrl);
     stopCamera();
   };
 
   const retakePhoto = () => {
     setCapturedImage(null);
     startCamera();
   };
 
   const confirmPhoto = async () => {
     if (!capturedImage) return;
 
     // Convert data URL to blob
     const response = await fetch(capturedImage);
     const blob = await response.blob();
     onCapture(blob);
     setIsOpen(false);
     setCapturedImage(null);
   };
 
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     const reader = new FileReader();
     reader.onload = () => {
       setCapturedImage(reader.result as string);
       stopCamera();
     };
     reader.readAsDataURL(file);
   };
 
   return (
     <>
       {trigger ? (
         <div onClick={handleOpen}>{trigger}</div>
       ) : (
         <Button variant="outline" size="sm" onClick={handleOpen}>
           <Camera className="h-4 w-4 mr-2" />
           Foto aufnehmen
         </Button>
       )}
 
       <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Foto aufnehmen</DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             {error && (
               <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                 {error}
               </div>
             )}
 
             <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
               {capturedImage ? (
                 <img
                   src={capturedImage}
                   alt="Aufgenommenes Foto"
                   className="w-full h-full object-contain"
                 />
               ) : (
                 <video
                   ref={videoRef}
                   autoPlay
                   playsInline
                   muted
                   className="w-full h-full object-contain"
                 />
               )}
             </div>
 
             <canvas ref={canvasRef} className="hidden" />
 
             <input
               ref={fileInputRef}
               type="file"
               accept="image/*"
               capture="environment"
               className="hidden"
               onChange={handleFileUpload}
             />
 
             <div className="flex gap-2 justify-center">
               {capturedImage ? (
                 <>
                   <Button variant="outline" onClick={retakePhoto}>
                     <RefreshCw className="h-4 w-4 mr-2" />
                     Wiederholen
                   </Button>
                   <Button onClick={confirmPhoto}>
                     <Check className="h-4 w-4 mr-2" />
                     Verwenden
                   </Button>
                 </>
               ) : (
                 <>
                   <Button
                     variant="outline"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     <Upload className="h-4 w-4 mr-2" />
                     Hochladen
                   </Button>
                   <Button onClick={capturePhoto} disabled={!stream}>
                     <Camera className="h-4 w-4 mr-2" />
                     Aufnehmen
                   </Button>
                 </>
               )}
               <Button variant="ghost" onClick={handleClose}>
                 <X className="h-4 w-4" />
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
 }