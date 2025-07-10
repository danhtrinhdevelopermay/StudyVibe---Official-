import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Search, MessageCircle, Users, Star } from "lucide-react";
import type { User } from "@shared/schema";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users for discovery
  const { data: discoveredUsers = [], isLoading: isLoadingDiscovered } = useQuery({
    queryKey: ["/api/users/discover", user?.id],
    enabled: !!user?.id,
  });

  // Search users query
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/users/search", searchQuery, user?.id],
    enabled: !!searchQuery && !!user?.id && searchQuery.length > 2,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}&userId=${user!.id}`);
      return response.json();
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      const response = await apiRequest("POST", "/api/conversations", {
        participants: [user!.id, otherUserId],
        type: "direct",
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Chat Started! 💬",
        description: "You can now chat with this user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartChat = (otherUser: User) => {
    startConversationMutation.mutate(otherUser.id);
  };

  const getUserInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const displayUsers = searchQuery.length > 2 ? searchResults : discoveredUsers;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-3 rounded-xl">
          <Users className="text-primary-foreground w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Discover Users</h1>
          <p className="text-muted-foreground">Find and connect with other StudyVibe users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      {isLoadingDiscovered || isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {displayUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No users found" : "No users to discover"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Be the first to invite friends to StudyVibe!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayUsers.map((discoveredUser: User) => (
                <Card key={discoveredUser.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={discoveredUser.photoURL || undefined} />
                        <AvatarFallback>{getUserInitials(discoveredUser)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">
                            {discoveredUser.displayName || discoveredUser.username}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Level {discoveredUser.level}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          @{discoveredUser.username}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {discoveredUser.xp} XP
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartChat(discoveredUser)}
                      disabled={startConversationMutation.isPending}
                      className="w-full mt-4"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}