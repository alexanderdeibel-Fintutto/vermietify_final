import { useState } from "react";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Building2,
  Clock,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "tenant" | "landlord";
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  subject: string;
  participant: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

// Placeholder conversations
const placeholderConversations: Conversation[] = [
  {
    id: "1",
    subject: "Heizung defekt",
    participant: "Hausverwaltung",
    lastMessage: "Der Techniker kommt am Montag zwischen 9-12 Uhr.",
    lastMessageTime: "2026-02-14T16:30:00Z",
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        sender: "tenant",
        content: "Guten Tag, die Heizung in meinem Wohnzimmer funktioniert seit gestern nicht mehr. Es wird gar nicht mehr warm.",
        timestamp: "2026-02-13T10:00:00Z",
        read: true,
      },
      {
        id: "m2",
        sender: "landlord",
        content: "Vielen Dank für Ihre Meldung. Wir haben einen Techniker beauftragt und melden uns zeitnah.",
        timestamp: "2026-02-13T14:20:00Z",
        read: true,
      },
      {
        id: "m3",
        sender: "landlord",
        content: "Der Techniker kommt am Montag zwischen 9-12 Uhr.",
        timestamp: "2026-02-14T16:30:00Z",
        read: false,
      },
    ],
  },
  {
    id: "2",
    subject: "Nebenkostenabrechnung 2025",
    participant: "Hausverwaltung",
    lastMessage: "Die Abrechnung wird im März versandt.",
    lastMessageTime: "2026-02-10T09:00:00Z",
    unreadCount: 0,
    messages: [
      {
        id: "m4",
        sender: "tenant",
        content: "Wann erhalte ich die Nebenkostenabrechnung für 2025?",
        timestamp: "2026-02-09T11:00:00Z",
        read: true,
      },
      {
        id: "m5",
        sender: "landlord",
        content: "Die Abrechnung wird im März versandt.",
        timestamp: "2026-02-10T09:00:00Z",
        read: true,
      },
    ],
  },
  {
    id: "3",
    subject: "Schlüsselverlust melden",
    participant: "Hausverwaltung",
    lastMessage: "Bitte kommen Sie mit Ihrem Ausweis ins Büro.",
    lastMessageTime: "2026-01-28T11:45:00Z",
    unreadCount: 0,
    messages: [
      {
        id: "m6",
        sender: "tenant",
        content: "Leider habe ich meinen Briefkastenschlüssel verloren. Wie kann ich einen neuen bekommen?",
        timestamp: "2026-01-28T08:30:00Z",
        read: true,
      },
      {
        id: "m7",
        sender: "landlord",
        content: "Bitte kommen Sie mit Ihrem Ausweis ins Büro. Die Kosten für einen Ersatzschlüssel betragen 25 Euro.",
        timestamp: "2026-01-28T11:45:00Z",
        read: true,
      },
    ],
  },
];

export default function TenantMessages() {
  const [conversations] = useState<Conversation[]>(placeholderConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    // In production this would call an API
    setNewMessage("");
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Nachrichten
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread} neu
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Kommunizieren Sie mit Ihrer Hausverwaltung.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[350px_1fr]">
          {/* Conversation List */}
          <Card className={cn(selectedConversation && "hidden md:block")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Konversationen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="Keine Nachrichten"
                    description="Sie haben noch keine Nachrichten."
                  />
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      className={cn(
                        "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {conv.unreadCount > 0 && (
                              <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
                            )}
                            <span className={cn("text-sm font-medium truncate", conv.unreadCount > 0 && "font-bold")}>
                              {conv.subject}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.participant}
                          </p>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(conv.lastMessageTime), "dd.MM.", { locale: de })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className={cn(!selectedConversation && "hidden md:block")}>
            {selectedConversation ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.participant}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          msg.sender === "tenant" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.sender === "landlord" && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg p-3",
                            msg.sender === "tenant"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            msg.sender === "tenant" ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {format(new Date(msg.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                            </span>
                          </div>
                        </div>
                        {msg.sender === "tenant" && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Input
                      placeholder="Nachricht schreiben..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Wählen Sie eine Konversation aus</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </TenantLayout>
  );
}
