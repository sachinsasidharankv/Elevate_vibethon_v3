import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, FileText, TrendingUp, Brain, Target, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface AppraisalSource {
  id: string;
  sheet_url: string;
  imported_on: string;
}

interface IDP {
  id: string;
  name: string;
  status: string;
}

const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [manager, setManager] = useState<Manager | null>(null);
  const [appraisals, setAppraisals] = useState<AppraisalSource[]>([]);
  const [appraisalIdps, setAppraisalIdps] = useState<Record<string, IDP>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchManagerAndAppraisals();
    }
  }, [profile]);

  const fetchManagerAndAppraisals = async () => {
    try {
      // Fetch manager details
      if (profile?.manager_id) {
        const { data: managerData, error: managerError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', profile.manager_id)
          .single();

        if (managerError) {
          console.error('Error fetching manager:', managerError);
        } else {
          setManager(managerData);
        }
      }

      // Fetch appraisals
      const { data: appraisalData, error: appraisalError } = await supabase
        .from('appraisal_sources')
        .select('*')
        .eq('employee_id', profile?.id);

      if (appraisalError) {
        console.error('Error fetching appraisals:', appraisalError);
      } else {
        setAppraisals(appraisalData || []);
        
        // Fetch IDPs for each appraisal
        if (appraisalData && appraisalData.length > 0) {
          await fetchIDPsForAppraisals(appraisalData);
        }
      }
    } catch (error) {
      console.error('Error in fetchManagerAndAppraisals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIDPsForAppraisals = async (appraisalData: AppraisalSource[]) => {
    try {
      const appraisalIds = appraisalData.map(a => a.id);
      const { data: idpData, error } = await supabase
        .from('idps')
        .select('id, name, status, appraisal_source')
        .in('appraisal_source', appraisalIds);

      if (error) {
        console.error('Error fetching IDPs:', error);
      } else if (idpData) {
        const idpMap: Record<string, IDP> = {};
        idpData.forEach(idp => {
          idpMap[idp.appraisal_source] = idp;
        });
        setAppraisalIdps(idpMap);
      }
    } catch (error) {
      console.error('Error in fetchIDPsForAppraisals:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile & Manager Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {profile?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{profile?.name}</h3>
                <p className="text-muted-foreground">{profile?.email}</p>
                <Badge variant="secondary" className="capitalize">
                  {profile?.role}
                </Badge>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Member since</span>
                <span className="text-sm">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last updated</span>
                <span className="text-sm">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>My Manager</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manager ? (
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                    {manager.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{manager.name}</h3>
                  <p className="text-muted-foreground">{manager.email}</p>
                  <Badge variant="outline">Manager</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No manager assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Development Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appraisals</p>
                <p className="text-2xl font-bold">{appraisals.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Goals Progress</p>
                <p className="text-2xl font-bold">75%</p>
              </div>
              <Target className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Insights</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Brain className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Appraisal Sheets - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>My Appraisal Sheets & Development Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appraisals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No appraisal sheets available</p>
              <p className="text-sm mt-1">Your manager will import your appraisal data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appraisals.map((appraisal) => {
                const hasIDP = appraisalIdps[appraisal.id];
                return (
                  <div key={appraisal.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Performance Review</p>
                        <p className="text-sm text-muted-foreground">
                          Imported on {new Date(appraisal.imported_on).toLocaleDateString()}
                        </p>
                        {hasIDP && (
                          <p className="text-sm text-primary mt-1">
                            IDP Plan: {hasIDP.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    
                    {hasIDP && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/employee/idp/${hasIDP.id}`)}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View IDP Plan
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Progress Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Progress tracking feature coming soon</p>
            <p className="text-sm mt-1">Track your goals and achievements over time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;