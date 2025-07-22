import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Calendar, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SkillsDevelopment from './SkillsDevelopment';

interface IDP {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  appraisal_source: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

const IDPDetailPage = () => {
  const { employeeId, idpId } = useParams<{ employeeId: string; idpId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [idp, setIDP] = useState<IDP | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idpId && employeeId) {
      fetchIDPData();
      fetchEmployeeData();
    }
  }, [idpId, employeeId]);

  const fetchIDPData = async () => {
    try {
      const { data, error } = await supabase
        .from('idps')
        .select('*')
        .eq('id', idpId)
        .single();

      if (error) throw error;
      setIDP(data);
    } catch (error) {
      console.error('Error fetching IDP:', error);
      toast({
        title: "Error",
        description: "Failed to load IDP data",
        variant: "destructive",
      });
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !idp || !employee) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/employee-profile/${employeeId}`)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Target className="w-6 h-6 text-success" />
            <span>{idp.name}</span>
          </h1>
          <p className="text-muted-foreground">IDP for {employee.name}</p>
        </div>
      </div>

      {/* IDP Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>IDP Overview</span>
            </span>
            <Badge variant={idp.status === 'initial' ? 'secondary' : 'default'}>
              {idp.status.charAt(0).toUpperCase() + idp.status.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Employee</h3>
                <p className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{employee.name}</span>
                </p>
                <p className="text-sm text-muted-foreground ml-6">{employee.email}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                <Badge variant={idp.status === 'initial' ? 'secondary' : 'default'} className="mt-1">
                  {idp.status.charAt(0).toUpperCase() + idp.status.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Created</h3>
                <p className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(idp.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Last Updated</h3>
                <p className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(idp.updated_at).toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Development */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Development</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsDevelopment idpId={idp.id} appraisalSourceId={idp.appraisal_source} />
        </CardContent>
      </Card>
    </div>
  );
};

export default IDPDetailPage;