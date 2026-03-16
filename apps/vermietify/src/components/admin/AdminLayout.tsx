 import { ReactNode } from "react";
 import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
 import { AdminSidebar } from "./AdminSidebar";
 import { Separator } from "@/components/ui/separator";
 
 interface AdminLayoutProps {
   children: ReactNode;
   title?: string;
 }
 
 export function AdminLayout({ children, title }: AdminLayoutProps) {
   return (
     <SidebarProvider>
       <AdminSidebar />
       <SidebarInset>
         <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
           <SidebarTrigger className="-ml-1" />
           <Separator orientation="vertical" className="mr-2 h-4" />
           {title && <h1 className="font-semibold">{title}</h1>}
         </header>
         <main className="flex-1 overflow-auto p-6">
           {children}
         </main>
       </SidebarInset>
     </SidebarProvider>
   );
 }