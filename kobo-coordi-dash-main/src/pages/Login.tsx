import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { getApiUrl } from "@/config/apiConfig";
import { DataContext } from "@/context/DataContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dataContext = useContext(DataContext);

  if (!dataContext) {
    throw new Error("Login must be used within a DataProvider");
  }

  const { setData } = dataContext;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fetch main form submissions
      const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"));
      if (!mainRes.ok) {
        throw new Error(`Failed to fetch main form: ${mainRes.status} ${mainRes.statusText}`);
      }
      const mainData = await mainRes.json();
      const mainSubs = mainData.results || [];

      // Fetch change coordinator submissions
      const changeRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.change_coordinator}/data.json`, "changeCoordinator"));
      if (!changeRes.ok) {
        throw new Error(`Failed to fetch change form: ${changeRes.status} ${changeRes.statusText}`);
      }
      const changeData = await changeRes.json();
      const changeSubs = changeData.results || [];

      // Fetch evaluation forms
      const evalSubs = {
        advanced3: [],
        early3: [],
        advanced4: [],
        early4: [],
      };
      const formMap = {
        advanced3: { id: KOBO_CONFIG.USERTYPE3_FORMS.advance_stage, label: "advanced3" },
        early3: { id: KOBO_CONFIG.USERTYPE3_FORMS.early_stage, label: "early3" },
        advanced4: { id: KOBO_CONFIG.USERTYPE4_FORMS.advance_stage, label: "advanced4" },
        early4: { id: KOBO_CONFIG.USERTYPE4_FORMS.early_stage, label: "early4" },
      };

      for (const key in formMap) {
        const { id: fid, label } = formMap[key as keyof typeof formMap];
        const res = await fetch(getApiUrl(`assets/${fid}/data.json`, label));
        if (!res.ok) throw new Error(`Failed to fetch form ${key}`);
        const data = await res.json();
        evalSubs[key as keyof typeof evalSubs] = data.results || [];
      }

      // Sort changes by submission time ascending
      changeSubs.sort((a, b) => 
        new Date(a._submission_time).getTime() - new Date(b._submission_time).getTime()
      );

      // Build current coordinators map
      const currentCoord: Record<string, string> = {};
      mainSubs.forEach((sub: any) => {
        if (sub.coordinator_email) {
          currentCoord[sub[KOBO_CONFIG.TOOL_ID_FIELD]] = sub.coordinator_email;
        }
      });
      changeSubs.forEach((ch: any) => {
        const toolId = ch.tool_id;
        const newEmail = ch.Email_of_the_Coordinator;
        if (toolId && newEmail) {
          currentCoord[toolId] = newEmail;
        }
      });

      // Check if email is a coordinator
      const coordinators = new Set(Object.values(currentCoord));
      if (!coordinators.has(email)) {
        toast({
          title: "Access Denied",
          description: "Email not registered as a coordinator.",
          variant: "destructive",
        });
        return;
      }

      // Store email and data in context
      localStorage.setItem("coordinatorEmail", email);
      setData({ mainSubs, changeSubs, evalSubs, coordinatorEmail: email });

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to server or fetch data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-light via-background to-earth-blue-light p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-forest to-primary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">MDII Coordinator Portal</CardTitle>
            <CardDescription className="text-muted-foreground">
              CGIAR Research Tools Dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Coordinator Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-forest to-primary hover:from-forest/90 hover:to-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Connecting to KoBo..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;