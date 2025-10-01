import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Users, Target } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useEffect, useState } from "react";

interface DashboardOverviewProps {
  coordinatorEmail: string;
}

export const DashboardOverview = ({ coordinatorEmail }: DashboardOverviewProps) => {
  const { stats, recentActivity, loading, error, fetchData } = useData();
  const [debugData, setDebugData] = useState<any>(null);

  // Retry fetching data on component mount if there's an error
  useEffect(() => {
    if (error) {
      const retry = setTimeout(() => {
        fetchData();
      }, 3000);
      return () => clearTimeout(retry);
    }
  }, [error, fetchData]);

  // Debug: Store raw data for inspection
  useEffect(() => {
    if (!loading && !error) {
      setDebugData({ stats, recentActivity });
    }
  }, [stats, recentActivity, loading, error]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "ongoing":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-info" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      ongoing: "secondary",
      pending: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back, {coordinatorEmail || "Unknown User"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="text-center py-8">
            <p className="text-destructive font-semibold">Error: {error}</p>
            <p className="text-muted-foreground mt-2">Retrying in 3 seconds...</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
              <Target className="h-4 w-4 text-forest" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalTools ?? 0}</div>
              <p className="text-xs text-muted-foreground">All research instruments</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointed</CardTitle>
              <Users className="h-4 w-4 text-earth-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.appointedTools ?? 0}</div>
              <p className="text-xs text-muted-foreground">Assigned to {coordinatorEmail || "you"}</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.evaluatedTools ?? 0}</div>
              <p className="text-xs text-muted-foreground">Assessment completed</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.ongoingTools ?? 0}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion</CardTitle>
              <Target className="h-4 w-4 text-forest" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.completionRate ?? 0}%</div>
              <Progress value={stats?.completionRate ?? 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {!loading && !error && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Recent Tool Activity</CardTitle>
            <CardDescription>Latest tools appointed to {coordinatorEmail || "you"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity found</p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-to-r from-card to-muted/20"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium text-foreground">{activity.tool}</p>
                        <p className="text-sm text-muted-foreground">Coordinator: {activity.coordinator}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(activity.status)}
                      <span className="text-sm text-muted-foreground">{activity.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Section */}
      {/* {!loading && !error && (
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Debug: Raw Data</CardTitle>
            <CardDescription>Raw data fetched for the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
};