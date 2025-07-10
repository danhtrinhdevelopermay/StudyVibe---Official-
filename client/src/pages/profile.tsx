import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { logout } from "@/lib/auth";
import { 
  User, 
  Edit3, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Brain,
  CreditCard,
  FileText,
  Users,
  Target,
  Star,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Camera,
  Upload
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      displayName: user?.displayName || "",
    },
  });

  // Fetch user's achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user?.id,
  });

  // Fetch user's stats
  const { data: flashcardDecks = [] } = useQuery({
    queryKey: ["/api/flashcard-decks", user?.id],
    enabled: !!user?.id,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["/api/quiz-attempts", user?.id],
    enabled: !!user?.id,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes", user?.id],
    enabled: !!user?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/assignments", user?.id],
    enabled: !!user?.id,
  });

  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (photoURL: string) => {
      const response = await apiRequest("POST", `/api/users/${user!.id}/avatar`, {
        photoURL,
      });
      return response.json();
    },
    onSuccess: () => {
      refreshUser();
      toast({
        title: "Avatar updated! 🎉",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const photoURL = e.target?.result as string;
      avatarUploadMutation.mutate(photoURL);
    };
    reader.readAsDataURL(file);
  };

  const { data: studyGroups = [] } = useQuery({
    queryKey: ["/api/study-groups", user?.id],
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", `/api/users/${user!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      refreshUser();
      toast({
        title: "Profile updated! ✨",
        description: "Your changes have been saved successfully.",
      });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "See you later! 👋",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  // Calculate stats
  const completedAssignments = assignments.filter((a: any) => a.status === "completed").length;
  const avgQuizScore = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((acc: number, attempt: any) => acc + (attempt.score / attempt.totalQuestions * 100), 0) / quizAttempts.length)
    : 0;

  const levelProgress = ((user.xp % 100) / 100) * 100; // Simple level progression
  const nextLevelXp = (user.level * 100) - user.xp;

  const stats = [
    {
      title: "Flashcard Decks",
      value: flashcardDecks.length,
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Quiz Average",
      value: `${avgQuizScore}%`,
      icon: Brain,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Notes Created",
      value: notes.length,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Assignments Done",
      value: completedAssignments,
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Study Groups",
      value: studyGroups.length,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Achievements",
      value: achievements.length,
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
  ];

  const recentAchievements = achievements.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.username} />
                <AvatarFallback className="text-2xl">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-8 h-8 p-0 cursor-pointer flex items-center justify-center transition-colors"
              >
                <Camera className="w-4 h-4" />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{user.displayName || user.username}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Level {user.level}
                    </Badge>
                    <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                      🔥 {user.streak} day streak
                    </Badge>
                    <Badge className="bg-accent/20 text-accent border-accent/30">
                      {user.xp} XP
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={form.handleSubmit(handleUpdateProfile)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            placeholder="Enter username"
                            {...form.register("username")}
                          />
                          {form.formState.errors.username && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.username.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            placeholder="Enter display name"
                            {...form.register("displayName")}
                          />
                          {form.formState.errors.displayName && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.displayName.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="w-full"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress to Level {user.level + 1}</span>
                  <span>{user.xp % 100}/100 XP</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {nextLevelXp > 0 ? `${nextLevelXp} XP until next level` : "Ready to level up!"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAchievements.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground">
                    Keep studying to unlock your first achievement! 🏆
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAchievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-3 p-4 bg-background/50 rounded-xl border"
                    >
                      <div className="text-2xl">
                        {achievement.icon || "🏆"}
                      </div>
                      <div>
                        <p className="font-semibold">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Study Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">This Week</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Flashcards Reviewed</span>
                      <span className="font-semibold">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quizzes Completed</span>
                      <span className="font-semibold">{quizAttempts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Study Sessions</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hours Studied</span>
                      <span className="font-semibold">8.5h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">All Time</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total XP Earned</span>
                      <span className="font-semibold">{user.xp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Days Active</span>
                      <span className="font-semibold">45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Assignments Completed</span>
                      <span className="font-semibold">{completedAssignments}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Study Streak Record</span>
                      <span className="font-semibold">15 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Achievements ({achievements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No achievements unlocked yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start studying to earn your first achievement badge!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <p className="text-sm font-medium">First Quiz</p>
                      <p className="text-xs text-muted-foreground">Complete your first quiz</p>
                    </div>
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <div className="text-2xl mb-2">📚</div>
                      <p className="text-sm font-medium">Study Streak</p>
                      <p className="text-xs text-muted-foreground">Study for 7 days in a row</p>
                    </div>
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <div className="text-2xl mb-2">⭐</div>
                      <p className="text-sm font-medium">Level Up</p>
                      <p className="text-xs text-muted-foreground">Reach level 5</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement: any) => (
                    <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">
                          {achievement.icon || "🏆"}
                        </div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Quiz Average Score</span>
                  <span className="font-semibold text-secondary">{avgQuizScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Flashcard Decks Created</span>
                  <span className="font-semibold">{flashcardDecks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Notes Written</span>
                  <span className="font-semibold">{notes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Assignments Completed</span>
                  <span className="font-semibold">{completedAssignments}/{assignments.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Study Groups Joined</span>
                  <span className="font-semibold">{studyGroups.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Study Streak</span>
                  <span className="font-semibold text-secondary">🔥 {user.streak} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total XP Earned</span>
                  <span className="font-semibold text-accent">{user.xp} XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Level</span>
                  <span className="font-semibold text-primary">Level {user.level}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Level Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {user.xp % 100}/100 XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-3" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Quiz Completion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {quizAttempts.length > 0 ? Math.round((quizAttempts.filter((a: any) => a.score > 0).length / quizAttempts.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={quizAttempts.length > 0 ? (quizAttempts.filter((a: any) => a.score > 0).length / quizAttempts.length) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Assignment Completion</span>
                    <span className="text-sm text-muted-foreground">
                      {assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={assignments.length > 0 ? (completedAssignments / assignments.length) * 100 : 0} 
                    className="h-3" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Profile Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Username</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                      Edit
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Verified
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Privacy & Notifications</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Study Reminders</p>
                      <p className="text-sm text-muted-foreground">Get notified about study sessions</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Assignment Deadlines</p>
                      <p className="text-sm text-muted-foreground">Deadline reminder notifications</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-destructive">Danger Zone</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
