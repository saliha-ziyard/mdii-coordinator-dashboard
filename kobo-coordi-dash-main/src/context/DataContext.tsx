import React, { createContext, useContext, useState, useEffect } from "react";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { getApiUrl } from "@/config/apiConfig";

// Define interfaces
interface Submission {
  tool_id?: string;
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

interface Tool {
  id: string;
  name: string;
  status: string;
  ut3Submissions: number;
  ut4Submissions: number;
  coordinator: string;
  maturityLevel: "advanced" | "early" | null;
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
  tools: Tool[];
  coordinatorEmail: string;
  setData: (data: {
    mainSubs: Submission[];
    changeSubs: Submission[];
    evalSubs: EvalSubs;
    coordinatorEmail: string;
  }) => void;
  setTools: (tools: Tool[] | ((prev: Tool[]) => Tool[])) => void; // Added setTools to the interface
  fetchData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>({
    totalTools: 0,
    appointedTools: 0,
    evaluatedTools: 0,
    ongoingTools: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [coordinatorEmail, setCoordinatorEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("coordinatorEmail");
    if (email) {
      setCoordinatorEmail(email);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch main form
      const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"));
      if (!mainRes.ok) throw new Error("Failed to fetch main form");
      const mainData = await mainRes.json();
      const mainSubs: Submission[] = mainData.results || [];

      // Fetch change coordinator form
      const changeRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.change_coordinator}/data.json`, "changeCoordinator"));
      if (!changeRes.ok) throw new Error("Failed to fetch change form");
      const changeData = await changeRes.json();
      const changeSubs: Submission[] = changeData.results || [];

      // Fetch evaluation forms
      const evalSubs: EvalSubs = {
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
        evalSubs[key as keyof EvalSubs] = data.results || [];
      }

      // Process the fetched data
      setData({ mainSubs, changeSubs, evalSubs, coordinatorEmail });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const processData = (
    mainSubs: Submission[],
    changeSubs: Submission[],
    evalSubs: EvalSubs,
    email: string
  ) => {
    try {
      // Sort change submissions by submission time
      changeSubs.sort((a, b) => new Date(a._submission_time).getTime() - new Date(b._submission_time).getTime());

      // Build current coordinators map and appointment times
      const currentCoord: { [key: string]: string } = {};
      const appointmentTimes: { [key: string]: Date } = {};
      const maturityLevels: { [key: string]: "advanced" | "early" | null } = {};
      mainSubs.forEach((sub) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        if (sub.coordinator_email) {
          currentCoord[toolId] = sub.coordinator_email;
          appointmentTimes[toolId] = new Date(sub._submission_time);
          maturityLevels[toolId] = sub[KOBO_CONFIG.MATURITY_FIELD] || null;
        }
      });
      changeSubs.forEach((ch) => {
        const toolId = ch.tool_id;
        const newEmail = ch.Email_of_the_Coordinator;
        if (toolId && newEmail) {
          currentCoord[toolId] = newEmail;
          appointmentTimes[toolId] = new Date(ch._submission_time);
        }
      });

      // Calculate total tools
      const totalTools = mainSubs.length;

      // Calculate appointed tools for the current coordinator
      const appointedToolsCount = Object.entries(currentCoord).filter(
        ([_, coordEmail]) => coordEmail === email
      ).length;

      // Helper to extract tool_id from evaluation submissions
      const getToolId = (sub: Submission): string => {
        return String(
          sub["group_intro/Q_13110000"] ||
          sub["group_requester/Q_13110000"] ||
          sub["Q_13110000"] ||
          sub.tool_id ||
          ""
        ).trim();
      };

      // Create sets of tool_ids with submissions
      const advanced3 = new Set(evalSubs.advanced3.map(getToolId));
      const early3 = new Set(evalSubs.early3.map(getToolId));
      const advanced4 = new Set(evalSubs.advanced4.map(getToolId));
      const early4 = new Set(evalSubs.early4.map(getToolId));

      // Process tools for stats and recent activity
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
        if (!coord || coord !== email) return; // Only process tools for this coordinator

        const maturity = sub[KOBO_CONFIG.MATURITY_FIELD];
        let has3 = false;
        let has4 = false;
        let allEvalForTool: Submission[] = [];

        if (maturity === "advanced") {
          has3 = advanced3.has(toolId);
          has4 = advanced4.has(toolId);
          allEvalForTool = [
            ...evalSubs.advanced3.filter((s) => getToolId(s) === toolId),
            ...evalSubs.advanced4.filter((s) => getToolId(s) === toolId),
          ];
        } else if (maturity === "early") {
          has3 = early3.has(toolId);
          has4 = early4.has(toolId);
          allEvalForTool = [
            ...evalSubs.early3.filter((s) => getToolId(s) === toolId),
            ...evalSubs.early4.filter((s) => getToolId(s) === toolId),
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

      // Calculate completion rate
      const completionRate = appointedToolsCount > 0 ? Math.round((evaluated / appointedToolsCount) * 100) : 0;

      // Recent activity: last 3 tools appointed to this coordinator
      const appointedIds = Object.entries(currentCoord)
        .filter(([_, coordEmail]) => coordEmail === email)
        .map(([id]) => id);
      let activities: Activity[] = appointedIds.map((id) => ({
        id,
        tool: toolMap[id]?.[KOBO_CONFIG.TOOL_NAME_FIELD] || "Unknown Tool",
        status: toolStatus[id] || "pending",
        date: (appointmentTimes[id] || lastTimes[id]).toLocaleDateString("en-CA"),
        coordinator: currentCoord[id],
      }));
      activities.sort((a, b) =>
        (appointmentTimes[b.id] || lastTimes[b.id]).getTime() -
        (appointmentTimes[a.id] || lastTimes[a.id]).getTime()
      );
      const recent = activities.slice(0, 3);

      // Process tools for ToolSearch
      const submissionCounts: { [key: string]: { ut3: number; ut4: number } } = {};
      mainSubs.forEach((sub: any) => {
        const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
        const maturity = sub[KOBO_CONFIG.MATURITY_FIELD];
        let ut3Subs = 0;
        let ut4Subs = 0;

        if (maturity === "advanced") {
          ut3Subs = evalSubs.advanced3.filter((s: any) => getToolId(s) === toolId).length;
          ut4Subs = evalSubs.advanced4.filter((s: any) => getToolId(s) === toolId).length;
        } else if (maturity === "early") {
          ut3Subs = evalSubs.early3.filter((s: any) => getToolId(s) === toolId).length;
          ut4Subs = evalSubs.early4.filter((s: any) => getToolId(s) === toolId).length;
        }

        submissionCounts[toolId] = { ut3: ut3Subs, ut4: ut4Subs };
      });

      const appointedTools = mainSubs
        .filter((sub: any) => currentCoord[sub[KOBO_CONFIG.TOOL_ID_FIELD]] === email)
        .map((sub: any) => {
          const toolId = sub[KOBO_CONFIG.TOOL_ID_FIELD];
          return {
            id: toolId,
            name: sub[KOBO_CONFIG.TOOL_NAME_FIELD] || "Unknown Tool",
            status: toolStatus[toolId] || "active",
            ut3Submissions: submissionCounts[toolId]?.ut3 || 0,
            ut4Submissions: submissionCounts[toolId]?.ut4 || 0,
            coordinator: currentCoord[toolId],
            maturityLevel: maturityLevels[toolId],
          };
        });

      setStats({ totalTools, appointedTools: appointedToolsCount, evaluatedTools: evaluated, ongoingTools: ongoing, completionRate });
      setRecentActivity(recent);
      setTools(appointedTools);
      setCoordinatorEmail(email);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process data");
      setLoading(false);
    }
  };

  const setData = (data: {
    mainSubs: Submission[];
    changeSubs: Submission[];
    evalSubs: EvalSubs;
    coordinatorEmail: string;
  }) => {
    setLoading(true);
    processData(data.mainSubs, data.changeSubs, data.evalSubs, data.coordinatorEmail);
  };

  return (
    <DataContext.Provider value={{ stats, recentActivity, tools, coordinatorEmail, setData, setTools, fetchData, loading, error }}>
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