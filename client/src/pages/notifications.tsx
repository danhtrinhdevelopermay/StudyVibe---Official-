import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Bell, X, Check } from "lucide-react";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/notifications/${user?.id}/read-all`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
    },
  });

  const getNotificationIcon = (notification: Notification) => {
    if (notification.data?.isAdminAnnouncement) {
      const priority = notification.data.priority;
      switch (priority) {
        case 'urgent':
          return '🚨';
        case 'high':
          return '⚡';
        default:
          return '📢';
      }
    }
    
    switch (notification.type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'suggestion':
        return '💡';
      case 'violation':
        return '⚠️';
      case 'admin_announcement':
        return '📢';
      default:
        return '📢';
    }
  };

  const getNotificationBgColor = (notification: Notification) => {
    if (notification.data?.isAdminAnnouncement) {
      const priority = notification.data.priority;
      switch (priority) {
        case 'urgent':
          return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-l-red-500';
        case 'high':
          return 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-l-yellow-500';
        default:
          return 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500';
      }
    }
    
    switch (notification.type) {
      case 'like':
        return 'bg-pink-50 dark:bg-pink-900/20';
      case 'comment':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'suggestion':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'violation':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'admin_announcement':
        return 'bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return <div>Please log in to view notifications</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see likes, comments, and suggestions here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border transition-colors hover:bg-accent/50 ${
                      !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                    } ${getNotificationBgColor(notification)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl shrink-0">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">
                              {notification.title}
                            </h3>
                            {notification.data?.isAdminAnnouncement && (
                              <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
                                Admin
                              </span>
                            )}
                            {notification.data?.priority === 'urgent' && (
                              <span className="text-xs px-2 py-1 bg-red-600 text-white rounded-full animate-pulse">
                                URGENT
                              </span>
                            )}
                            {notification.data?.priority === 'high' && (
                              <span className="text-xs px-2 py-1 bg-yellow-600 text-white rounded-full">
                                HIGH PRIORITY
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Display media attachments for admin announcements */}
                        {notification.data?.mediaUrls && notification.data.mediaUrls.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {notification.data.mediaUrls.map((media, index) => (
                              <div key={index} className="rounded-lg overflow-hidden border">
                                {media.type === 'image' ? (
                                  <img 
                                    src={media.url} 
                                    alt="Attachment"
                                    className="w-full h-32 object-cover"
                                  />
                                ) : (
                                  <video 
                                    src={media.url}
                                    controls
                                    className="w-full h-32"
                                    poster={media.thumbnailUrl}
                                  >
                                    Your browser does not support video playback.
                                  </video>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}