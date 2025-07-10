import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Calendar, Target, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Achievement {
  id: number;
  title: string;
  description: string;
  type: string;
  requirement: number;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
}

export default function Achievements() {
  const { user } = useAuth();

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user,
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case "study_streak": return Calendar;
      case "flashcard_master": return BookOpen;
      case "quiz_champion": return Target;
      case "social": return Users;
      default: return Star;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Achievements</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const completedAchievements = achievements.filter((a: Achievement) => a.completed);
  const inProgressAchievements = achievements.filter((a: Achievement) => !a.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">
            {completedAchievements.length} of {achievements.length} unlocked
          </p>
        </div>
      </div>

      {completedAchievements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Completed Achievements
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedAchievements.map((achievement: Achievement) => {
              const Icon = getIconForType(achievement.type);
              return (
                <Card key={achievement.id} className="border-yellow-500/20 bg-yellow-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-yellow-500" />
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                        Completed
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {inProgressAchievements.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            In Progress
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressAchievements.map((achievement: Achievement) => {
              const Icon = getIconForType(achievement.type);
              const progress = Math.min((achievement.progress / achievement.requirement) * 100, 100);
              
              return (
                <Card key={achievement.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <Badge variant="outline">
                        {achievement.progress}/{achievement.requirement}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {achievement.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
            <p className="text-muted-foreground">
              Start studying to unlock your first achievement!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}