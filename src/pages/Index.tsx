import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ELEVATE
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground max-w-3xl mx-auto">
            AI-Powered Employee Development Platform
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your team's growth with intelligent performance management, personalized development plans, and data-driven insights.
          </p>

          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6"
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center space-y-4">
              <Users className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Team Management</h3>
              <p className="text-muted-foreground">Streamline team development and performance reviews</p>
            </div>
            <div className="text-center space-y-4">
              <Brain className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-semibold">AI Insights</h3>
              <p className="text-muted-foreground">Get personalized development recommendations</p>
            </div>
            <div className="text-center space-y-4">
              <TrendingUp className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-xl font-semibold">Progress Tracking</h3>
              <p className="text-muted-foreground">Monitor growth and achievement milestones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
