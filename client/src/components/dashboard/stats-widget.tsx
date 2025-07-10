import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  TrendingUp, 
  Brain, 
  CreditCard, 
  FileText, 
  Calendar,
  Trophy
} from "lucide-react";

export function StatsWidget() {
  const { user } = useAuth();

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

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user?.id,
  });

  const completedAssignments = assignments.filter((a: any) => a.status === "completed").length;
  const avgQuizScore = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((acc: number, attempt: any) => acc + (attempt.score / attempt.totalQuestions * 100), 0) / quizAttempts.length)
    : 0;

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
      title: "Total XP",
      value: user?.xp || 0,
      icon: TrendingUp,
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
