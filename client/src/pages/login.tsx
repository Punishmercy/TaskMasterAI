import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { User, Users, UserPlus } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Registration form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (user) => {
      // Store user info and redirect based on role
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    },
    onError: (error: Error) => {
      setError(error.message || "Login failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (user) => {
      setSuccess("Account created successfully! You can now log in with your credentials.");
      setRegUsername("");
      setRegPassword("");
      setRegConfirmPassword("");
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message || "Registration failed");
      setSuccess("");
    },
  });

  const handleLogin = (role: "admin" | "tasker") => {
    const credentials = role === "admin" 
      ? { username: "admin", password: "admin" }
      : { username: "tasker", password: "tasker" };
    
    setUsername(credentials.username);
    setPassword(credentials.password);
    loginMutation.mutate(credentials);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }
    setError("");
    setSuccess("");
    loginMutation.mutate({ username, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!regUsername || !regPassword || !regConfirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (regUsername.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    
    if (regPassword.length < 3) {
      setError("Password must be at least 3 characters long");
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    registerMutation.mutate({ username: regUsername, password: regPassword });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Chat Evaluation Platform
          </CardTitle>
          <CardDescription>
            Sign in or create a new tasker account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(error || success) && (
            <Alert variant={error ? "destructive" : "default"} className="mb-6">
              <AlertDescription>{error || success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              {/* Quick Login Buttons */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Quick Login</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleLogin("admin")}
                    disabled={loginMutation.isPending}
                    className="h-12 flex-col space-y-1"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Admin</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleLogin("tasker")}
                    disabled={loginMutation.isPending}
                    className="h-12 flex-col space-y-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-xs">Demo Tasker</span>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or login with credentials</span>
                </div>
              </div>

              {/* Manual Login Form */}
              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={loginMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={loginMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500">
                <p>Demo credentials:</p>
                <p>Admin: admin/admin | Tasker: tasker/tasker</p>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <div className="text-center">
                <UserPlus className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Create Tasker Account</h3>
                <p className="text-sm text-slate-600">Join the platform to start evaluating AI responses</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a username (min 3 characters)"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose a password (min 3 characters)"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Tasker Account"}
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500">
                <p>All accounts are created with "tasker" role</p>
                <p>You'll earn $5 for each completed evaluation task</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}