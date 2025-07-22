import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft,
  CheckCircle2,
  ChevronDown, 
  ChevronUp,
  BookOpen,
  Video,
  FileText,
  CheckSquare,
  ExternalLink,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IDP {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  type: 'technical' | 'functional' | 'behavioral';
}

interface DevelopmentPlan {
  udemy: { title: string; duration: string; link: string };
  youtube: { title: string; link: string };
  reading: { title: string; link: string };
  tasks: string[];
  markAsRead?: boolean;
  udemyRead?: boolean;
  youtubeRead?: boolean;
  readingRead?: boolean;
  tasksRead?: number[];
}

interface SkillDevelopmentPlan {
  id: string;
  skill_id: string;
  plan_info: any; // Using any to handle the JSON from database
  progress: string;
}

const EmployeeIDPPage = () => {
  const { idpId } = useParams<{ idpId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [idp, setIDP] = useState<IDP | null>(null);
  const [skills, setSkills] = useState<{
    technical: Skill[];
    functional: Skill[];
    behavioral: Skill[];
  }>({
    technical: [],
    functional: [],
    behavioral: []
  });
  const [developmentPlans, setDevelopmentPlans] = useState<Record<string, SkillDevelopmentPlan>>({});
  const [openSection, setOpenSection] = useState<string>('technical');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idpId) {
      fetchIDPData();
    }
  }, [idpId]);

  const fetchIDPData = async () => {
    try {
      // Fetch IDP details
      const { data: idpData, error: idpError } = await supabase
        .from('idps')
        .select('*')
        .eq('id', idpId)
        .single();

      if (idpError) throw idpError;
      setIDP(idpData);

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('idp_id', idpId);

      if (skillsError) throw skillsError;

      if (skillsData) {
        console.log('Raw skills data:', skillsData);
        const groupedSkills = {
          technical: skillsData.filter(s => s.type === 'technical').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          })),
          functional: skillsData.filter(s => s.type === 'functional').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          })),
          behavioral: skillsData.filter(s => s.type === 'behavioral').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          }))
        };
        console.log('Grouped skills:', groupedSkills);
        setSkills(groupedSkills);

        // Fetch development plans for each skill individually
        const skillIds = skillsData.map(s => s.id);
        const plansMap: Record<string, SkillDevelopmentPlan> = {};
        
        for (const skillId of skillIds) {
          try {
            // Try to fetch existing development plan from database first
            const { data: existingPlans, error: dbError } = await supabase
              .from('skill_development_plan')
              .select('*')
              .eq('skill_id', skillId);

            if (!dbError && existingPlans && existingPlans.length > 0) {
              console.log(`Found existing plan for skill ${skillId}:`, existingPlans[0]);
              plansMap[skillId] = {
                ...existingPlans[0],
                plan_info: existingPlans[0].plan_info as unknown as DevelopmentPlan
              };
              continue;
            }

            // If no existing plan, use edge function to create and fetch one
            const { data: planData, error: planError } = await supabase.functions.invoke('skill-development-plan', {
              method: 'GET',
              body: { skill_id: skillId }
            });

            if (planError) {
              console.error(`Error fetching plan for skill ${skillId}:`, planError);
              continue;
            }

            console.log(`Plan data for skill ${skillId}:`, planData);

            if (planData && planData.length > 0) {
              plansMap[skillId] = {
                ...planData[0],
                plan_info: planData[0].plan_info as unknown as DevelopmentPlan
              };
            }
          } catch (error) {
            console.error(`Failed to fetch plan for skill ${skillId}:`, error);
            
            // Fallback to direct database query for this skill
            try {
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('skill_development_plan')
                .select('*')
                .eq('skill_id', skillId)
                .single();

              if (!fallbackError && fallbackData) {
                plansMap[skillId] = {
                  ...fallbackData,
                  plan_info: fallbackData.plan_info as unknown as DevelopmentPlan
                };
              }
            } catch (fallbackErr) {
              console.error(`Fallback failed for skill ${skillId}:`, fallbackErr);
            }
          }
        }

        console.log('Final plans map:', plansMap);
        setDevelopmentPlans(plansMap);
      }
    } catch (error) {
      console.error('Error fetching IDP data:', error);
      toast({
        title: "Error",
        description: "Failed to load IDP data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (skillId: string, itemType: 'udemy' | 'youtube' | 'reading' | 'tasks', itemIndex?: number) => {
    try {
      const plan = developmentPlans[skillId];
      if (!plan) return;

      // Skip if this is dummy data
      if (plan.id.startsWith('dummy-')) {
        toast({
          title: "Demo Mode",
          description: "This is demo data. In a real application, this would update the database.",
        });
        return;
      }

      const updatedPlanInfo = { ...plan.plan_info } as unknown as DevelopmentPlan;
      
      if (itemType === 'tasks' && itemIndex !== undefined) {
        // Mark specific task as read
        if (!updatedPlanInfo.tasksRead) {
          updatedPlanInfo.tasksRead = [];
        }
        if (!updatedPlanInfo.tasksRead.includes(itemIndex)) {
          updatedPlanInfo.tasksRead.push(itemIndex);
        }
      } else {
        // Mark entire resource as read
        (updatedPlanInfo as any)[`${itemType}Read`] = true;
      }

      // Calculate new progress
      const newProgress = calculateProgress(updatedPlanInfo);
      const progressStatus = newProgress === 100 ? 'completed' : 'in_progress';

      // Update via edge function
      try {
        const { data: updatedPlan, error: updateError } = await supabase.functions.invoke('skill-development-plan', {
          method: 'PUT',
          body: { 
            id: plan.id, 
            plan_info: updatedPlanInfo,
            progress: progressStatus
          }
        });

        if (updateError) {
          throw updateError;
        }

        console.log('Updated plan via edge function:', updatedPlan);

        // Update local state
        setDevelopmentPlans(prev => ({
          ...prev,
          [skillId]: {
            ...plan,
            plan_info: updatedPlanInfo,
            progress: progressStatus
          }
        }));

      } catch (edgeError) {
        console.error('Edge function update failed, using direct DB update:', edgeError);
        
        // Fallback to direct database update
        const { error } = await supabase
          .from('skill_development_plan')
          .update({ 
            plan_info: updatedPlanInfo as any,
            progress: progressStatus
          })
          .eq('id', plan.id);

        if (error) throw error;

        // Update local state
        setDevelopmentPlans(prev => ({
          ...prev,
          [skillId]: {
            ...plan,
            plan_info: updatedPlanInfo,
            progress: progressStatus
          }
        }));
      }

      const actionText = itemType === 'tasks' ? 'task completed' : 'marked as completed';
      toast({
        title: "Success",
        description: `Successfully ${actionText}`,
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: "Error",
        description: "Failed to update completion status",
        variant: "destructive",
      });
    }
  };

  const calculateProgress = (planInfo: DevelopmentPlan): number => {
    let completed = 0;
    let total = 4; // udemy, youtube, reading, tasks

    if (planInfo.udemyRead) completed++;
    if (planInfo.youtubeRead) completed++;
    if (planInfo.readingRead) completed++;
    
    // Check tasks progress
    const tasksCompleted = planInfo.tasksRead?.length || 0;
    const totalTasks = planInfo.tasks?.length || 1;
    if (tasksCompleted === totalTasks) completed++;

    return Math.round((completed / total) * 100);
  };

  const getSkillProgress = (skillId: string) => {
    const plan = developmentPlans[skillId];
    if (!plan) return 0;

    const info = plan.plan_info as DevelopmentPlan;
    return calculateProgress(info);
  };

  const getCategoryProgress = (skillType: 'technical' | 'functional' | 'behavioral') => {
    const categorySkills = skills[skillType];
    if (categorySkills.length === 0) return 0;

    const totalProgress = categorySkills.reduce((sum, skill) => sum + getSkillProgress(skill.id), 0);
    return Math.round(totalProgress / categorySkills.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!idp) {
    return (
      <div className="text-center p-8">
        <p>IDP not found</p>
      </div>
    );
  }

  const SkillSection = ({ type, title, icon: Icon }: { 
    type: 'technical' | 'functional' | 'behavioral'; 
    title: string; 
    icon: React.ComponentType<any>;
  }) => {
    const isOpen = openSection === type;
    const categorySkills = skills[type];
    const categoryProgress = getCategoryProgress(type);

    return (
      <Card className="mb-4">
        <Collapsible 
          open={isOpen} 
          onOpenChange={() => setOpenSection(isOpen ? '' : type)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <span>{title}</span>
                  <Badge variant="secondary">{categorySkills.length} skills</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Progress value={categoryProgress} className="w-20" />
                    <span className="text-sm text-muted-foreground">{categoryProgress}%</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {categorySkills.map((skill) => {
                console.log(`Checking skill ${skill.name} (${skill.id})`);
                const plan = developmentPlans[skill.id];
                console.log(`Plan for skill ${skill.id}:`, plan);
                if (!plan) {
                  console.log(`No plan found for skill ${skill.id}, showing placeholder`);
                  return (
                    <Card key={skill.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{skill.name}</h4>
                        <Badge variant="outline">No development plan available</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Development resources will be available once the plan is created by your manager.
                      </p>
                    </Card>
                  );
                }

                return (
                  <SkillDevelopmentCard 
                    key={skill.id} 
                    skill={skill} 
                    plan={plan} 
                    onMarkAsRead={markAsRead}
                    progress={getSkillProgress(skill.id)}
                  />
                );
              })}
              {categorySkills.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No skills found in this category</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{idp.name}</h1>
          <p className="text-muted-foreground">Individual Development Plan</p>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Development Plan Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Technical Skills</span>
              </div>
              <div className="space-y-2">
                <Progress value={getCategoryProgress('technical')} className="h-2" />
                <p className="text-sm text-muted-foreground">{getCategoryProgress('technical')}% Complete</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-medium">Functional Skills</span>
              </div>
              <div className="space-y-2">
                <Progress value={getCategoryProgress('functional')} className="h-2" />
                <p className="text-sm text-muted-foreground">{getCategoryProgress('functional')}% Complete</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Behavioral Skills</span>
              </div>
              <div className="space-y-2">
                <Progress value={getCategoryProgress('behavioral')} className="h-2" />
                <p className="text-sm text-muted-foreground">{getCategoryProgress('behavioral')}% Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Development Sections */}
      <SkillSection type="technical" title="Technical Skills" icon={BookOpen} />
      <SkillSection type="functional" title="Functional Skills" icon={Target} />
      <SkillSection type="behavioral" title="Behavioral Skills" icon={CheckCircle2} />
    </div>
  );
};

const SkillDevelopmentCard = ({ 
  skill, 
  plan, 
  onMarkAsRead, 
  progress 
}: { 
  skill: Skill; 
  plan: SkillDevelopmentPlan; 
  onMarkAsRead: (skillId: string, itemType: 'udemy' | 'youtube' | 'reading' | 'tasks', itemIndex?: number) => void;
  progress: number;
}) => {
  const info = plan.plan_info as DevelopmentPlan;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{skill.name}</span>
          <div className="flex items-center space-x-2">
            <Progress value={progress} className="w-20" />
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Udemy Course */}
          <Card className={`hover:shadow-md transition-shadow ${info.udemyRead ? 'bg-success/5 border-success/20' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                  Udemy Course
                </div>
                {info.udemyRead && <CheckCircle2 className="w-4 h-4 text-success" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <h4 className="font-medium text-sm">{info.udemy.title}</h4>
              <p className="text-xs text-muted-foreground">{info.udemy.duration}</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={info.udemy.link} target="_blank" rel="noopener noreferrer">
                    View Course
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
                {!info.udemyRead && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onMarkAsRead(skill.id, 'udemy')}
                  >
                    Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* YouTube Tutorial */}
          <Card className={`hover:shadow-md transition-shadow ${info.youtubeRead ? 'bg-success/5 border-success/20' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-2 text-red-600" />
                  YouTube Tutorial
                </div>
                {info.youtubeRead && <CheckCircle2 className="w-4 h-4 text-success" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <h4 className="font-medium text-sm">{info.youtube.title}</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={info.youtube.link} target="_blank" rel="noopener noreferrer">
                    Watch Video
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
                {!info.youtubeRead && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onMarkAsRead(skill.id, 'youtube')}
                  >
                    Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reading Material */}
          <Card className={`hover:shadow-md transition-shadow ${info.readingRead ? 'bg-success/5 border-success/20' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  Reading Material
                </div>
                {info.readingRead && <CheckCircle2 className="w-4 h-4 text-success" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <h4 className="font-medium text-sm">{info.reading.title}</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={info.reading.link} target="_blank" rel="noopener noreferrer">
                    Read Guide
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
                {!info.readingRead && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onMarkAsRead(skill.id, 'reading')}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Practical Assignments */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                Practical Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {info.tasks.map((task, index) => {
                  const isRead = info.tasksRead?.includes(index);
                  return (
                    <div key={index} className={`p-2 rounded border text-xs ${isRead ? 'bg-success/5 border-success/20' : ''}`}>
                      <div className="flex items-start justify-between space-x-2">
                        <span className={isRead ? 'line-through text-muted-foreground' : ''}>{task}</span>
                        {isRead ? (
                          <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-1"
                            onClick={() => onMarkAsRead(skill.id, 'tasks', index)}
                          >
                            Mark
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeIDPPage;