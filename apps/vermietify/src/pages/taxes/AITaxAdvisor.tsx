 import { useState, useRef, useEffect } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader } from "@/components/shared/PageHeader";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { useAIChat } from "@/hooks/useAIChat";
 import { useAuth } from "@/hooks/useAuth";
 import { useBuildings } from "@/hooks/useBuildings";
 import { useTaxData } from "@/hooks/useTaxData";
 import {
   Bot,
   User,
   Send,
   Loader2,
   Info,
   Trash2,
   Sparkles,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import ReactMarkdown from "react-markdown";
 
 const currentYear = new Date().getFullYear();
 
 const exampleQuestions = [
   "Wie hoch waren meine Einnahmen dieses Jahr?",
   "Was kann ich von der Steuer absetzen?",
   "Wie berechne ich die AfA für meine Immobilie?",
   "Welche Werbungskosten kann ich geltend machen?",
 ];
 
 export default function AITaxAdvisor() {
   const { profile } = useAuth();
   const { useBuildingsList } = useBuildings();
   const { data: buildingsData } = useBuildingsList(1, 100);
   const buildings = buildingsData?.buildings || [];
   const { useRentalIncome, useExpenses } = useTaxData(currentYear);
   const { data: rentalIncome = 0 } = useRentalIncome();
   const { data: expenses = 0 } = useExpenses();
 
   const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
     context: "tax-advisor",
     userData: {
       buildings,
       totalIncome: rentalIncome,
       totalExpenses: expenses,
       currentPage: "KI-Steuerberater",
     },
   });
 
   const [input, setInput] = useState("");
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
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
 
   const handleExampleClick = (question: string) => {
     sendMessage(question);
   };
 
   return (
     <MainLayout title="KI-Steuerberater">
       <div className="h-[calc(100vh-8rem)] flex flex-col">
         <PageHeader
           title="KI-Steuerberater"
           subtitle="Fragen Sie unsere KI zu Steuerthemen rund um Ihre Immobilien"
           breadcrumbs={[
             { label: "Steuern", href: "/taxes" },
             { label: "KI-Berater" },
           ]}
           actions={
             messages.length > 0 && (
               <Button variant="outline" size="sm" onClick={clearMessages}>
                 <Trash2 className="h-4 w-4 mr-2" />
                 Chat leeren
               </Button>
             )
           }
         />
 
         {/* Disclaimer */}
         <Alert className="mt-4 mb-4">
           <Info className="h-4 w-4" />
           <AlertDescription>
             <strong>Hinweis:</strong> Dies ist keine Steuerberatung. Die Antworten dienen nur 
             der allgemeinen Information. Konsultieren Sie für verbindliche Auskünfte immer 
             einen qualifizierten Steuerberater.
           </AlertDescription>
         </Alert>
 
         {/* Chat Area */}
         <Card className="flex-1 flex flex-col overflow-hidden">
           <ScrollArea className="flex-1 p-4" ref={scrollRef}>
             {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center">
                 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                   <Bot className="h-8 w-8 text-primary" />
                 </div>
                 <h3 className="text-lg font-semibold mb-2">
                   Willkommen beim KI-Steuerberater
                 </h3>
                 <p className="text-muted-foreground mb-6 max-w-md">
                   Ich kann Ihnen bei Fragen zu Steuern, AfA, Werbungskosten und mehr helfen. 
                   Stellen Sie mir einfach eine Frage!
                 </p>
                 <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                   {exampleQuestions.map((q, i) => (
                     <Button
                       key={i}
                       variant="outline"
                       size="sm"
                       onClick={() => handleExampleClick(q)}
                       className="text-left"
                     >
                       <Sparkles className="h-3 w-3 mr-2 text-primary" />
                       {q}
                     </Button>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 {messages.map((msg, i) => (
                   <div
                     key={i}
                     className={cn(
                       "flex gap-3",
                       msg.role === "user" ? "justify-end" : "justify-start"
                     )}
                   >
                     {msg.role === "assistant" && (
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <Bot className="h-4 w-4 text-primary" />
                       </div>
                     )}
                     <div
                       className={cn(
                         "rounded-lg px-4 py-3 max-w-[80%]",
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
                       <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                         <User className="h-4 w-4 text-primary-foreground" />
                       </div>
                     )}
                   </div>
                 ))}
                 {isLoading && messages[messages.length - 1]?.role === "user" && (
                   <div className="flex gap-3">
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                       <Bot className="h-4 w-4 text-primary" />
                     </div>
                     <div className="bg-muted rounded-lg px-4 py-3">
                       <Loader2 className="h-4 w-4 animate-spin" />
                     </div>
                   </div>
                 )}
               </div>
             )}
           </ScrollArea>
 
           {/* Input Area */}
           <CardContent className="border-t p-4">
             <form onSubmit={handleSubmit} className="flex gap-2">
               <Input
                 ref={inputRef}
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Stellen Sie Ihre Frage..."
                 disabled={isLoading}
                 className="flex-1"
               />
               <Button type="submit" disabled={isLoading || !input.trim()}>
                 {isLoading ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   <Send className="h-4 w-4" />
                 )}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </MainLayout>
   );
 }