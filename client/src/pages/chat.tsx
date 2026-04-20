import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLocation, useRoute } from "wouter";
import { messagesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [match, params] = useRoute("/chat/:userId");
  const userId = params?.userId;
  const [, setLocation] = useLocation();
  const { user, sessionId } = useAppContext();
  const { toast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(
    userId || null
  );

  useEffect(() => {
    if (!user || !sessionId) {
      setLocation("/auth");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        if (activeConversation) {
          const msgs = await messagesAPI.getConversation(sessionId, activeConversation);
          setMessages(msgs);
        } else {
          const convs = await messagesAPI.getConversations(sessionId);
          setConversations(convs);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeConversation, sessionId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    try {
      setSending(true);
      await messagesAPI.send(sessionId!, activeConversation, messageInput);
      setMessageInput("");

      // Reload conversation
      const msgs = await messagesAPI.getConversation(sessionId!, activeConversation);
      setMessages(msgs);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!user || !sessionId) {
    return <div className="p-20 text-center">Acesso negado. Faça login.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // List view - show conversations
  if (!activeConversation) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold font-serif mb-8">Mensagens</h1>

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Nenhuma conversa ainda. Comece uma conversa quando enviar uma mensagem!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv: any) => (
                <Card
                  key={conv.other_user_id}
                  className="cursor-pointer hover:bg-accent/10 transition"
                  onClick={() => setActiveConversation(conv.other_user_id)}
                  data-testid={`card-conversation-${conv.other_user_id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conv.other_user_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{conv.other_user_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat view - show messages
  const otherUser = conversations.find((c) => c.other_user_id === activeConversation);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-2xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveConversation(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold">
              {otherUser?.other_user_name || "Conversa"}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma mensagem ainda. Comece a conversa!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user.id ? "justify-end" : "justify-start"
                }`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderId === user.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/95 backdrop-blur sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Escreva uma mensagem..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending}
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={sending || !messageInput.trim()}
              size="sm"
              data-testid="button-send"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
