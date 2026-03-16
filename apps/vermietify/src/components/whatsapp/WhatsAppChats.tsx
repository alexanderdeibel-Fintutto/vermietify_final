 import { useState, useRef, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { 
   Send, 
   Paperclip, 
   Smile, 
   Check, 
   CheckCheck, 
   Clock,
   Search,
   User,
   Building2
 } from "lucide-react";
 import { useWhatsApp, WhatsAppContact, WhatsAppMessage } from "@/hooks/useWhatsApp";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { cn } from "@/lib/utils";
 
 const statusIcons: Record<string, React.ReactNode> = {
   pending: <Clock className="h-3 w-3 text-muted-foreground" />,
   sent: <Check className="h-3 w-3 text-muted-foreground" />,
   delivered: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
   read: <CheckCheck className="h-3 w-3 text-primary" />,
 };
 
 export function WhatsAppChats() {
   const { contacts, useMessages, sendMessage } = useWhatsApp();
   const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
   const [searchQuery, setSearchQuery] = useState("");
   const [messageText, setMessageText] = useState("");
   const messagesEndRef = useRef<HTMLDivElement>(null);
 
   const { data: messages = [] } = useMessages(selectedContact?.id || null);
 
   const filteredContacts = contacts.filter(contact => {
     const name = contact.display_name || 
       (contact.tenant ? `${contact.tenant.first_name} ${contact.tenant.last_name}` : contact.phone);
     return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       contact.phone.includes(searchQuery);
   });
 
   useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);
 
   const handleSend = async () => {
     if (!selectedContact || !messageText.trim()) return;
     
     await sendMessage.mutateAsync({
       contactPhone: selectedContact.phone,
       content: messageText,
     });
     setMessageText("");
   };
 
   const getContactName = (contact: WhatsAppContact) => {
     if (contact.display_name) return contact.display_name;
     if (contact.tenant) return `${contact.tenant.first_name} ${contact.tenant.last_name}`;
     return contact.phone;
   };
 
   const getInitials = (contact: WhatsAppContact) => {
     const name = getContactName(contact);
     return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
   };
 
   return (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
       {/* Contact List */}
       <Card className="md:col-span-1">
         <CardHeader className="pb-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Kontakte suchen..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9"
             />
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <ScrollArea className="h-[500px]">
             {filteredContacts.length === 0 ? (
               <div className="p-4 text-center text-muted-foreground">
                 <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                 <p className="text-sm">Keine Kontakte gefunden</p>
               </div>
             ) : (
               filteredContacts.map((contact) => (
                 <div
                   key={contact.id}
                   className={cn(
                     "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b",
                     selectedContact?.id === contact.id && "bg-muted"
                   )}
                   onClick={() => setSelectedContact(contact)}
                 >
                   <Avatar>
                     <AvatarFallback className="bg-primary/10 text-primary">
                       {getInitials(contact)}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <p className="font-medium truncate">{getContactName(contact)}</p>
                       {contact.last_message_at && (
                         <span className="text-xs text-muted-foreground">
                           {format(new Date(contact.last_message_at), "HH:mm", { locale: de })}
                         </span>
                       )}
                     </div>
                     <p className="text-sm text-muted-foreground truncate">{contact.phone}</p>
                   </div>
                   {contact.tenant_id && (
                     <Building2 className="h-4 w-4 text-muted-foreground" />
                   )}
                 </div>
               ))
             )}
           </ScrollArea>
         </CardContent>
       </Card>
 
       {/* Chat View */}
       <Card className="md:col-span-2 flex flex-col">
         {selectedContact ? (
           <>
             {/* Chat Header */}
             <CardHeader className="border-b py-3">
               <div className="flex items-center gap-3">
                 <Avatar>
                   <AvatarFallback className="bg-primary/10 text-primary">
                     {getInitials(selectedContact)}
                   </AvatarFallback>
                 </Avatar>
                 <div>
                   <CardTitle className="text-base">{getContactName(selectedContact)}</CardTitle>
                   <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                 </div>
                 {selectedContact.opted_in && (
                   <Badge variant="outline" className="ml-auto">Opt-in</Badge>
                 )}
               </div>
             </CardHeader>
 
             {/* Messages */}
             <CardContent className="flex-1 p-0 overflow-hidden">
               <ScrollArea className="h-[400px] p-4">
                 {messages.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-muted-foreground">
                     <p className="text-sm">Keine Nachrichten</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {messages.map((message) => (
                       <MessageBubble key={message.id} message={message} />
                     ))}
                     <div ref={messagesEndRef} />
                   </div>
                 )}
               </ScrollArea>
             </CardContent>
 
             {/* Input */}
             <div className="p-3 border-t">
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" className="shrink-0">
                   <Paperclip className="h-5 w-5" />
                 </Button>
                 <Button variant="ghost" size="icon" className="shrink-0">
                   <Smile className="h-5 w-5" />
                 </Button>
                 <Input
                   placeholder="Nachricht eingeben..."
                   value={messageText}
                   onChange={(e) => setMessageText(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                   className="flex-1"
                 />
                 <Button 
                   onClick={handleSend} 
                   disabled={!messageText.trim() || sendMessage.isPending}
                   className="shrink-0"
                 >
                   <Send className="h-4 w-4" />
                 </Button>
               </div>
             </div>
           </>
         ) : (
           <div className="h-full flex items-center justify-center text-muted-foreground">
             <div className="text-center">
               <MessageSquareIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Wählen Sie einen Chat aus</p>
             </div>
           </div>
         )}
       </Card>
     </div>
   );
 }
 
 function MessageBubble({ message }: { message: WhatsAppMessage }) {
   const isOutbound = message.direction === 'outbound';
   
   return (
     <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
       <div className={cn(
         "max-w-[70%] rounded-lg px-3 py-2",
         isOutbound 
           ? "bg-primary text-primary-foreground" 
           : "bg-muted"
       )}>
         <p className="text-sm whitespace-pre-wrap">{message.content}</p>
         <div className={cn(
           "flex items-center justify-end gap-1 mt-1",
           isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
         )}>
           <span className="text-xs">
             {format(new Date(message.created_at), "HH:mm", { locale: de })}
           </span>
           {isOutbound && statusIcons[message.status]}
         </div>
       </div>
     </div>
   );
 }
 
 function MessageSquareIcon({ className }: { className?: string }) {
   return (
     <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
     </svg>
   );
 }