import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/auth";
import { GraduationCap, Mail } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      displayName: "",
    },
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome! 🎉",
        description: "Successfully signed in with Google.",
      });
    } catch (error: any) {
      console.error("Google sign in error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups and try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      toast({
        title: "Welcome back! 👋",
        description: "You're now signed in to StudyVibe.",
      });
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUpWithEmail(data.email, data.password, data.username, data.displayName);
      toast({
        title: "Welcome to StudyVibe! 🎉",
        description: "Your account has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-xl">
              <GraduationCap className="text-primary-foreground w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to StudyVibe</CardTitle>
          <CardDescription>
            The study platform that actually gets you 📚
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 h-12"
            size="lg"
          >
            <FaGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    {...signInForm.register("email")}
                  />
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    {...signInForm.register("password")}
                  />
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In with Email
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      placeholder="coolstudent"
                      {...signUpForm.register("username")}
                    />
                    {signUpForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-displayName">Display Name</Label>
                    <Input
                      id="signup-displayName"
                      placeholder="Cool Student"
                      {...signUpForm.register("displayName")}
                    />
                    {signUpForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    {...signUpForm.register("email")}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register("password")}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                  <Input
                    id="signup-confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...signUpForm.register("confirmPassword")}
                  />
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm text-muted-foreground">
            <p>Free forever • No spam • 2min setup ✨</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
