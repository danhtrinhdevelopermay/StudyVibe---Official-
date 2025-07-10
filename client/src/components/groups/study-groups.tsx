import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, Crown, UserPlus, Copy, Search } from "lucide-react";
import type { StudyGroup, InsertStudyGroup } from "@shared/schema";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  maxMembers: z.number().min(2).max(50).default(20),
  isPrivate: z.boolean().default(false),
});

type GroupFormData = z.infer<typeof groupSchema>;

export function StudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      maxMembers: 20,
      isPrivate: false,
    },
  });

  // Fetch user's study groups
  const { data: userGroups = [], isLoading: userGroupsLoading } = useQuery({
    queryKey: ["/api/study-groups", user?.id],
    enabled: !!user?.id,
  });

  // Fetch public study groups
  const { data: publicGroups = [], isLoading: publicGroupsLoading } = useQuery({
    queryKey: ["/api/study-groups/public/all"],
  });

  // Fetch group members for selected group
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["/api/study-groups", selectedGroup?.id, "members"],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const response = await fetch(`/api/study-groups/${selectedGroup.id}/members`);
      return response.json();
    },
    enabled: !!selectedGroup,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const groupData: InsertStudyGroup = {
        ...data,
        creatorId: user!.id,
      };
      const response = await apiRequest("POST", "/api/study-groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      toast({
        title: "Study group created! 🎉",
        description: "Your study group is ready for members.",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create study group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest("POST", `/api/study-groups/${groupId}/join`, {
        userId: user!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-groups"] });
      toast({
        title: "Joined group! 🎊",
        description: "Welcome to your new study squad!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleViewMembers = (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowMembersDialog(true);
  };

  const copyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Invite code copied! 📋",
        description: "Share this code with friends to invite them.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invite code.",
        variant: "destructive",
      });
    }
  };

  const filteredPublicGroups = publicGroups.filter((group: StudyGroup) =>
    searchQuery === "" || 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserInGroup = (group: StudyGroup) => {
    return userGroups.some((userGroup: StudyGroup) => userGroup.id === group.id);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Groups 👥</h1>
          <p className="text-muted-foreground">Connect with fellow students and study together</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Math Warriors, Bio Squad"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's your group about?"
                  {...form.register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics, Biology"
                    {...form.register("subject")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="50"
                    {...form.register("maxMembers", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={form.watch("isPrivate")}
                  onCheckedChange={(checked) => form.setValue("isPrivate", !!checked)}
                />
                <Label htmlFor="isPrivate">Make this group private (invite-only)</Label>
              </div>

              <Button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="w-full"
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-groups">My Groups ({userGroups.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-6">
          {userGroupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No study groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create or join your first study group to start collaborating!
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                  <Button variant="outline" onClick={() => document.querySelector('[value="discover"]')?.click()}>
                    <Search className="mr-2 h-4 w-4" />
                    Discover Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userGroups.map((group: StudyGroup) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {group.name}
                          {group.creatorId === user.id && (
                            <Crown className="w-4 h-4 text-accent" />
                          )}
                        </CardTitle>
                        {group.subject && (
                          <Badge variant="secondary" className="mt-2">
                            {group.subject}
                          </Badge>
                        )}
                      </div>
                      {group.isPrivate && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span>? / {group.maxMembers}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMembers(group)}
                          className="flex-1"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          View Members
                        </Button>
                        
                        {group.inviteCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteCode(group.inviteCode!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {publicGroupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPublicGroups.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No groups found" : "No public groups available"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Be the first to create a public study group!"
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Public Group
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublicGroups.map((group: StudyGroup) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    {group.subject && (
                      <Badge variant="secondary" className="w-fit">
                        {group.subject}
                      </Badge>
                    )}
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span>? / {group.maxMembers}</span>
                      </div>
                      
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={isUserInGroup(group) || joinGroupMutation.isPending}
                        className="w-full"
                        variant={isUserInGroup(group) ? "outline" : "default"}
                      >
                        {isUserInGroup(group) ? (
                          "Already Joined"
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Join Group
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedGroup?.name} Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {groupMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No members found
              </p>
            ) : (
              groupMembers.map((member: any) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                  <Avatar>
                    <AvatarImage src={member.user?.photoURL} />
                    <AvatarFallback>
                      {member.user?.displayName?.charAt(0) || member.user?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.user?.displayName || member.user?.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {member.role === "admin" && (
                    <Crown className="w-4 h-4 text-accent" />
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
