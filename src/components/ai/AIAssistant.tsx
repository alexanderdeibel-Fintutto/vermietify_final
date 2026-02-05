 import { useState, useRef, useEffect } from "react";
 import { useLocation } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   Drawer,
   DrawerContent,
   DrawerHeader,
   DrawerTitle,
   DrawerFooter,
 } from "@/components/ui/drawer";
 import { useAIChat } from "@/hooks/useAIChat";
 import { useAuth } from "@/hooks/useAuth";
 import {
   Bot,
   User,
   Send,
   Loader2,
   X,
   MessageCircle,
   Sparkles,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import ReactMarkdown from "react-markdown";
 
 const pageContextMap: Record<string, string> = {
   "/dashboard": "Dashboard",
   "/properties": "Immobilien",
   "/tenants": "Mieter",
   "/vertraege": "Verträge",
   "/zahlungen": "Zahlungen",
   "/finances": "Finanzen",
   "/taxes": "Steuern",
   "/betriebskosten": "Betriebskosten",
   "/zaehler": "Zähler",
   "/aufgaben": "Aufgaben",
   "/documents": "Dokumente",
 };
 
 const quickQuestions = [
   "Wie hoch waren meine Einnahmen 2024?",
   "Welche Mieter haben offene Zahlungen?",
   "Was kann ich von der Steuer absetzen?",
 ];
 
 export function AIAssistant() {
   const [isOpen, setIsOpen] = useState(false);
   const location = useLocation();
   const { user } = useAuth();
   const scrollRef = useRef<HTMLDivElement>(null);
 
   const currentPage = pageContextMap[location.pathname] || location.pathname;
 
   const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
     context: "general-assistant",
     userData: {
       currentPage,
     },
   });
 
   const [input, setInput] = useState("");
 
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!input.trim() || isLoading) return;
     sendMessage(input.trim());
     setInput("");
   };
 
   const handleQuickQuestion = (q: string) => {
     sendMessage(q);
   };
 
   // Don't show for non-authenticated users
   if (!user) return null;
 
   return (
     <>
       {/* Floating Button */}
       <Button
         size="lg"
         className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
         onClick={() => setIsOpen(true)}
       >
         <MessageCircle className="h-6 w-6" />
       </Button>
 
       {/* Chat Drawer */}
       <Drawer open={isOpen} onOpenChange={setIsOpen}>
         <DrawerContent className="h-[85vh] max-h-[700px]">
           <DrawerHeader className="border-b">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <Bot className="h-4 w-4 text-primary" />
                 </div>
                 <DrawerTitle>KI-Assistent</DrawerTitle>
               </div>
               <div className="flex items-center gap-2">
                 {messages.length > 0 && (
                   <Button variant="ghost" size="sm" onClick={clearMessages}>
                     Chat leeren
                   </Button>
                 )}
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             </div>
           </DrawerHeader>
 
           {/* Chat Messages */}
           <ScrollArea className="flex-1 p-4" ref={scrollRef}>
             {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-8">
                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                   <Sparkles className="h-6 w-6 text-primary" />
                 </div>
                 <h3 className="font-semibold mb-1">Wie kann ich helfen?</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Seite: {currentPage}
                 </p>
                 <div className="space-y-2 w-full max-w-xs">
                   {quickQuestions.map((q, i) => (
                     <Button
                       key={i}
                       variant="outline"
                       size="sm"
                       className="w-full text-left justify-start text-xs"
                       onClick={() => handleQuickQuestion(q)}
                     >
                       {q}
                     </Button>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                 {messages.map((msg, i) => (
                   <div
                     key={i}
                     className={cn(
                       "flex gap-2",
                       msg.role === "user" ? "justify-end" : "justify-start"
                     )}
                   >
                     {msg.role === "assistant" && (
                       <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <Bot className="h-3 w-3 text-primary" />
                       </div>
                     )}
                     <div
                       className={cn(
                         "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                         msg.role === "user"
                           ? "bg-primary text-primary-foreground"
                           : "bg-muted"
                       )}
                     >
                       {msg.role === "assistant" ? (
                         <div className="prose prose-sm dark:prose-invert max-w-none">
                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                       ) : (
                         <p>{msg.content}</p>
                       )}
                     </div>
                     {msg.role === "user" && (
                       <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                         <User className="h-3 w-3 text-primary-foreground" />
                       </div>
                     )}
                   </div>
                 ))}
                 {isLoading && messages[messages.length - 1]?.role === "user" && (
                   <div className="flex gap-2">
                     <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                       <Bot className="h-3 w-3 text-primary" />
                     </div>
                     <div className="bg-muted rounded-lg px-3 py-2">
                       <Loader2 className="h-4 w-4 animate-spin" />
                     </div>
                   </div>
                 )}
               </div>
             )}
           </ScrollArea>
 
           {/* Input */}
           <DrawerFooter className="border-t">
             <form onSubmit={handleSubmit} className="flex gap-2">
               <Input
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Frage stellen..."
                 disabled={isLoading}
                 className="flex-1"
               />
               <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                 {isLoading ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   <Send className="h-4 w-4" />
                 )}
               </Button>
             </form>
           </DrawerFooter>
         </DrawerContent>
       </Drawer>
     </>
   );
 }