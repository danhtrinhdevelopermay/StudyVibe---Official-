import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/layout/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Flashcards from "@/pages/flashcards";
import Quizzes from "@/pages/quizzes";
import Notes from "@/pages/notes";
import Assignments from "@/pages/assignments";
import Groups from "@/pages/groups";
import Profile from "@/pages/profile";
import UsersPage from "@/pages/users";
import ChatPage from "@/pages/chat";
import Posts from "@/pages/posts";
import Achievements from "@/pages/achievements";
import Settings from "@/pages/settings";
import AdminPage from "@/pages/admin";
import NotificationsPage from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import { AuthForm } from "@/components/auth/auth-form";

function AppContent() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!loading && user) {
      if (location === "/" || location === "/auth") {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthForm} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/flashcards" component={Flashcards} />
            <Route path="/quizzes" component={Quizzes} />
            <Route path="/notes" component={Notes} />
            <Route path="/assignments" component={Assignments} />
            <Route path="/groups" component={Groups} />
            <Route path="/users" component={UsersPage} />
            <Route path="/chat" component={ChatPage} />
            <Route path="/posts" component={Posts} />
            <Route path="/profile" component={Profile} />
            <Route path="/achievements" component={Achievements} />
            <Route path="/settings" component={Settings} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
