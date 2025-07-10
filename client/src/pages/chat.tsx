import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Send, MessageCircle, Users } from "lucide-react";
import { format } from "date-fns";
import type { Conversation, Message } from "@shared/schema";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/conversations", user?.id],
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/conversations/${selectedConversation!.id}/messages`);
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) return;
      
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        senderId: user!.id,
        content,
        type: "text",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", user?.id] 
      });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first conversation by default only on desktop
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && window.innerWidth >= 1024) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-2 lg:gap-4">
      {/* Conversations List */}
      <Card className={`${selectedConversation ? 'hidden lg:block' : 'block'} lg:w-80 flex flex-col`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {isLoadingConversations ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground text-sm">
                  Start a conversation from the Users page
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation: Conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversation?.id === conversation.id ? "bg-accent" : ""
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm">{getUserInitials(conversation.name || "Chat")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {conversation.name || "Direct Message"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conversation.updatedAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}>
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 mr-2"
                  onClick={() => setSelectedConversation(null)}
                >
                  ←
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">{getUserInitials(selectedConversation.name || "Chat")}</AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedConversation.name || "Direct Message"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3 lg:p-4">
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] lg:max-w-[70%] p-3 rounded-lg animate-pulse ${
                          i % 2 === 0 ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <div className="h-4 bg-muted rounded w-full mb-1"></div>
                          <div className="h-3 bg-muted rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-semibold mb-2">No messages yet</h3>
                      <p className="text-muted-foreground text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] lg:max-w-[70%] p-3 rounded-lg ${
                            message.senderId === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}>
                            {format(new Date(message.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 lg:p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendMessageMutation.isPending}
                    className="text-base"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="min-w-[44px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground text-sm">Choose a conversation to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}