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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, CreditCard, Edit3, Trash2 } from "lucide-react";
import type { FlashcardDeck, Flashcard, InsertFlashcardDeck, InsertFlashcard } from "@shared/schema";

const deckSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

const flashcardSchema = z.object({
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required"),
});

type DeckFormData = z.infer<typeof deckSchema>;
type FlashcardFormData = z.infer<typeof flashcardSchema>;

export function FlashcardCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const deckForm = useForm<DeckFormData>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      title: "",
      description: "",
      isPublic: false,
    },
  });

  const cardForm = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: "",
      back: "",
    },
  });

  // Fetch user's flashcard decks
  const { data: decks = [], isLoading: decksLoading } = useQuery({
    queryKey: ["/api/flashcard-decks", user?.id],
    enabled: !!user?.id,
  });

  // Fetch cards for selected deck
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/flashcards", selectedDeck?.id],
    enabled: !!selectedDeck?.id,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: DeckFormData) => {
      const deckData: InsertFlashcardDeck = {
        ...data,
        userId: user!.id,
      };
      const response = await apiRequest("POST", "/api/flashcard-decks", deckData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-decks"] });
      toast({
        title: "Deck created! 🎉",
        description: "Your new flashcard deck is ready to use.",
      });
      setShowDeckDialog(false);
      deckForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: FlashcardFormData) => {
      if (!selectedDeck) throw new Error("No deck selected");
      
      const cardData: InsertFlashcard = {
        ...data,
        deckId: selectedDeck.id,
      };
      const response = await apiRequest("POST", "/api/flashcards", cardData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Card added! ✨",
        description: "Your flashcard has been added to the deck.",
      });
      setShowCardDialog(false);
      cardForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async (data: FlashcardFormData) => {
      if (!editingCard) throw new Error("No card to update");
      
      const response = await apiRequest("PATCH", `/api/flashcards/${editingCard.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Card updated! 📝",
        description: "Your flashcard has been updated.",
      });
      setShowCardDialog(false);
      setEditingCard(null);
      cardForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      await apiRequest("DELETE", `/api/flashcards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({
        title: "Card deleted",
        description: "The flashcard has been removed from your deck.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeck = (data: DeckFormData) => {
    createDeckMutation.mutate(data);
  };

  const handleCreateCard = (data: FlashcardFormData) => {
    if (editingCard) {
      updateCardMutation.mutate(data);
    } else {
      createCardMutation.mutate(data);
    }
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    cardForm.setValue("front", card.front);
    cardForm.setValue("back", card.back);
    setShowCardDialog(true);
  };

  const handleDeleteCard = (cardId: number) => {
    deleteCardMutation.mutate(cardId);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flashcards 🧠</h1>
          <p className="text-muted-foreground">Create and study with smart flashcards</p>
        </div>
        
        <Dialog open={showDeckDialog} onOpenChange={setShowDeckDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
            </DialogHeader>
            <form onSubmit={deckForm.handleSubmit(handleCreateDeck)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Deck Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Biology Terms, Spanish Vocabulary"
                  {...deckForm.register("title")}
                />
                {deckForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {deckForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What's this deck about?"
                  {...deckForm.register("description")}
                />
              </div>

              <Button
                type="submit"
                disabled={createDeckMutation.isPending}
                className="w-full"
              >
                {createDeckMutation.isPending ? "Creating..." : "Create Deck"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deck Selection */}
      {decksLoading ? (
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
      ) : decks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No flashcard decks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first deck to start studying with flashcards!
            </p>
            <Button onClick={() => setShowDeckDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck: FlashcardDeck) => (
            <Card
              key={deck.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedDeck?.id === deck.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedDeck(deck)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {deck.title}
                  {deck.isPublic && <Badge variant="secondary">Public</Badge>}
                </CardTitle>
                {deck.description && (
                  <p className="text-sm text-muted-foreground">{deck.description}</p>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Deck Content */}
      {selectedDeck && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {selectedDeck.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {cards.length} cards
                </p>
              </div>
              
              <Dialog 
                open={showCardDialog} 
                onOpenChange={(open) => {
                  setShowCardDialog(open);
                  if (!open) {
                    setEditingCard(null);
                    cardForm.reset();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCard ? "Edit Flashcard" : "Add New Flashcard"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={cardForm.handleSubmit(handleCreateCard)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="front">Front of Card</Label>
                      <Textarea
                        id="front"
                        placeholder="Question, term, or prompt..."
                        {...cardForm.register("front")}
                      />
                      {cardForm.formState.errors.front && (
                        <p className="text-sm text-destructive">
                          {cardForm.formState.errors.front.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="back">Back of Card</Label>
                      <Textarea
                        id="back"
                        placeholder="Answer, definition, or explanation..."
                        {...cardForm.register("back")}
                      />
                      {cardForm.formState.errors.back && (
                        <p className="text-sm text-destructive">
                          {cardForm.formState.errors.back.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={createCardMutation.isPending || updateCardMutation.isPending}
                      className="w-full"
                    >
                      {editingCard 
                        ? (updateCardMutation.isPending ? "Updating..." : "Update Card")
                        : (createCardMutation.isPending ? "Adding..." : "Add Card")
                      }
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {cardsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No cards in this deck yet</p>
                <Button onClick={() => setShowCardDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Card
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card: Flashcard) => (
                  <div
                    key={card.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="font-medium">Front:</p>
                          <p className="text-sm text-muted-foreground">{card.front}</p>
                        </div>
                        <div>
                          <p className="font-medium">Back:</p>
                          <p className="text-sm text-muted-foreground">{card.back}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCard(card)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
