import React, { createContext, useContext, useState, useEffect } from "react";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { getApiUrl } from "@/config/apiConfig";

// Define interfaces
interface Submission {
  tool_id: string;
  _submission_time: string;
  coordinator_email?: string;
  Email_of_the_Coordinator?: string;
  [key: string]: any;
}

interface EvalSubs {
  advanced3: Submission[];
  early3: Submission[];
  advanced4: Submission[];
  early4: Submission[];
}

interface Activity {
  id: string;
  tool: string;
  status: string;
  date: string;
  coordinator: string;
}

interface Stats {
  totalTools: number;
  appointedTools: number;
  evaluatedTools: number;
  ongoingTools: number;
  completionRate: number;
}

interface DataContextType {
  stats: Stats;
  recentActivity: Activity[];
  coordinatorEmail: string;
  fetchData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>({
    totalTools: 0,
    appointedTools: 0,
    evaluatedTools: 0,
    ongoingTools: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [coordinatorEmail, setCoordinatorEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("coordinatorEmail");
    if (email) {
      setCoordinatorEmail(email);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch main form via proxy with custom label
      const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"));
      if (!mainRes.ok) throw new Error("Failed to fetch main form");
      const mainData = await mainRes.json();
      const mainSubs: Submission[] = mainData.results || [];

      // Fetch change coordinator via proxy with custom label
      const changeRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.change_coordinator}/data.json`, "changeCoordinator"));
      if (!changeRes.ok) throw new Error("Failed to fetch change form");
      const changeData = await changeRes.json();
      const changeSubs: Submission[] = changeData.results || [];

      // Sort changes ascending by submission time
      changeSubs.sort((a, b) => new Date(a._submission_time).getTime() - new Date(b._submission_time).getTime());

      // Build currentCoord map and track appointment times
      const currentCoord: { [key: string]: string } = {};
      const appointmentTimes: { [key: string]: Date } = {};
      mainSubs.forEach((sub) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        if (sub.coordinator_email) {
          currentCoord[toolId] = sub.coordinator_email;
          appointmentTimes[toolId] = new Date(sub._submission_time);
        }
      });
      changeSubs.forEach((ch) => {
        const toolId = ch.tool_id;
        const newEmail = ch.Email_of_the_Coordinator; // Corrected field name
        if (toolId && newEmail) {
          currentCoord[toolId] = newEmail;
          appointmentTimes[toolId] = new Date(ch._submission_time);
        }
      });

      // Calculate total tools (all tools from main form)
      const totalTools = mainSubs.length;

      // Calculate appointed tools for the current coordinator
      const appointedTools = Object.entries(currentCoord).filter(([_, email]) => email === coordinatorEmail).length;

      // Fetch evaluation forms via proxy with custom labels
      const evalSubs: EvalSubs = {
        advanced3: [],
        early3: [],
        advanced4: [],
        early4: [],
      };
      const formMap = {
        advanced3: { id: KOBO_CONFIG.USERTYPE3_FORMS.advanced, label: "advanced3" },
        early3: { id: KOBO_CONFIG.USERTYPE3_FORMS.early, label: "early3" },
        advanced4: { id: KOBO_CONFIG.USERTYPE4_FORMS.advanced, label: "advanced4" },
        early4: { id: KOBO_CONFIG.USERTYPE4_FORMS.early, label: "early4" },
      };

      for (const key in formMap) {
        const { id: fid, label } = formMap[key as keyof typeof formMap];
        const res = await fetch(getApiUrl(`assets/${fid}/data.json`, label));
        if (!res.ok) throw new Error(`Failed to fetch form ${key}`);
        const data = await res.json();
        evalSubs[key as keyof EvalSubs] = data.results || [];
      }

      // Create sets of tool_ids with submissions
      const advanced3 = new Set(evalSubs.advanced3.map((sub) => sub.tool_id));
      const early3 = new Set(evalSubs.early3.map((sub) => sub.tool_id));
      const advanced4 = new Set(evalSubs.advanced4.map((sub) => sub.tool_id));
      const early4 = new Set(evalSubs.early4.map((sub) => sub.tool_id));

      // Process tools
      let evaluated = 0;
      let ongoing = 0;
      const toolMap: { [key: string]: Submission } = {};
      const toolStatus: { [key: string]: string } = {};
      const lastTimes: { [key: string]: Date } = {};
      mainSubs.forEach((sub) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        toolMap[toolId] = sub;
        lastTimes[toolId] = appointmentTimes[toolId] || new Date(sub._submission_time);

        const coord = currentCoord[toolId];
        if (!coord || coord !== coordinatorEmail) return; // Only process tools for this coordinator

        const maturity = sub[KOBO_CONFIG.MATURITY_FIELD];
        let has3 = false;
        let has4 = false;
        let allEvalForTool: Submission[] = [];

        if (maturity === "advanced") {
          has3 = advanced3.has(toolId);
          has4 = advanced4.has(toolId);
          allEvalForTool = [
            ...evalSubs.advanced3.filter((s) => s.tool_id === toolId),
            ...evalSubs.advanced4.filter((s) => s.tool_id === toolId),
          ];
        } else if (maturity === "early") {
          has3 = early3.has(toolId);
          has4 = early4.has(toolId);
          allEvalForTool = [
            ...evalSubs.early3.filter((s) => s.tool_id === toolId),
            ...evalSubs.early4.filter((s) => s.tool_id === toolId),
          ];
        } else {
          return; // Skip unknown maturity
        }

        let status = "pending";
        if (has3 && has4) {
          status = "completed";
          evaluated++;
        } else if (has3 || has4) {
          status = "ongoing";
          ongoing++;
        }
        toolStatus[toolId] = status;

        // Update last time with evaluation times if available
        if (allEvalForTool.length > 0) {
          const maxTime = allEvalForTool.reduce((max, s) => {
            const d = new Date(s._submission_time);
            return d > max ? d : max;
          }, lastTimes[toolId]);
          lastTimes[toolId] = maxTime;
        }
      });

      // Calculate completion rate based on evaluated tools out of appointed tools
      const completionRate = appointedTools > 0 ? Math.round((evaluated / appointedTools) * 100) : 0;

      // Recent activity: last 3 tools appointed to this coordinator
      const appointedIds = Object.entries(currentCoord)
        .filter(([_, email]) => email === coordinatorEmail)
        .map(([id]) => id);
      let activities: Activity[] = appointedIds.map((id) => ({
        id,
        tool: toolMap[id][KOBO_CONFIG.TOOL_NAME_FIELD] || "Unknown Tool",
        status: toolStatus[id] || "pending",
        date: (appointmentTimes[id] || lastTimes[id]).toLocaleDateString("en-CA"),
        coordinator: currentCoord[id],
      }));
      // Sort by appointment time (most recent first)
      activities.sort((a, b) => 
        (appointmentTimes[b.id] || lastTimes[b.id]).getTime() - 
        (appointmentTimes[a.id] || lastTimes[a.id]).getTime()
      );
      const recent = activities.slice(0, 3); // Last 3 tools appointed to this coordinator

      setStats({ totalTools, appointedTools, evaluatedTools: evaluated, ongoingTools: ongoing, completionRate });
      setRecentActivity(recent);
    } catch (error) {
      setError(error.message || "Failed to fetch data");
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{ stats, recentActivity, coordinatorEmail, fetchData, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};