import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, FileSpreadsheet, Brain, Plus, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AppraisalSource {
  id: string;
  sheet_url: string;
  imported_on: string;
  employee: {
    name: string;
    email: string;
  };
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [appraisals, setAppraisals] = useState<AppraisalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');

  useEffect(() => {
    if (profile) {
      fetchTeamMembers();
      fetchAppraisals();
    }
  }, [profile]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', profile?.id)
        .eq('role', 'employee');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    }
  };

  const fetchAppraisals = async () => {
    try {
      const { data, error } = await supabase
        .from('appraisal_sources')
        .select(`
          *,
          employee:profiles!appraisal_sources_employee_id_fkey(name, email)
        `)
        .eq('manager_id', profile?.id);

      if (error) throw error;
      setAppraisals(data || []);
    } catch (error) {
      console.error('Error fetching appraisals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee || !sheetUrl) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and provide a sheet URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appraisal_sources')
        .insert({
          employee_id: selectedEmployee,
          manager_id: profile?.id,
          sheet_url: sheetUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appraisal sheet imported successfully",
      });

      setShowImportForm(false);
      setSelectedEmployee('');
      setSheetUrl('');
      fetchAppraisals();
    } catch (error) {
      console.error('Error importing appraisal:', error);
      toast({
        title: "Error",
        description: "Failed to import appraisal sheet",
        variant: "destructive",
      });
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appraisals</p>
                <p className="text-2xl font-bold">{appraisals.length}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Insights</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Brain className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>My Team</span>
          </CardTitle>
          <Button 
            onClick={() => setShowImportForm(true)}
            size="sm"
            className="bg-gradient-primary hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Appraisal
          </Button>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        <Badge variant="secondary" className="mt-1">
                          Employee
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/employee-profile/${member.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        <Brain className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Appraisal Form */}
      {showImportForm && (
        <Card>
          <CardHeader>
            <CardTitle>Import Appraisal Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportAppraisal} className="space-y-4">
              <div>
                <Label htmlFor="employee">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sheetUrl">Google Sheet URL</Label>
                <Input
                  id="sheetUrl"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/..."
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                  Import Sheet
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowImportForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Appraisals */}
      {appraisals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span>Recent Appraisals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appraisals.slice(0, 5).map((appraisal) => (
                <div key={appraisal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{appraisal.employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Imported on {new Date(appraisal.imported_on).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={appraisal.sheet_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagerDashboard;