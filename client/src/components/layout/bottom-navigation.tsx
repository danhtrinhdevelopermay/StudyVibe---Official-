import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Share2,
  Users,
  MessageCircle,
  Menu,
  CreditCard,
  Brain,
  FileText,
  Calendar,
  Search,
  User,
  Trophy,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const mainNavItems = [
    { name: t('navigation.posts'), href: "/posts", icon: Share2 },
    { name: t('navigation.groups'), href: "/groups", icon: Users },
    { name: t('navigation.dashboard'), href: "/dashboard", icon: LayoutDashboard, isMain: true },
    { name: t('navigation.chat'), href: "/chat", icon: MessageCircle },
  ];

  const moreMenuItems = [
    { name: t('navigation.flashcards'), href: "/flashcards", icon: CreditCard },
    { name: t('navigation.quizzes'), href: "/quizzes", icon: Brain },
    { name: t('navigation.notes'), href: "/notes", icon: FileText },
    { name: t('navigation.assignments'), href: "/assignments", icon: Calendar },
    { name: t('navigation.users'), href: "/users", icon: Search },
    { name: t('navigation.profile'), href: "/profile", icon: User },
    { name: t('navigation.achievements'), href: "/achievements", icon: Trophy },
    { name: t('navigation.settings'), href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) return null;

  const isMoreMenuActive = moreMenuItems.some(item => location === item.href);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {mainNavItems.map((item) => {
          const isActive = location === item.href;
          const isMainMenu = item.isMain;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "flex flex-col items-center gap-1 h-12 px-3 rounded-2xl transition-all duration-200",
                  isActive && "text-primary",
                  isMainMenu && isActive && "bg-primary text-primary-foreground scale-110 shadow-lg",
                  isMainMenu && !isActive && "bg-primary/20 scale-105"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isMainMenu && "h-6 w-6"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isMainMenu && "text-xs font-semibold"
                )}>
                  {item.name}
                </span>
              </Button>
            </Link>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-12 px-3 rounded-2xl transition-all duration-200",
                isMoreMenuActive && "text-primary"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">{t('common.more') || 'More'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            {moreMenuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 w-full cursor-pointer",
                      isActive && "text-primary"
                    )}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-3" />
              <span>{t('auth.signOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}