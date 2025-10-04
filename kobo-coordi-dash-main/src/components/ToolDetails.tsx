import { useState, useEffect } from "react";
import { Search, FileText, Calendar, User, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { getApiUrl } from "@/config/apiConfig";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { Loader } from "@/components/Loader";

interface ToolDetailsData {
  id: string;
  name: string;
  coordinator: string;
  status: string;
  createdDate: string;
  location: string;
  description: string;
  submissions: {
    ut3: Submission[];
    ut4: Submission[];
    general: Submission[];
  };
}

interface Submission {
  id: string;
  submittedBy: string;
  submissionDate: string;
  responses: { [key: string]: string };
}

// export function ToolDetails() {
//   const [toolId, setToolId] = useState("");
//   const [selectedTool, setSelectedTool] = useState<ToolDetailsData | null>(null);
//   const [activeSubmissionType, setActiveSubmissionType] = useState<string>("ut3");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { coordinatorEmail } = useData();

//   const handleSearch = async () => {
//     if (!toolId) {
//       setError("Please enter a Tool ID");
//       setSelectedTool(null);
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       // Fetch main form data to get tool details
//       const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"));
//       if (!mainRes.ok) throw new Error("Failed to fetch tool data");
//       const mainData = await mainRes.json();
//       const mainSubs = mainData.results || [];

//       // Find the tool by ID
//       const tool = mainSubs.find((sub: any) => sub[KOBO_CONFIG.TOOL_ID_FIELD] === toolId);
//       if (!tool) {
//         setError(`No tool found with ID: ${toolId}`);
//         setSelectedTool(null);
//         return;
//       }

//       // Fetch change coordinator data to get the latest coordinator
//       const changeRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.change_coordinator}/data.json`, "changeCoordinator"));
//       if (!changeRes.ok) throw new Error("Failed to fetch coordinator changes");
//       const changeData = await changeRes.json();
//       const changeSubs = changeData.results || [];

//       // Determine current coordinator
//       let coordinator = tool.coordinator_email || coordinatorEmail;
//       const latestChange = changeSubs
//         .filter((ch: any) => ch.tool_id === toolId)
//         .sort((a: any, b: any) => new Date(b._submission_time).getTime() - new Date(a._submission_time).getTime())[0];
//       if (latestChange && latestChange.Email_of_the_Coordinator) {
//         coordinator = latestChange.Email_of_the_Coordinator;
//       }

//       // Fetch submissions for the tool
//       const formMap = {
//         ut3: tool[KOBO_CONFIG.MATURITY_FIELD] === "advanced" ? KOBO_CONFIG.USERTYPE3_FORMS.advanced : KOBO_CONFIG.USERTYPE3_FORMS.early,
//         ut4: tool[KOBO_CONFIG.MATURITY_FIELD] === "advanced" ? KOBO_CONFIG.USERTYPE4_FORMS.advanced : KOBO_CONFIG.USERTYPE4_FORMS.early,
//         general: KOBO_CONFIG.MAIN_FORM_ID,
//       };

//       const submissions: ToolDetailsData["submissions"] = { ut3: [], ut4: [], general: [] };
//       for (const [type, formId] of Object.entries(formMap)) {
//         const res = await fetch(getApiUrl(`assets/${formId}/data.json`, type));
//         if (!res.ok) throw new Error(`Failed to fetch ${type} submissions`);
//         const data = await res.json();
//         const subs = (data.results || [])
//           .filter((sub: any) => sub.tool_id === toolId)
//           .map((sub: any) => ({
//             id: sub._id || `SUB-${type}-${sub._submission_time}`,
//             submittedBy: sub.submitted_by || "Unknown",
//             submissionDate: new Date(sub._submission_time).toLocaleString(),
//             responses: Object.fromEntries(
//               Object.entries(sub).filter(([key]) => !key.startsWith("_") && key !== "tool_id")
//             ),
//           }));
//         submissions[type as keyof typeof submissions] = subs;
//       }

//       // Construct tool details
//       const toolDetails: ToolDetailsData = {
//         id: toolId,
//         name: tool[KOBO_CONFIG.TOOL_NAME_FIELD] || "Unknown Tool",
//         coordinator,
//         status: tool.status || "Unknown",
//         createdDate: new Date(tool._submission_time).toLocaleDateString(),
//         location: tool.location || "Not specified",
//         description: tool.description || "No description available",
//         submissions,
//       };

//       setSelectedTool(toolDetails);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to fetch tool details");
//       setSelectedTool(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       handleSearch();
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center gap-4">
//         <h1 className="text-3xl font-bold text-foreground">Tool Details</h1>
//       </div>

//       {/* Tool ID Input */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Search className="w-5 h-5" />
//             Search Tool by ID
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex gap-2">
//             <Input
//               placeholder="Enter Tool ID (e.g., TOOL001)"
//               value={toolId}
//               onChange={(e) => setToolId(e.target.value)}
//               onKeyPress={handleKeyPress}
//               className="flex-1"
//               disabled={loading}
//             />
//             <Button onClick={handleSearch} disabled={loading}>
//               <Search className="w-4 h-4 mr-2" />
//               {loading ? "Searching..." : "Search"}
//             </Button>
//           </div>
//           {error && (
//             <p className="text-destructive text-sm mt-2">{error}</p>
//           )}
//         </CardContent>
//       </Card>

//       {/* Loader for fetching state */}
//       {loading && (
//         <Card>
//           <CardContent className="flex justify-center py-8">
//             <Loader />
//           </CardContent>
//         </Card>
//       )}

//       {/* Tool Information */}
//       {!loading && selectedTool && (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="w-5 h-5" />
//                 Tool Information
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <h3 className="font-semibold text-foreground">Tool Name</h3>
//                   <p className="text-muted-foreground">{selectedTool.name}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-foreground">Status</h3>
//                   <Badge variant={selectedTool.status === "Active" ? "default" : "secondary"}>
//                     {selectedTool.status}
//                   </Badge>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-foreground flex items-center gap-2">
//                     <User className="w-4 h-4" />
//                     Coordinator
//                   </h3>
//                   <p className="text-muted-foreground">{selectedTool.coordinator}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-foreground flex items-center gap-2">
//                     <Calendar className="w-4 h-4" />
//                     Created Date
//                   </h3>
//                   <p className="text-muted-foreground">{selectedTool.createdDate}</p>
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-foreground flex items-center gap-2">
//                     <MapPin className="w-4 h-4" />
//                     Location
//                   </h3>
//                   <p className="text-muted-foreground">{selectedTool.location}</p>
//                 </div>
//               </div>
//               <div>
//                 <h3 className="font-semibold text-foreground">Description</h3>
//                 <p className="text-muted-foreground">{selectedTool.description}</p>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Submissions */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Submissions</CardTitle>
//               <div className="flex gap-2">
//                 {Object.keys(selectedTool.submissions).map((type) => (
//                   <Button
//                     key={type}
//                     variant={activeSubmissionType === type ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => setActiveSubmissionType(type)}
//                   >
//                     {type.toUpperCase()} ({selectedTool.submissions[type].length})
//                   </Button>
//                 ))}
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {selectedTool.submissions[activeSubmissionType].length === 0 ? (
//                   <p className="text-muted-foreground text-center py-8">
//                     No {activeSubmissionType.toUpperCase()} submissions found
//                   </p>
//                 ) : (
//                   selectedTool.submissions[activeSubmissionType].map((submission: Submission) => (
//                     <Card key={submission.id} className="border-l-4 border-l-forest">
//                       <CardHeader className="pb-3">
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <h4 className="font-semibold">{submission.id}</h4>
//                             <p className="text-sm text-muted-foreground">
//                               Submitted by: {submission.submittedBy}
//                             </p>
//                           </div>
//                           <Badge variant="outline">{submission.submissionDate}</Badge>
//                         </div>
//                       </CardHeader>
//                       <CardContent className="pt-0">
//                         <div className="space-y-2">
//                           {Object.entries(submission.responses).map(([question, answer]) => (
//                             <div key={question}>
//                               <p className="font-medium text-sm">{question}:</p>
//                               <p className="text-muted-foreground text-sm ml-4">{answer}</p>
//                             </div>
//                           ))}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </>
//       )}

//       {/* No Tool Found */}
//       {!loading && toolId && !selectedTool && !error && (
//         <Card>
//           <CardContent className="text-center py-8">
//             <p className="text-muted-foreground">
//               No tool found with ID: <span className="font-mono">{toolId}</span>
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

export function ToolDetails() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Tool Details</h1>
      </div>
      <iframe
        src="https://mdii-coordinator-panel.vercel.app/"
        title="MDII Coordinator Panel"
        width="100%"
        height="600px" // Adjust height as needed
        style={{ border: "none" }}
        allowFullScreen
      />
    </div>
  );
}