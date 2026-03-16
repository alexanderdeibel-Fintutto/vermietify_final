import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

 export function MainLayout({ children, title, breadcrumbs = [], actions }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 backdrop-blur-md bg-white/5">
            <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-white/80 hover:text-white" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-white/20" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-white/70 hover:text-white">Vermietify</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={index}>
                    <BreadcrumbSeparator className="text-white/40" />
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href} className="text-white/70 hover:text-white">{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-white">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
                {breadcrumbs.length === 0 && (
                  <>
                    <BreadcrumbSeparator className="text-white/40" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-white">{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationCenter />
              {actions}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
