import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Brain, LogOut, Settings, Users, FileText, TrendingUp, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const DashboardLayout = () => {
  const { profile, loading, signOut, isManager, isEmployee } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !profile) {
      navigate('/auth');
    }
  }, [loading, profile, navigate]);

  const handleSignOut = async () => {
    await signOut();
    // No need to navigate - signOut will handle the redirect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ELEVATE
              </h1>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                </div>
              </div>
              
              <ThemeToggle />
              
              {isEmployee && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/employee/notifications')}
                  title="Notification Settings"
                >
                  <Bell className="w-4 h-4" />
                </Button>
              )}
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="bg-gradient-hero border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome back, {profile.name}!
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {isManager 
                      ? "Manage your team's development and growth" 
                      : "Continue your professional development journey"
                    }
                  </p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  {isManager ? (
                    <>
                      <div className="text-center">
                        <Users className="w-8 h-8 text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-1">Team</p>
                      </div>
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-accent mx-auto" />
                        <p className="text-sm text-muted-foreground mt-1">Reports</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <TrendingUp className="w-8 h-8 text-success mx-auto" />
                        <p className="text-sm text-muted-foreground mt-1">Progress</p>
                      </div>
                      <div className="text-center">
                        <Brain className="w-8 h-8 text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-1">AI Insights</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Dashboard */}
        {isManager && <ManagerDashboard />}
        {isEmployee && <EmployeeDashboard />}
      </main>
    </div>
  );
};

export default DashboardLayout;