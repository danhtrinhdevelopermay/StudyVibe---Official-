import { storage } from "./storage";
import { InsertNotification } from "@shared/schema";

export class NotificationService {
  
  // Create a like notification
  async createLikeNotification(postId: number, postOwnerId: number, likerId: number) {
    if (postOwnerId === likerId) return; // Don't notify self
    
    const liker = await storage.getUser(likerId);
    if (!liker) return;
    
    const notification: InsertNotification = {
      userId: postOwnerId,
      type: "like",
      title: "New Like",
      message: `${liker.displayName || liker.username} liked your post`,
      data: {
        postId,
        likerId,
      },
      isRead: false,
    };
    
    await storage.createNotification(notification);
  }
  
  // Create a comment notification
  async createCommentNotification(postId: number, postOwnerId: number, commenterId: number, commentContent: string) {
    if (postOwnerId === commenterId) return; // Don't notify self
    
    const commenter = await storage.getUser(commenterId);
    if (!commenter) return;
    
    const notification: InsertNotification = {
      userId: postOwnerId,
      type: "comment",
      title: "New Comment",
      message: `${commenter.displayName || commenter.username} commented on your post: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`,
      data: {
        postId,
        commenterId,
      },
      isRead: false,
    };
    
    await storage.createNotification(notification);
  }
  
  // Create a post suggestion notification
  async createPostSuggestionNotification(userId: number, suggestedPostId: number) {
    const suggestedPost = await storage.getPosts(1, 0);
    const post = suggestedPost.find(p => p.id === suggestedPostId);
    
    if (!post) return;
    
    const notification: InsertNotification = {
      userId,
      type: "suggestion",
      title: "Post Suggestion",
      message: `Check out this post from ${post.user.displayName || post.user.username}: "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`,
      data: {
        suggestionPostId: suggestedPostId,
      },
      isRead: false,
    };
    
    await storage.createNotification(notification);
  }
  
  // Create a policy violation notification
  async createViolationNotification(userId: number, violationReason: string, adminMessage: string, deletedPostContent: string) {
    const notification: InsertNotification = {
      userId,
      type: "violation",
      title: "Policy Violation",
      message: `Your post was removed for violating our community guidelines: ${violationReason}`,
      data: {
        violationReason,
        adminMessage,
        deletedPostContent,
      },
      isRead: false,
    };
    
    await storage.createNotification(notification);
  }
  
  // Generate random post suggestions for users
  async generatePostSuggestions() {
    try {
      const allUsers = await storage.getAllUsers(0);
      const allPosts = await storage.getPosts(20, 0);
      
      if (allPosts.length === 0) return;
      
      // For each user, suggest 1-2 random posts from other users
      for (const user of allUsers) {
        const otherUsersPosts = allPosts.filter(post => post.userId !== user.id);
        if (otherUsersPosts.length === 0) continue;
        
        // Randomly select 1-2 posts
        const suggestionsCount = Math.floor(Math.random() * 2) + 1;
        const shuffled = otherUsersPosts.sort(() => 0.5 - Math.random());
        const selectedPosts = shuffled.slice(0, suggestionsCount);
        
        for (const post of selectedPosts) {
          await this.createPostSuggestionNotification(user.id, post.id);
        }
      }
    } catch (error) {
      console.error('Error generating post suggestions:', error);
    }
  }
}

export const notificationService = new NotificationService();