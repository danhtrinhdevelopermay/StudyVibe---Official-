import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Smartphone, 
  Mail,
  Shield,
  Trash2,
  Save,
  Database,
  Languages
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Local state for form data
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    assignments: true,
    studyReminders: true,
    achievements: true,
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t('common.success'),
        description: t('settings.languageUpdated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    toast({
      title: t('common.success'),
      description: t('settings.languageUpdated'),
    });
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account deletion initiated",
        description: "Your account deletion request has been submitted.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.username} />
              <AvatarFallback className="text-lg">
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/20 text-primary">
                  Level {user.level}
                </Badge>
                <Badge variant="outline" className="bg-secondary/20 text-secondary">
                  {user.xp} XP
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.selectLanguage')}</Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <span>🇺🇸</span>
                    <span>{t('settings.english')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="vi">
                  <div className="flex items-center gap-2">
                    <span>🇻🇳</span>
                    <span>{t('settings.vietnamese')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {i18n.language === 'vi' 
                ? 'Chọn ngôn ngữ hiển thị cho ứng dụng' 
                : 'Choose your preferred display language for the application'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, push: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Assignment Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming assignments
              </p>
            </div>
            <Switch
              checked={notifications.assignments}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, assignments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Study Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Daily reminders to keep your study streak going
              </p>
            </div>
            <Switch
              checked={notifications.studyReminders}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, studyReminders: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Achievement Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you unlock new achievements
              </p>
            </div>
            <Switch
              checked={notifications.achievements}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, achievements: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Control who can see your profile and activity
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Data Export</Label>
              <p className="text-sm text-muted-foreground">
                Download a copy of your data
              </p>
            </div>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Admin Panel
              </Label>
              <p className="text-sm text-muted-foreground">
                Access database management console
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Open Admin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}