 import { ReactNode } from "react";
 import { Navigate, useLocation } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2 } from "lucide-react";
 
 interface AdminProtectedRouteProps {
   children: ReactNode;
 }
 
 export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
   const { user, isLoading: authLoading } = useAuth();
   const location = useLocation();
 
   const { data: isAdmin, isLoading: roleLoading } = useQuery({
     queryKey: ["user-role", user?.id, "admin"],
     queryFn: async () => {
       if (!user?.id) return false;
       
       const { data, error } = await supabase
         .rpc("has_role", { _user_id: user.id, _role: "admin" });
       
       if (error) {
         console.error("Role check error:", error);
         return false;
       }
       return data === true;
     },
     enabled: !!user?.id,
   });
 
   if (authLoading || roleLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!user) {
     return <Navigate to="/login" state={{ from: location }} replace />;
   }
 
   if (!isAdmin) {
     return <Navigate to="/dashboard" replace />;
   }
 
   return <>{children}</>;
 }