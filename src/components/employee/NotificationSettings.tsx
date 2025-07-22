
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [medium, setMedium] = useState("email");
  const [frequency, setFrequency] = useState("2weeks");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const handleSaveSettings = () => {
    toast.success("Notification settings saved successfully!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Configure how you receive updates about your development plan progress</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Notifications</CardTitle>
          <CardDescription>
            Enable or disable notifications for your Individual Development Plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications about your development plan progress
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {notificationsEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Notification Medium</CardTitle>
              <CardDescription>
                Choose how you'd like to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medium">Preferred Medium</Label>
                <Select value={medium} onValueChange={setMedium}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification medium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="slack">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Slack
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        WhatsApp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
              <CardDescription>
                How often would you like to receive progress reminders?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Reminder Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">Every Week</SelectItem>
                    <SelectItem value="2weeks">Every 2 Weeks</SelectItem>
                    <SelectItem value="1month">Every Month</SelectItem>
                    <SelectItem value="2months">Every 2 Months</SelectItem>
                    <SelectItem value="3months">Every 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
              <CardDescription>
                Configure additional notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Progress Reminders</Label>
                  <div className="text-sm text-muted-foreground">
                    Get reminded when you haven't made progress on your skills
                  </div>
                </div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={setReminderEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Milestone Celebrations</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when you complete skills or reach milestones
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive a weekly summary of your development plan progress
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSettings;
