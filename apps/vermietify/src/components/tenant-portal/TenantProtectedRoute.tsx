 import { ReactNode } from "react";
 import { Navigate } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { useTenantPortal } from "@/hooks/useTenantPortal";
 import { LoadingState } from "@/components/shared";
 
 interface TenantProtectedRouteProps {
   children: ReactNode;
 }
 
 export function TenantProtectedRoute({ children }: TenantProtectedRouteProps) {
   const { user, isLoading: authLoading } = useAuth();
   const { useIsTenant } = useTenantPortal();
   const { data: isTenant, isLoading: roleLoading } = useIsTenant();
 
   if (authLoading || roleLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <LoadingState />
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/login" replace />;
   }
 
   if (!isTenant) {
     return <Navigate to="/dashboard" replace />;
   }
 
   return <>{children}</>;
 }