import React from 'react';
import { Helmet } from 'react-helmet';
import { ProfileSettings } from '@/components/profile-settings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';

export default function AdminProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Profile Settings | Exam Management System</title>
        <meta name="description" content="Manage your admin account settings, update your profile information and password." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="view">View Profile</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          </TabsList>
          
          {/* View Profile Tab */}
          <TabsContent value="view" className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center p-6 bg-slate-950 rounded-md text-white">
                  <Avatar className="h-24 w-24 mb-4 bg-slate-800">
                    <AvatarImage src={user?.profileImage || ""} alt={user?.name || "Admin"} />
                    <AvatarFallback className="text-3xl">
                      {user?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold">{user?.name || "Admin User"}</h2>
                  <p className="text-slate-300">{user?.email || "admin@example.com"}</p>
                  <p className="text-sm text-slate-400 mt-1 bg-slate-800 px-3 py-1 rounded-full">Administrator</p>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                        <p>Administrator</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                        <p>Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Edit Profile Tab */}
          <TabsContent value="edit">
            <ProfileSettings 
              userRole="admin"
              profileEndpoint="/api/users/profile"
              notificationEndpoint="/api/users/notifications"
              passwordEndpoint="/api/users/password"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}