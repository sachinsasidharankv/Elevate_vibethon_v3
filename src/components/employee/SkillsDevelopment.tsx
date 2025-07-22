import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  BookOpen,
  Video,
  FileText,
  CheckSquare,
  ExternalLink,
  Target,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Skill {
  id?: string;
  name: string;
  type: 'technical' | 'functional' | 'behavioral';
  isNew?: boolean;
}

interface DevelopmentPlan {
  udemy: { title: string; duration: string; link: string };
  youtube: { title: string; link: string };
  reading: { title: string; link: string };
  tasks: string[];
}

interface SkillsDevelopmentProps {
  idpId: string;
  appraisalSourceId: string;
}

const SkillsDevelopment: React.FC<SkillsDevelopmentProps> = ({ idpId, appraisalSourceId }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<{
    technical: Skill[];
    functional: Skill[];
    behavioral: Skill[];
  }>({
    technical: [],
    functional: [],
    behavioral: []
  });
  
  const [openSection, setOpenSection] = useState<string>('');
  const [reviewedSections, setReviewedSections] = useState<Set<string>>(new Set());
  const [developmentPlan, setDevelopmentPlan] = useState<Record<string, Record<string, DevelopmentPlan>>>({});
  const [skillProgress, setSkillProgress] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    loadExistingSkills();
    loadProgressData();
  }, [idpId]);

  const loadProgressData = async () => {
    try {
      // First get all skills for this IDP
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('idp_id', idpId);

      if (skillsError) throw skillsError;

      if (skillsData && skillsData.length > 0) {
        // Get development plans for these skills
        const skillIds = skillsData.map(s => s.id);
        const { data: plansData, error: plansError } = await supabase
          .from('skill_development_plan')
          .select('*')
          .in('skill_id', skillIds);

        if (plansError) throw plansError;

        if (plansData) {
          const progressMap: Record<string, Record<string, number>> = {
            technical: {},
            functional: {},
            behavioral: {}
          };

          // Calculate progress for each skill
          plansData.forEach(plan => {
            const skill = skillsData.find(s => s.id === plan.skill_id);
            if (skill) {
              const planInfo = plan.plan_info as any;
              let completed = 0;
              let total = 4; // udemy, youtube, reading, tasks

              if (planInfo.udemyRead) completed++;
              if (planInfo.youtubeRead) completed++;
              if (planInfo.readingRead) completed++;
              
              const tasksCompleted = planInfo.tasksRead?.length || 0;
              const totalTasks = planInfo.tasks?.length || 1;
              if (tasksCompleted === totalTasks) completed++;

              const progressPercent = Math.round((completed / total) * 100);
              progressMap[skill.type as 'technical' | 'functional' | 'behavioral'][skill.name] = progressPercent;
            }
          });

          setSkillProgress(progressMap);
        }
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const loadExistingSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('idp_id', idpId);

      if (error) throw error;

      if (data && data.length > 0) {
        const groupedSkills = {
          technical: data.filter(s => s.type === 'technical').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          })),
          functional: data.filter(s => s.type === 'functional').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          })),
          behavioral: data.filter(s => s.type === 'behavioral').map(s => ({
            id: s.id,
            name: s.name,
            type: s.type as 'technical' | 'functional' | 'behavioral'
          }))
        };
        setSkills(groupedSkills);
      } else {
        // Generate initial skills if none exist
        await generateSkillSets();
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const generateSkillSets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('excel-ai-analyzer', {
        body: { appraisalSourceId }
      });

      if (error) throw error;

      if (data.success) {
        const newSkills = {
          technical: data.skills.technical.map((name: string) => ({ name, type: 'technical' as const, isNew: true })),
          functional: data.skills.functional.map((name: string) => ({ name, type: 'functional' as const, isNew: true })),
          behavioral: data.skills.behavioral.map((name: string) => ({ name, type: 'behavioral' as const, isNew: true }))
        };
        setSkills(newSkills);
        
        toast({
          title: "Success",
          description: "Skills generated from appraisal analysis",
        });
      }
    } catch (error) {
      console.error('Error generating skills:', error);
      toast({
        title: "Error",
        description: "Failed to generate skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (type: 'technical' | 'functional' | 'behavioral', name: string) => {
    if (!name.trim()) return;
    
    setSkills(prev => ({
      ...prev,
      [type]: [...prev[type], { name: name.trim(), type, isNew: true }]
    }));
  };

  const removeSkill = (type: 'technical' | 'functional' | 'behavioral', index: number) => {
    setSkills(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const markSectionReviewed = (section: string) => {
    setReviewedSections(prev => new Set([...prev, section]));
  };

  const generateDevelopmentPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('plan-idp', {
        body: { 
          skills: {
            technical: skills.technical.map(s => s.name),
            functional: skills.functional.map(s => s.name),
            behavioral: skills.behavioral.map(s => s.name)
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setDevelopmentPlan(data.developmentPlan);
        
        // Save skills and development plans to database
        await saveAllDataToDatabase(data.developmentPlan);
        
        setCurrentStep(2);
        setOpenSection('technical');
        
        toast({
          title: "Success",
          description: "Development plan generated and saved successfully",
        });
      }
    } catch (error) {
      console.error('Error generating development plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate development plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllDataToDatabase = async (planData: any) => {
    try {
      // Save skills first
      const skillsData = await saveSkillsToDatabase();
      
      // Save development plans for each skill
      await saveDevelopmentPlansToDatabase(skillsData, planData);
      
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  };

  const saveSkillsToDatabase = async () => {
    try {
      // Flatten all skills with their types, excluding UI-only properties
      const allSkills = [
        ...skills.technical.map(s => ({ 
          name: s.name, 
          type: s.type, 
          idp_id: idpId 
        })),
        ...skills.functional.map(s => ({ 
          name: s.name, 
          type: s.type, 
          idp_id: idpId 
        })),
        ...skills.behavioral.map(s => ({ 
          name: s.name, 
          type: s.type, 
          idp_id: idpId 
        }))
      ];

      const { data, error } = await supabase
        .from('skills')
        .insert(allSkills)
        .select();

      if (error) throw error;
      
      return data; // Return saved skills with their IDs
    } catch (error) {
      console.error('Error saving skills:', error);
      throw error;
    }
  };

  const saveDevelopmentPlansToDatabase = async (savedSkills: any[], planData: any) => {
    try {
      console.log('Saving development plans for skills:', savedSkills);
      console.log('Plan data structure:', planData);
      
      const developmentPlans = [];
      
      // Create development plan records for each skill
      for (const skill of savedSkills) {
        const skillType = skill.type as 'technical' | 'functional' | 'behavioral';
        console.log(`Looking for plan data for skill: ${skill.name} (${skillType})`);
        
        // Try exact match first
        let skillPlan = planData[skillType]?.[skill.name];
        
        // If no exact match, try to find a partial match
        if (!skillPlan && planData[skillType]) {
          const planKeys = Object.keys(planData[skillType]);
          console.log(`Available plan keys for ${skillType}:`, planKeys);
          
          // Find the best matching key
          const matchingKey = planKeys.find(key => 
            key.toLowerCase().includes(skill.name.toLowerCase().split(' ')[0]) ||
            skill.name.toLowerCase().includes(key.toLowerCase().split(' ')[0])
          );
          
          if (matchingKey) {
            console.log(`Found matching key: ${matchingKey} for skill: ${skill.name}`);
            skillPlan = planData[skillType][matchingKey];
          }
        }
        
        if (skillPlan) {
          console.log(`Adding development plan for skill: ${skill.name}`);
          developmentPlans.push({
            skill_id: skill.id,
            plan_info: skillPlan,
            progress: 'in_progress'
          });
        } else {
          console.log(`No plan found for skill: ${skill.name}, creating default plan`);
          // Create a default plan for skills without specific plans
          developmentPlans.push({
            skill_id: skill.id,
            plan_info: {
              udemy: {
                title: `${skillType.charAt(0).toUpperCase() + skillType.slice(1)} Skills Enhancement Course`,
                duration: '8 hours',
                link: 'https://udemy.com'
              },
              youtube: {
                title: `Mastering ${skillType.charAt(0).toUpperCase() + skillType.slice(1)} Skills - Complete Tutorial`,
                link: 'https://youtube.com'
              },
              reading: {
                title: `${skillType.charAt(0).toUpperCase() + skillType.slice(1)} Best Practices Guide`,
                link: 'https://docs.example.com'
              },
              tasks: [
                `Complete practical exercise on ${skill.name.split(' ').slice(0, 3).join(' ')}`,
                `Apply learnings in a real project scenario`,
                `Share knowledge with team members`,
                `Document key insights and improvements`
              ]
            },
            progress: 'in_progress'
          });
        }
      }

      console.log('Development plans to insert:', developmentPlans);

      if (developmentPlans.length > 0) {
        const { data, error } = await supabase
          .from('skill_development_plan')
          .insert(developmentPlans)
          .select();

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        
        console.log('Development plans saved successfully:', data);
      }
    } catch (error) {
      console.error('Error saving development plans:', error);
      throw error;
    }
  };

  const SkillSection = ({ type, title, icon: Icon }: { 
    type: 'technical' | 'functional' | 'behavioral'; 
    title: string; 
    icon: React.ComponentType<any>;
  }) => {
    const [newSkillName, setNewSkillName] = useState('');
    const isOpen = openSection === type;
    const isReviewed = reviewedSections.has(type);

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
                  {isReviewed && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Reviewed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{skills[type].length} skills</Badge>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {skills[type].map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{skill.name}</span>
                      {skill.isNew && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(type, index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add new skill..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill(type, newSkillName);
                        setNewSkillName('');
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addSkill(type, newSkillName);
                      setNewSkillName('');
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    AI Suggest
                  </Button>
                  {!isReviewed ? (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => markSectionReviewed(type)}
                    >
                      Mark as Reviewed
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Section Reviewed
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const getSkillProgressForSection = (type: 'technical' | 'functional' | 'behavioral', skillName: string) => {
    return skillProgress[type]?.[skillName] || 0;
  };

  const DevelopmentPlanCard = ({ skillName, plan, skillType }: { skillName: string; plan: DevelopmentPlan; skillType: 'technical' | 'functional' | 'behavioral' }) => {
    const progress = getSkillProgressForSection(skillType, skillName);
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{skillName}</span>
            <div className="flex items-center space-x-2">
              <Progress value={progress} className="w-24" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
              {progress === 100 && <CheckCircle className="w-5 h-5 text-success" />}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Udemy Course */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                Udemy Course
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <h4 className="font-medium text-sm mb-2">{plan.udemy.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{plan.udemy.duration}</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={plan.udemy.link} target="_blank" rel="noopener noreferrer">
                  View Course
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* YouTube Tutorial */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Video className="w-4 h-4 mr-2 text-red-600" />
                YouTube Tutorial
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <h4 className="font-medium text-sm mb-4">{plan.youtube.title}</h4>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={plan.youtube.link} target="_blank" rel="noopener noreferrer">
                  Watch Video
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Reading Material */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Reading Material
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <h4 className="font-medium text-sm mb-4">{plan.reading.title}</h4>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={plan.reading.link} target="_blank" rel="noopener noreferrer">
                  Read Guide
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
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
                {plan.tasks.map((task, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    {task}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      </Card>
    );
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium">Generate Skill Sets</span>
          </div>
          <div className="flex-1 h-px bg-muted"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm">
              2
            </div>
            <span className="text-sm text-muted-foreground">Development Plan</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Target className="w-6 h-6 text-primary" />
            <span>Generate Skill Sets for Next Cycle</span>
          </h2>
          
          {skills.technical.length === 0 && (
            <Button onClick={generateSkillSets} disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Skills
            </Button>
          )}
        </div>

        {skills.technical.length > 0 && (
          <>
            <SkillSection type="technical" title="Technical Skills" icon={Target} />
            <SkillSection type="functional" title="Functional Skills" icon={Lightbulb} />
            <SkillSection type="behavioral" title="Behavioral Skills" icon={CheckCircle} />

            <div className="flex justify-end pt-4">
              <Button 
                onClick={generateDevelopmentPlan} 
                disabled={loading || reviewedSections.size < 3}
                size="lg"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Generate Development Plan for New Cycle
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center text-sm">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-sm text-muted-foreground">Generate Skill Sets</span>
        </div>
        <div className="flex-1 h-px bg-success"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium">Development Plan</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold flex items-center space-x-2">
        <Target className="w-6 h-6 text-primary" />
        <span>Development Plan for Next Cycle</span>
      </h2>

      {/* Development Plan Sections */}
      {['technical', 'functional', 'behavioral'].map((type) => (
        <Card key={type} className="mb-6">
          <Collapsible 
            open={openSection === type} 
            onOpenChange={() => setOpenSection(openSection === type ? '' : type)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{type} Skills Development</span>
                  {openSection === type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                {developmentPlan[type] && Object.entries(developmentPlan[type]).map(([skillName, plan]) => (
                  <DevelopmentPlanCard key={skillName} skillName={skillName} plan={plan} skillType={type as 'technical' | 'functional' | 'behavioral'} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back to Skills
        </Button>
        <Button 
          onClick={async () => {
            try {
              await saveAllDataToDatabase(developmentPlan);
              toast({ 
                title: "Success", 
                description: "Development plan saved to database!" 
              });
            } catch (error) {
              toast({ 
                title: "Error", 
                description: "Failed to save development plan", 
                variant: "destructive" 
              });
            }
          }}
        >
          Save Development Plan
        </Button>
      </div>
    </div>
  );
};

export default SkillsDevelopment;