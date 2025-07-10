import { useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: [`/api/notifications/${user?.id}/unread-count`],
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/notifications/${user?.id}/read-all`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}/unread-count`] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to relevant content based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Navigate to the post
      window.location.href = '/posts';
    } else if (notification.type === 'suggestion') {
      // Navigate to suggested post
      window.location.href = '/posts';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'suggestion':
        return '💡';
      case 'violation':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-pink-50 dark:bg-pink-900/20';
      case 'comment':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'suggestion':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'violation':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount.count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount.count > 9 ? '9+' : unreadCount.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount.count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`mx-2 my-1 border-0 shadow-none cursor-pointer transition-colors hover:bg-accent/50 ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  } ${getNotificationBgColor(notification.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-lg shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/notifications';
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}