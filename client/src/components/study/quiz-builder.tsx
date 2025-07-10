import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Brain, Play, Trash2, Target } from "lucide-react";
import type { Quiz, InsertQuiz } from "@shared/schema";

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
  correctAnswer: z.number().min(0, "Correct answer must be selected"),
  explanation: z.string().optional(),
});

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "At least 1 question required"),
  isPublic: z.boolean().default(false),
});

type QuizFormData = z.infer<typeof quizSchema>;

export function QuizBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [
        {
          question: "",
          options: ["", ""],
          correctAnswer: 0,
          explanation: "",
        },
      ],
      isPublic: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Fetch user's quizzes
  const { data: userQuizzes = [], isLoading: userQuizzesLoading } = useQuery({
    queryKey: ["/api/quizzes", user?.id],
    enabled: !!user?.id,
  });

  // Fetch public quizzes
  const { data: publicQuizzes = [], isLoading: publicQuizzesLoading } = useQuery({
    queryKey: ["/api/quizzes/public/all"],
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const quizData: InsertQuiz = {
        ...data,
        userId: user!.id,
      };
      const response = await apiRequest("POST", "/api/quizzes", quizData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz created! 🧠",
        description: "Your quiz is ready for taking.",
      });
      setShowQuizDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: number; answers: number[] }) => {
      if (!selectedQuiz) throw new Error("No quiz selected");
      
      const score = answers.reduce((acc, answer, index) => {
        return acc + (answer === selectedQuiz.questions[index].correctAnswer ? 1 : 0);
      }, 0);

      const attemptData = {
        quizId,
        userId: user!.id,
        score,
        totalQuestions: selectedQuiz.questions.length,
        answers,
      };

      const response = await apiRequest("POST", "/api/quiz-attempts", attemptData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz completed! 🎉",
        description: "Your results have been saved.",
      });
      setShowResults(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuiz = (data: QuizFormData) => {
    createQuizMutation.mutate(data);
  };

  const addOption = (questionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    form.setValue(`questions.${questionIndex}.options`, [...currentOptions, ""]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`questions.${questionIndex}.options`);
    if (currentOptions.length <= 2) return; // Minimum 2 options
    
    const newOptions = currentOptions.filter((_, index) => index !== optionIndex);
    form.setValue(`questions.${questionIndex}.options`, newOptions);
    
    // Adjust correct answer if needed
    const correctAnswer = form.getValues(`questions.${questionIndex}.correctAnswer`);
    if (correctAnswer >= optionIndex) {
      form.setValue(`questions.${questionIndex}.correctAnswer`, Math.max(0, correctAnswer - 1));
    }
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(quiz.questions.length).fill(-1));
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (selectedQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedQuiz || userAnswers.includes(-1)) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitQuizMutation.mutate({
      quizId: selectedQuiz.id,
      answers: userAnswers,
    });
  };

  const calculateScore = () => {
    if (!selectedQuiz) return 0;
    return userAnswers.reduce((acc, answer, index) => {
      return acc + (answer === selectedQuiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  if (!user) return null;

  // Quiz taking view
  if (selectedQuiz && !showResults) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
            ← Back to Quizzes
          </Button>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>{selectedQuiz.title}</CardTitle>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
              <RadioGroup
                value={userAnswers[currentQuestionIndex]?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={submitQuizMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={userAnswers[currentQuestionIndex] === -1}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (selectedQuiz && showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / selectedQuiz.questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
            ← Back to Quizzes
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quiz Complete! 🎉</CardTitle>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">{percentage}%</p>
              <p className="text-muted-foreground">
                You got {score} out of {selectedQuiz.questions.length} questions correct
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedQuiz.questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isCorrect ? 'border-secondary bg-secondary/10' : 'border-destructive bg-destructive/10'
                  }`}
                >
                  <h4 className="font-semibold mb-2">Question {index + 1}: {question.question}</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Your answer:</span>{" "}
                      <span className={isCorrect ? "text-secondary" : "text-destructive"}>
                        {question.options[userAnswer]}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-secondary">
                          {question.options[question.correctAnswer]}
                        </span>
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-muted-foreground mt-2">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            <Button
              onClick={() => handleTakeQuiz(selectedQuiz)}
              className="w-full"
            >
              Take Quiz Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quizzes 🧠</h1>
          <p className="text-muted-foreground">Test your knowledge and track your progress</p>
        </div>
        
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateQuiz)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., World History Quiz"
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
                  <Input
                    id="description"
                    placeholder="Brief description of the quiz"
                    {...form.register("description")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={form.watch("isPublic")}
                    onCheckedChange={(checked) => form.setValue("isPublic", !!checked)}
                  />
                  <Label htmlFor="isPublic">Make this quiz public</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({
                      question: "",
                      options: ["", ""],
                      correctAnswer: 0,
                      explanation: "",
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Textarea
                          placeholder="Enter your question..."
                          {...form.register(`questions.${index}.question`)}
                        />
                        {form.formState.errors.questions?.[index]?.question && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.questions[index]?.question?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Answer Options</Label>
                        {form.watch(`questions.${index}.options`).map((_, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <RadioGroup
                              value={form.watch(`questions.${index}.correctAnswer`).toString()}
                              onValueChange={(value) => 
                                form.setValue(`questions.${index}.correctAnswer`, parseInt(value))
                              }
                            >
                              <RadioGroupItem 
                                value={optionIndex.toString()} 
                                id={`q${index}-correct-${optionIndex}`}
                              />
                            </RadioGroup>
                            <Input
                              placeholder={`Option ${optionIndex + 1}`}
                              {...form.register(`questions.${index}.options.${optionIndex}`)}
                              className="flex-1"
                            />
                            {form.watch(`questions.${index}.options`).length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(index)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Explanation (optional)</Label>
                        <Textarea
                          placeholder="Explain why this is the correct answer..."
                          {...form.register(`questions.${index}.explanation`)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="submit"
                disabled={createQuizMutation.isPending}
                className="w-full"
              >
                {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Your Quizzes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
        {userQuizzesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userQuizzes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first quiz to test your knowledge!
              </p>
              <Button onClick={() => setShowQuizDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userQuizzes.map((quiz: Quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {quiz.title}
                    {quiz.isPublic && <Badge variant="secondary">Public</Badge>}
                  </CardTitle>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length} questions
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTakeQuiz(quiz)}
                    className="w-full"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Take Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Public Quizzes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Community Quizzes</h2>
        {publicQuizzesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicQuizzes.map((quiz: Quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {quiz.questions.length} questions
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTakeQuiz(quiz)}
                    className="w-full"
                    variant="outline"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Try This Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
