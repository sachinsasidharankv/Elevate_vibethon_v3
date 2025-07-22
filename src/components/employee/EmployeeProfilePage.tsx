import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, FileSpreadsheet, Plus, ExternalLink, Calendar, User, Target, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
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
  created_at: string;
}

interface IDP {
  id: string;
  name: string;
  status: string;
  created_at: string;
  created_by: string;
  appraisal_source: string;
}

const EmployeeProfilePage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [appraisals, setAppraisals] = useState<AppraisalSource[]>([]);
  const [idps, setIDPs] = useState<IDP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewIDPDialog, setShowNewIDPDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newIDPName, setNewIDPName] = useState('');
  const [selectedAppraisal, setSelectedAppraisal] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');

  useEffect(() => {
    if (employeeId && profile) {
      fetchEmployeeData();
      fetchAppraisals();
      fetchIDPs();
      
      // Set default IDP name to current month and year
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long' });
      const year = now.getFullYear();
      setNewIDPName(`${monthName} ${year}`);
    }
  }, [employeeId, profile]);

  const fetchEmployeeData = async () => {
    try {
      console.log('Fetching employee data for ID:', employeeId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Employee data fetched:', data);
      setEmployee(data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data",
        variant: "destructive",
      });
    }
  };

  const fetchAppraisals = async () => {
    try {
      const { data, error } = await supabase
        .from('appraisal_sources')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppraisals(data || []);
      
      // Set the latest appraisal as default selection
      if (data && data.length > 0) {
        setSelectedAppraisal(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching appraisals:', error);
    }
  };

  const fetchIDPs = async () => {
    try {
      const { data, error } = await supabase
        .from('idps')
        .select('*, appraisal_sources!inner(employee_id)')
        .eq('appraisal_sources.employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIDPs(data || []);
    } catch (error) {
      console.error('Error fetching IDPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIDP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIDPName || !selectedAppraisal) {
      toast({
        title: "Missing Information",
        description: "Please provide IDP name and select an appraisal source",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('idps')
        .insert({
          name: newIDPName,
          appraisal_source: selectedAppraisal,
          created_by: profile?.user_id,
          updated_by: profile?.user_id,
          status: 'initial'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "IDP created successfully",
      });

      setShowNewIDPDialog(false);
      setNewIDPName('');
      fetchIDPs();
      
      // Navigate to the new IDP page
      navigate(`/employee-profile/${employeeId}/idp/${data.id}`);
    } catch (error) {
      console.error('Error creating IDP:', error);
      toast({
        title: "Error",
        description: "Failed to create IDP",
        variant: "destructive",
      });
    }
  };

  const handleImportAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Import appraisal started', { employeeId, sheetUrl, managerId: profile?.id });
    
    if (!sheetUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a sheet URL",
        variant: "destructive",
      });
      return;
    }

    if (!employeeId) {
      toast({
        title: "Missing Information",
        description: "Employee ID not found",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Missing Information",
        description: "Manager ID not found. Please ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Inserting appraisal source:', {
        employee_id: employeeId,
        manager_id: profile.id,
        sheet_url: sheetUrl,
      });

      const { data, error } = await supabase
        .from('appraisal_sources')
        .insert({
          employee_id: employeeId,
          manager_id: profile.id,
          sheet_url: sheetUrl,
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Appraisal source inserted successfully:', data);

      toast({
        title: "Success",
        description: "Appraisal sheet imported successfully",
      });

      setShowImportDialog(false);
      setSheetUrl('');
      await fetchAppraisals();
    } catch (error) {
      console.error('Error importing appraisal:', error);
      toast({
        title: "Error",
        description: `Failed to import appraisal sheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleIDPClick = (idpId: string) => {
    navigate(`/employee-profile/${employeeId}/idp/${idpId}`);
  };

  if (loading || !employee) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  console.log('EmployeeProfilePage rendering, employee:', employee);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('Back to Dashboard clicked');
            // Use window.location for more reliable navigation
            window.location.href = '/dashboard';
          }}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Button>
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-accent text-accent-foreground text-lg">
              {employee.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">{employee.email}</p>
            <Badge variant="secondary" className="mt-1">
              {employee.role}
            </Badge>
          </div>
        </div>
        <div className="ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('Notification Settings button clicked');
              navigate('/employee/notifications');
            }}
            className="flex items-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span>Notification Settings</span>
          </Button>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue="appraisals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appraisals" className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Appraisal History</span>
          </TabsTrigger>
          <TabsTrigger value="idps" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>IDP History</span>
          </TabsTrigger>
        </TabsList>

        {/* Appraisal History Tab */}
        <TabsContent value="appraisals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Appraisal History</span>
              </CardTitle>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Import Appraisal Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Appraisal Sheet</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleImportAppraisal} className="space-y-4">
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
                      <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {appraisals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No appraisal history found</p>
                  <p className="text-sm">Import an appraisal sheet to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appraisals.map((appraisal) => (
                    <div key={appraisal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/10 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileSpreadsheet className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">Appraisal Sheet</p>
                          <p className="text-sm text-muted-foreground flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Imported on {new Date(appraisal.imported_on).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={appraisal.sheet_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Sheet
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDP History Tab */}
        <TabsContent value="idps" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>IDP History</span>
              </CardTitle>
              <Dialog open={showNewIDPDialog} onOpenChange={setShowNewIDPDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-gradient-primary hover:opacity-90"
                    disabled={appraisals.length === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New IDP
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New IDP</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateIDP} className="space-y-4">
                    <div>
                      <Label htmlFor="idpName">IDP Name</Label>
                      <Input
                        id="idpName"
                        placeholder="e.g., July 2025"
                        value={newIDPName}
                        onChange={(e) => setNewIDPName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="appraisalSource">Appraisal Source</Label>
                      <select
                        id="appraisalSource"
                        value={selectedAppraisal}
                        onChange={(e) => setSelectedAppraisal(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="">Select an appraisal...</option>
                        {appraisals.map((appraisal) => (
                          <option key={appraisal.id} value={appraisal.id}>
                            Appraisal from {new Date(appraisal.imported_on).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                        Create IDP
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowNewIDPDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {idps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No IDP history found</p>
                  <p className="text-sm">
                    {appraisals.length === 0 
                      ? "Import an appraisal first to create an IDP" 
                      : "Generate a new IDP to get started"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {idps.map((idp) => (
                    <div 
                      key={idp.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                      onClick={() => handleIDPClick(idp.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Target className="w-8 h-8 text-success" />
                        <div>
                          <p className="font-medium">{idp.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Created {new Date(idp.created_at).toLocaleDateString()}</span>
                            </span>
                            <Badge variant={idp.status === 'initial' ? 'secondary' : 'default'}>
                              {idp.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View IDP →
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeProfilePage;