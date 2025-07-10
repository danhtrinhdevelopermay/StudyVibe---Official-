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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Calendar, Clock, AlertTriangle, Check, Edit3, Trash2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Assignment, InsertAssignment } from "@shared/schema";

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  subject: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function Assignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      subject: "",
    },
  });

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/assignments", user?.id],
    enabled: !!user?.id,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const assignmentData: InsertAssignment = {
        ...data,
        userId: user!.id,
        dueDate: new Date(data.dueDate),
      };
      const response = await apiRequest("POST", "/api/assignments", assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment created! 📅",
        description: "Your assignment has been added to your tracker.",
      });
      setShowAssignmentDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      if (!editingAssignment) throw new Error("No assignment to update");
      
      const response = await apiRequest("PATCH", `/api/assignments/${editingAssignment.id}`, {
        ...data,
        dueDate: new Date(data.dueDate),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment updated! ✏️",
        description: "Your changes have been saved.",
      });
      setShowAssignmentDialog(false);
      setEditingAssignment(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/assignments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Status updated! ✅",
        description: "Assignment status has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Assignment deleted",
        description: "The assignment has been removed from your tracker.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateAssignment = (data: AssignmentFormData) => {
    if (editingAssignment) {
      updateAssignmentMutation.mutate(data);
    } else {
      createAssignmentMutation.mutate(data);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    form.setValue("title", assignment.title);
    form.setValue("description", assignment.description || "");
    form.setValue("dueDate", format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm"));
    form.setValue("priority", assignment.priority as "low" | "medium" | "high");
    form.setValue("subject", assignment.subject || "");
    setShowAssignmentDialog(true);
  };

  const handleToggleStatus = (assignment: Assignment) => {
    const newStatus = assignment.status === "completed" ? "pending" : "completed";
    toggleStatusMutation.mutate({ id: assignment.id, status: newStatus });
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    deleteAssignmentMutation.mutate(assignmentId);
  };

  const getDeadlineStatus = (dueDate: Date, status: string) => {
    if (status === "completed") {
      return { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    }
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    } else if (isToday(dueDate)) {
      return { label: "Due Today", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    } else if (isTomorrow(dueDate)) {
      return { label: "Due Tomorrow", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    } else {
      return { label: "Upcoming", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    if (filter === "completed") return assignment.status === "completed";
    if (filter === "pending") return assignment.status !== "completed";
    return true;
  });

  const sortedAssignments = filteredAssignments.sort((a: Assignment, b: Assignment) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments 📅</h1>
          <p className="text-muted-foreground">Keep track of your deadlines and never miss a submission</p>
        </div>
        
        <Dialog 
          open={showAssignmentDialog} 
          onOpenChange={(open) => {
            setShowAssignmentDialog(open);
            if (!open) {
              setEditingAssignment(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateAssignment)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Physics Lab Report"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the assignment..."
                  {...form.register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Physics, Math"
                    {...form.register("subject")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={form.watch("priority")} 
                    onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date & Time</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  {...form.register("dueDate")}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
                className="w-full"
              >
                {editingAssignment 
                  ? (updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment")
                  : (createAssignmentMutation.isPending ? "Creating..." : "Add Assignment")
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All ({assignments.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          size="sm"
        >
          Pending ({assignments.filter((a: Assignment) => a.status !== "completed").length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
        >
          Completed ({assignments.filter((a: Assignment) => a.status === "completed").length})
        </Button>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {filter === "all" ? "No assignments yet" : `No ${filter} assignments`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === "all" 
                ? "Add your first assignment to get started!" 
                : `You don't have any ${filter} assignments.`
              }
            </p>
            {filter === "all" && (
              <Button onClick={() => setShowAssignmentDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment: Assignment) => {
            const status = getDeadlineStatus(new Date(assignment.dueDate), assignment.status);
            
            return (
              <Card 
                key={assignment.id} 
                className={`transition-all hover:shadow-lg ${
                  assignment.status === "completed" ? "opacity-75" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(assignment)}
                          className={`p-1 h-6 w-6 rounded-full ${
                            assignment.status === "completed"
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "border-2 border-muted-foreground hover:border-primary"
                          }`}
                        >
                          {assignment.status === "completed" && <Check className="h-3 w-3" />}
                        </Button>
                        
                        <h3 className={`text-lg font-semibold ${
                          assignment.status === "completed" ? "line-through" : ""
                        }`}>
                          {assignment.title}
                        </h3>
                        
                        <Badge variant="outline" className={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                        
                        {assignment.priority === "high" && assignment.status !== "completed" && (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      
                      {assignment.description && (
                        <p className="text-muted-foreground mb-3">{assignment.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                        
                        {assignment.subject && (
                          <Badge variant="outline" className="text-xs">
                            {assignment.subject}
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
