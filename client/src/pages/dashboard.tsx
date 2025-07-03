import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, PlayCircle, DollarSign, Clock, CheckCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface DashboardUser {
  id: number;
  username: string;
  role: string;
  tasksCompleted: number;
  totalEarnings: string;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = "/";
    }
  }, []);

  const { data: userStats } = useQuery<DashboardUser>({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });

  const handleStartTasking = () => {
    window.location.href = "/evaluate";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  const currentStats = userStats || user;
  const avgEarningsPerTask = currentStats.tasksCompleted > 0 
    ? (parseFloat(currentStats.totalEarnings) / currentStats.tasksCompleted).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tasker Dashboard</h1>
              <p className="text-sm text-slate-500">Welcome back, {user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-xs">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tasks Completed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.tasksCompleted}</div>
              <p className="text-xs text-slate-500">
                Total evaluations finished
              </p>
            </CardContent>
          </Card>

          {/* Average Time Per Task */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time Per Task</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0 min
              </div>
              <p className="text-xs text-slate-500">
                Average completion time
              </p>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${currentStats.tasksCompleted > 0 ? currentStats.totalEarnings : "0.00"}
              </div>
              <p className="text-xs text-slate-500">
                ${avgEarningsPerTask} per task
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Start Tasking Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlayCircle className="h-5 w-5 text-blue-600" />
              <span>Ready to Start Evaluating?</span>
            </CardTitle>
            <CardDescription>
              Begin a new AI response evaluation task. Each task contains 3 prompts and responses 
              that you'll rate across 5 criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleStartTasking}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Tasking
            </Button>
          </CardContent>
        </Card>


      </main>
    </div>
  );
}