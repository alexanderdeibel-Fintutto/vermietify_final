 import { ReactNode } from "react";
 import { TenantSidebar } from "./TenantSidebar";
 
 interface TenantLayoutProps {
   children: ReactNode;
 }
 
 export function TenantLayout({ children }: TenantLayoutProps) {
   return (
     <div className="flex min-h-screen w-full bg-background">
       <TenantSidebar />
       <main className="flex-1 overflow-y-auto">
         <div className="container max-w-6xl py-6 px-4 md:px-6">
           {children}
         </div>
       </main>
     </div>
   );
 }