import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Clock, AlertTriangle, Plus, Calendar } from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";

export function DeadlineTracker() {
  const { user } = useAuth();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/assignments", user?.id, "upcoming", 7],
    queryFn: async () => {
      const response = await fetch(`/api/assignments/${user?.id}/upcoming/7`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const getDeadlineStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    
    if (isToday(due)) {
      return { label: "Today", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    } else if (isTomorrow(due)) {
      return { label: "Tomorrow", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    } else if (due <= addDays(now, 3)) {
      return { label: "This week", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    } else {
      return { label: "Next week", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Upcoming Deadlines ⏰
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Upcoming Deadlines ⏰
          </CardTitle>
          <Link href="/assignments">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No upcoming deadlines
            </p>
            <Link href="/assignments">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 4).map((assignment: any) => {
              const status = getDeadlineStatus(assignment.dueDate);
              
              return (
                <div
                  key={assignment.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${status.color}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{assignment.title}</p>
                      <Badge variant="outline" className={getPriorityColor(assignment.priority)}>
                        {assignment.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(assignment.dueDate), "MMM d, yyyy")} • {assignment.subject}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {assignment.priority === "high" && (
                      <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                    )}
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
