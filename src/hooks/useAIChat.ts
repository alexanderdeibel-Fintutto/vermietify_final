 import { useState, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 type Message = {
   role: "user" | "assistant";
   content: string;
 };
 
 interface UseAIChatOptions {
   context?: string;
   userData?: Record<string, any>;
 }
 
 export function useAIChat(options: UseAIChatOptions = {}) {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const { toast } = useToast();
 
   const sendMessage = useCallback(async (userMessage: string) => {
     const userMsg: Message = { role: "user", content: userMessage };
     setMessages((prev) => [...prev, userMsg]);
     setIsLoading(true);
 
     let assistantContent = "";
 
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
           body: JSON.stringify({
             messages: [...messages, userMsg],
             context: options.context,
             userData: options.userData,
           }),
         }
       );
 
       if (!response.ok) {
         const error = await response.json();
         throw new Error(error.error || "Fehler bei der KI-Anfrage");
       }
 
       if (!response.body) throw new Error("Keine Antwort erhalten");
 
       const reader = response.body.getReader();
       const decoder = new TextDecoder();
       let buffer = "";
 
       // Add empty assistant message that we'll update
       setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
 
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
 
         buffer += decoder.decode(value, { stream: true });
         
         let newlineIndex: number;
         while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
           let line = buffer.slice(0, newlineIndex);
           buffer = buffer.slice(newlineIndex + 1);
 
           if (line.endsWith("\r")) line = line.slice(0, -1);
           if (line.startsWith(":") || line.trim() === "") continue;
           if (!line.startsWith("data: ")) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === "[DONE]") break;
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content;
             if (content) {
               assistantContent += content;
               setMessages((prev) => {
                 const newMsgs = [...prev];
                 newMsgs[newMsgs.length - 1] = {
                   role: "assistant",
                   content: assistantContent,
                 };
                 return newMsgs;
               });
             }
           } catch {
             // Partial JSON, put back and wait
             buffer = line + "\n" + buffer;
             break;
           }
         }
       }
     } catch (error: any) {
       toast({
         title: "KI-Fehler",
         description: error.message,
         variant: "destructive",
       });
       // Remove failed assistant message
       setMessages((prev) => prev.slice(0, -1));
     } finally {
       setIsLoading(false);
     }
   }, [messages, options.context, options.userData, toast]);
 
   const clearMessages = useCallback(() => {
     setMessages([]);
   }, []);
 
   return {
     messages,
     isLoading,
     sendMessage,
     clearMessages,
   };
 }