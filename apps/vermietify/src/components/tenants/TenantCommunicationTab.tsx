 import { useState, useEffect, useRef } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { EmptyState } from "@/components/shared";
 import { MessageSquare, Send } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { useToast } from "@/hooks/use-toast";
 import { useAuth } from "@/hooks/useAuth";
 
 interface TenantCommunicationTabProps {
   tenantId: string;
   tenantName: string;
 }
 
 interface Message {
   id: string;
   subject: string;
   content: string;
   created_at: string;
   is_read: boolean;
   sent_at: string | null;
 }
 
 export function TenantCommunicationTab({ tenantId, tenantName }: TenantCommunicationTabProps) {
   const { toast } = useToast();
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [newMessage, setNewMessage] = useState("");
   const scrollAreaRef = useRef<HTMLDivElement>(null);
 
   const { data: messages, isLoading } = useQuery({
     queryKey: ["messages", "tenant", tenantId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("messages")
         .select("*")
         .eq("tenant_id", tenantId)
         .order("created_at", { ascending: true });
 
       if (error) throw error;
       return data as Message[];
     },
   });
 
   const sendMessage = useMutation({
     mutationFn: async (content: string) => {
       const { data: profile } = await supabase
         .from("profiles")
         .select("organization_id")
         .eq("user_id", user?.id)
         .single();
 
       if (!profile?.organization_id) throw new Error("Organization not found");
 
       const { data, error } = await supabase
         .from("messages")
         .insert({
           organization_id: profile.organization_id,
           tenant_id: tenantId,
           subject: "Nachricht",
           content,
           sent_at: new Date().toISOString(),
         })
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["messages", "tenant", tenantId] });
       setNewMessage("");
       toast({
         title: "Nachricht gesendet",
         description: "Ihre Nachricht wurde erfolgreich gesendet.",
       });
     },
     onError: () => {
       toast({
         title: "Fehler",
         description: "Die Nachricht konnte nicht gesendet werden.",
         variant: "destructive",
       });
     },
   });
 
   useEffect(() => {
     const channel = supabase
       .channel(`messages-tenant-${tenantId}`)
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "messages",
           filter: `tenant_id=eq.${tenantId}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ["messages", "tenant", tenantId] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [tenantId, queryClient]);
 
   useEffect(() => {
     if (scrollAreaRef.current) {
       scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
     }
   }, [messages]);
 
   const handleSend = () => {
     if (!newMessage.trim()) return;
     sendMessage.mutate(newMessage);
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault();
       handleSend();
     }
   };
 
   const tenantInitials = tenantName
     .split(" ")
     .map((n) => n.charAt(0))
     .join("")
     .toUpperCase()
     .substring(0, 2);
 
   return (
     <Card className="h-[600px] flex flex-col">
       <CardHeader className="border-b">
         <CardTitle className="flex items-center gap-2">
           <MessageSquare className="h-5 w-5" />
           Kommunikation mit {tenantName}
         </CardTitle>
       </CardHeader>
       <CardContent className="flex-1 flex flex-col p-0">
         {isLoading ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
           </div>
         ) : !messages || messages.length === 0 ? (
           <div className="flex-1 flex items-center justify-center p-6">
             <EmptyState
               icon={MessageSquare}
               title="Keine Nachrichten"
               description="Beginnen Sie die Kommunikation mit diesem Mieter."
             />
           </div>
         ) : (
           <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
             <div className="space-y-4">
               {messages.map((message) => {
                 const isFromLandlord = !!message.sent_at;
                 
                 return (
                   <div
                     key={message.id}
                     className={`flex gap-3 ${isFromLandlord ? "flex-row-reverse" : ""}`}
                   >
                     <Avatar className="h-8 w-8 shrink-0">
                       <AvatarFallback className={isFromLandlord ? "bg-primary text-primary-foreground" : ""}>
                         {isFromLandlord ? "V" : tenantInitials}
                       </AvatarFallback>
                     </Avatar>
                     <div
                       className={`max-w-[70%] rounded-lg p-3 ${
                         isFromLandlord
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted"
                       }`}
                     >
                       <p className="text-sm">{message.content}</p>
                       <p
                         className={`text-xs mt-1 ${
                           isFromLandlord ? "text-primary-foreground/70" : "text-muted-foreground"
                         }`}
                       >
                         {format(new Date(message.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
         )}
 
         <div className="p-4 border-t">
           <div className="flex gap-2">
             <Input
               placeholder="Nachricht schreiben..."
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               onKeyPress={handleKeyPress}
               disabled={sendMessage.isPending}
             />
             <Button
               onClick={handleSend}
               disabled={!newMessage.trim() || sendMessage.isPending}
             >
               <Send className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }