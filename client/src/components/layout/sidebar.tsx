import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CreditCard,
  Brain,
  FileText,
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  MessageCircle,
  Search,
  Share2,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, current: false },
  { name: "Flashcards", href: "/flashcards", icon: CreditCard, current: false },
  { name: "Quizzes", href: "/quizzes", icon: Brain, current: false },
  { name: "Notes", href: "/notes", icon: FileText, current: false },
  { name: "Assignments", href: "/assignments", icon: Calendar, current: false },
  { name: "Study Groups", href: "/groups", icon: Users, current: false },
  { name: "Posts", href: "/posts", icon: Share2, current: false },
  { name: "Discover Users", href: "/users", icon: Search, current: false },
  { name: "Messages", href: "/chat", icon: MessageCircle, current: false },
];

const quickActions = [
  { name: "Create Flashcards", href: "/flashcards/new", icon: CreditCard, color: "bg-primary/20 text-primary" },
  { name: "New Quiz", href: "/quizzes/new", icon: Brain, color: "bg-secondary/20 text-secondary" },
  { name: "Write Notes", href: "/notes/new", icon: FileText, color: "bg-accent/20 text-accent" },
  { name: "Add Assignment", href: "/assignments/new", icon: Calendar, color: "bg-purple-500/20 text-purple-400" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col pt-16">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4">
        <div className="flex flex-1 flex-col pt-6">
          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-20 flex-col gap-2 hover:scale-105 transition-all duration-200",
                      action.color
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-xs text-center leading-tight">{action.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-11",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                        {item.name === "Assignments" && (
                          <Badge variant="destructive" className="ml-auto h-5 px-2">
                            3
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Stats Section */}
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Your Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span className="text-sm">Achievements</span>
                  </div>
                  <Badge variant="outline">12</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <span className="text-sm">Study Time</span>
                  </div>
                  <span className="text-sm text-muted-foreground">24h this week</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
