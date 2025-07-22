import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'manager' | 'employee';

const AuthPage = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Check if the selected role matches the stored role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // If no profile exists, this might be a new user - sign them out and show error
            if (profileError.code === 'PGRST116') {
              await supabase.auth.signOut();
              throw new Error('User profile not found. Please contact your administrator or sign up with the correct role.');
            }
            throw new Error('Unable to fetch user profile');
          }

          if (profile.role !== selectedRole) {
            await supabase.auth.signOut();
            throw new Error(`You selected ${selectedRole} but your account is registered as ${profile.role}. Please select the correct role.`);
          }

          toast({
            title: "Welcome back!",
            description: `Logged in successfully as ${profile.role}.`,
          });

          navigate('/dashboard');
        }
      } else {
        // Signup flow
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              role: selectedRole,
              name: email.split('@')[0],
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ELEVATE
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              AI-Powered Employee Development Platform
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Streamline team development and appraisals
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-accent mt-1" />
              <div>
                <h3 className="font-semibold">AI-Driven Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized development recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="w-full max-w-md mx-auto shadow-brand">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Join ELEVATE'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to continue your development journey' : 'Start your development journey today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manager" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Manager
                </TabsTrigger>
                <TabsTrigger value="employee" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Employee
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              {isLogin && (
                <div className="mt-6 p-3 bg-accent-light rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                    <div className="text-xs text-accent-foreground">
                      <p className="font-medium">Demo accounts:</p>
                      <p>Manager: ananya.manager@elevate.com</p>
                      <p>Employee: sneha.employee1@elevate.com</p>
                      <p className="mt-1 text-muted-foreground">Password: password123</p>
                    </div>
                  </div>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;