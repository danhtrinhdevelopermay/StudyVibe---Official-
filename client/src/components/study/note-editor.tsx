import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, FileText, Edit3, Trash2, Search, Tag } from "lucide-react";
import type { Note, InsertNote } from "@shared/schema";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.any(), // Rich text content
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

type NoteFormData = z.infer<typeof noteSchema>;

export function NoteEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTag, setNewTag] = useState("");

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: { type: "doc", content: [{ type: "paragraph" }] },
      tags: [],
      isPublic: false,
    },
  });

  // Fetch user's notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/notes", user?.id],
    enabled: !!user?.id,
  });

  // Search notes
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/notes", user?.id, "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/notes/${user?.id}/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: !!user?.id && searchQuery.length > 2,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const noteData: InsertNote = {
        ...data,
        userId: user!.id,
        content: typeof data.content === 'string' ? { text: data.content } : data.content,
      };
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note created! 📝",
        description: "Your note has been saved successfully.",
      });
      setShowNoteDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      if (!selectedNote) throw new Error("No note selected");
      
      const response = await apiRequest("PATCH", `/api/notes/${selectedNote.id}`, {
        ...data,
        content: typeof data.content === 'string' ? { text: data.content } : data.content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note updated! ✏️",
        description: "Your changes have been saved.",
      });
      setShowNoteDialog(false);
      setSelectedNote(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note deleted",
        description: "The note has been removed from your collection.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNote = (data: NoteFormData) => {
    if (selectedNote) {
      updateNoteMutation.mutate(data);
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    form.setValue("title", note.title);
    form.setValue("content", note.content);
    form.setValue("tags", note.tags || []);
    form.setValue("isPublic", note.isPublic);
    setShowNoteDialog(true);
  };

  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const displayedNotes = searchQuery.length > 2 ? searchResults : notes;

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notes 📝</h1>
          <p className="text-muted-foreground">Organize your thoughts and ideas</p>
        </div>
        
        <Dialog 
          open={showNoteDialog} 
          onOpenChange={(open) => {
            setShowNoteDialog(open);
            if (!open) {
              setSelectedNote(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedNote ? "Edit Note" : "Create New Note"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateNote)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter note title..."
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your notes here..."
                  className="min-h-[300px]"
                  value={typeof form.watch("content") === "string" ? form.watch("content") : ""}
                  onChange={(e) => form.setValue("content", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch("tags").map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={form.watch("isPublic")}
                  onCheckedChange={(checked) => form.setValue("isPublic", !!checked)}
                />
                <Label htmlFor="isPublic">Make this note public</Label>
              </div>

              <Button
                type="submit"
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                className="w-full"
              >
                {selectedNote 
                  ? (updateNoteMutation.isPending ? "Updating..." : "Update Note")
                  : (createNoteMutation.isPending ? "Creating..." : "Create Note")
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search your notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes Grid */}
      {notesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedNotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Create your first note to get started!"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNoteDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedNotes.map((note: Note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {note.isPublic && (
                  <Badge variant="secondary" className="w-fit">Public</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {typeof note.content === "string" 
                      ? note.content 
                      : note.content?.text || "No content"
                    }
                  </p>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
