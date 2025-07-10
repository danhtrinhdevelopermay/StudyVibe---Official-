import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { GraduationCap, User, Settings, LogOut, Menu, X, CreditCard, Brain, FileText, Calendar, Users, MessageCircle, Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTranslation } from "react-i18next";

export function Navigation() {
  const { user, firebaseUser } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navigationItems = [
    { name: "Flashcards", href: "/flashcards", icon: CreditCard },
    { name: "Quizzes", href: "/quizzes", icon: Brain },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "Assignments", href: "/assignments", icon: Calendar },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Users", href: "/users", icon: Search },
    { name: "Chat", href: "/chat", icon: MessageCircle },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user || !firebaseUser) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="bg-primary p-2 rounded-xl">
              <GraduationCap className="text-primary-foreground w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">StudyVibe</span>
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              beta
            </Badge>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/flashcards"
              className={`hover:text-primary transition-colors ${location === '/flashcards' ? 'text-primary' : ''}`}
            >
              {t('navigation.flashcards')}
            </Link>
            <Link 
              href="/quizzes"
              className={`hover:text-primary transition-colors ${location === '/quizzes' ? 'text-primary' : ''}`}
            >
              {t('navigation.quizzes')}
            </Link>
            <Link 
              href="/notes"
              className={`hover:text-primary transition-colors ${location === '/notes' ? 'text-primary' : ''}`}
            >
              {t('navigation.notes')}
            </Link>
            <Link 
              href="/assignments"
              className={`hover:text-primary transition-colors ${location === '/assignments' ? 'text-primary' : ''}`}
            >
              {t('navigation.assignments')}
            </Link>
            <Link 
              href="/groups"
              className={`hover:text-primary transition-colors ${location === '/groups' ? 'text-primary' : ''}`}
            >
              {t('navigation.groups')}
            </Link>
            <Link 
              href="/users"
              className={`hover:text-primary transition-colors ${location === '/users' ? 'text-primary' : ''}`}
            >
              {t('navigation.users')}
            </Link>
            <Link 
              href="/chat"
              className={`hover:text-primary transition-colors ${location === '/chat' ? 'text-primary' : ''}`}
            >
              {t('navigation.chat')}
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30">
                🔥 {user.streak} day streak
              </Badge>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                Level {user.level}
              </Badge>
            </div>
            
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.username} />
                    <AvatarFallback>
                      {(user.displayName || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.displayName || user.username}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


      </div>
    </nav>
  );
}
