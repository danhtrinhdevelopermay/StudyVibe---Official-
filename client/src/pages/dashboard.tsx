import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { StatsWidget } from "@/components/dashboard/stats-widget";
import { DeadlineTracker } from "@/components/dashboard/deadline-tracker";
import { Link } from "wouter";
import { 
  Plus, 
  CreditCard, 
  Brain, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Target
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch user's recent activity data
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/quiz-attempts", user?.id],
    enabled: !!user?.id,
  });

  const { data: studyGroups = [] } = useQuery({
    queryKey: ["/api/study-groups", user?.id],
    enabled: !!user?.id,
  });

  if (!user) return null;

  const quickActions = [
    {
      title: "Create Flashcards",
      icon: CreditCard,
      href: "/flashcards",
      color: "bg-primary/20 hover:bg-primary/30 text-primary",
    },
    {
      title: "Join Study Group",
      icon: Users,
      href: "/groups",
      color: "bg-secondary/20 hover:bg-secondary/30 text-secondary",
    },
    {
      title: "New Notes",
      icon: FileText,
      href: "/notes",
      color: "bg-accent/20 hover:bg-accent/30 text-accent",
    },
    {
      title: "Take Quiz",
      icon: Brain,
      href: "/quizzes",
      color: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {user.displayName || user.username}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">Ready to crush today's goals?</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 px-4 py-2">
            🔥 {user.streak} day streak
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
            Level {user.level}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsWidget />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Button
                      variant="ghost"
                      className={`h-20 flex-col gap-2 hover-scale transition-all duration-200 ${action.color} w-full`}
                    >
                      <action.icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{action.title}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start studying to see your progress here!
                  </p>
                  <Link href="/flashcards">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 bg-background/50 rounded-xl"
                    >
                      <div className="bg-secondary/20 p-2 rounded-lg">
                        <Brain className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Completed Quiz</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {activity.score}/{activity.totalQuestions}
                        </p>
                      </div>
                      <span className="text-secondary text-sm">
                        +{Math.round((activity.score / activity.totalQuestions) * 50)} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <DeadlineTracker />

          {/* Study Streak */}
          <Card>
            <CardHeader>
              <CardTitle>Study Streak 🔥</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">{user.streak}</div>
              <p className="text-muted-foreground mb-4">days in a row!</p>
              <div className="flex justify-center space-x-2 mb-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-8 h-2 rounded-full ${
                      index < Math.min(user.streak, 5) ? "bg-secondary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {10 - user.streak > 0 
                  ? `${10 - user.streak} more days for "10-Day Scholar" badge!`
                  : "You're on fire! Keep it up! 🔥"
                }
              </p>
            </CardContent>
          </Card>

          {/* Active Study Groups */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Study Groups</CardTitle>
                <Link href="/groups">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {studyGroups.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No study groups yet
                  </p>
                  <Link href="/groups">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Join a Group
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {studyGroups.slice(0, 3).map((group: any) => (
                    <div
                      key={group.id}
                      className="flex items-center space-x-3 p-3 bg-background/50 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {group.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.subject || "General"}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress This Week */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Study Sessions</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flashcards Reviewed</span>
                  <span className="font-semibold">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quizzes Completed</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Notes Created</span>
                  <span className="font-semibold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
