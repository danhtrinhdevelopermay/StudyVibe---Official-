import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MediaUpload } from "@/components/posts/media-upload";
import { Heart, MessageCircle, Upload, Image, Video, Send, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";
import type { Post, PostComment, InsertPost, InsertPostComment, User } from "@shared/schema";

const postSchema = z.object({
  content: z.string().min(1, "Content is required"),
  mediaUrls: z.array(z.object({
    type: z.enum(["image", "video"]),
    url: z.string(),
    thumbnailUrl: z.string().optional(),
  })).default([]),
  isPublic: z.boolean().default(true),
});

type PostFormData = z.infer<typeof postSchema>;

type PostWithUser = Post & { 
  user: User; 
  hasLiked?: boolean; 
  likesCount: number; 
  commentsCount: number;
};

type CommentWithUser = PostComment & { user: User };

export default function Posts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Array<{
    type: "image" | "video";
    url: string;
    thumbnailUrl?: string;
    file: File;
  }>>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      if (!user) throw new Error("User not authenticated");
      
      const postData: InsertPost = {
        userId: user.id,
        content: data.content,
        mediaUrls: selectedMedia.map(media => ({
          type: media.type,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
        })),
        isPublic: data.isPublic,
      };
      
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      setSelectedMedia([]);
      setIsCreateDialogOpen(false);
      toast({ title: "Post created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      if (isLiked) {
        return apiRequest("DELETE", `/api/posts/${postId}/like`, { userId: user.id });
      } else {
        return apiRequest("POST", `/api/posts/${postId}/like`, { userId: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Fetch comments for a post
  const getCommentsQuery = (postId: number) => useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    enabled: expandedComments.has(postId),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const commentData: InsertPostComment = {
        postId,
        userId: user.id,
        content,
      };
      
      return apiRequest("POST", `/api/posts/${postId}/comments`, commentData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", variables.postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    createPostMutation.mutate({
      content: newPostContent,
      mediaUrls: selectedMedia.map(media => ({
        type: media.type,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
      })),
      isPublic: true,
    });
  };

  const toggleComments = (postId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleAddComment = (postId: number, content: string) => {
    if (!content.trim()) return;
    addCommentMutation.mutate({ postId, content });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to view and create posts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Post</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[120px]"
              />
              <MediaUpload
                onMediaSelect={setSelectedMedia}
                selectedMedia={selectedMedia}
                maxFiles={5}
              />
              <div className="flex justify-end">{/* Moved button to end */}
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="rounded-full bg-muted h-10 w-10"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/6"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No posts yet. Be the first to share something!
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post: PostWithUser) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );

  function PostCard({ post }: { post: PostWithUser }) {
    const [commentContent, setCommentContent] = useState("");
    const commentsQuery = getCommentsQuery(post.id);
    const comments = commentsQuery.data || [];

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={post.user.photoURL || ""} />
                <AvatarFallback>
                  {(post.user.displayName || post.user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.user.displayName || post.user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{post.content}</p>
          
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="grid gap-2">
              {post.mediaUrls.map((media, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {media.type === "image" ? (
                    <img 
                      src={media.url} 
                      alt="Post media" 
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full h-auto max-h-96"
                      poster={media.thumbnailUrl}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => likePostMutation.mutate({ 
                  postId: post.id, 
                  isLiked: post.hasLiked || false 
                })}
                className="flex items-center space-x-2"
              >
                <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{post.likesCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount}</span>
              </Button>
            </div>
          </div>

          {expandedComments.has(post.id) && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback>
                    {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment(post.id, commentContent);
                        setCommentContent("");
                      }
                    }}
                  />
                  <Button 
                    size="sm"
                    onClick={() => {
                      handleAddComment(post.id, commentContent);
                      setCommentContent("");
                    }}
                    disabled={!commentContent.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {comments.map((comment: CommentWithUser) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user.photoURL || ""} />
                      <AvatarFallback>
                        {(comment.user.displayName || comment.user.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p className="font-semibold text-sm">{comment.user.displayName || comment.user.username}</p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt))} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}