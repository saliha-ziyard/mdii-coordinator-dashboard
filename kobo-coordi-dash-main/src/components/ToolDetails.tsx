import { useState, useEffect } from "react";
import { Search, FileText, Calendar, User, MapPin, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { getApiUrl } from "@/config/apiConfig";
import { KOBO_CONFIG } from "@/config/koboConfig";
import { Loader } from "@/components/Loader";
import DataTable from "./DataTable";

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

export function ToolDetails() {
  const { tools, coordinatorEmail } = useData()
  const [selectedTool, setSelectedTool] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toolData, setToolData] = useState(null)

  const fetchToolData = async (toolId) => {
    setLoading(true)
    setError(null)
    setToolData(null)

    try {
      // Fetch maturity level
      const mainRes = await fetch(getApiUrl(`assets/${KOBO_CONFIG.MAIN_FORM_ID}/data.json`, "mainForm"))
      const mainData = await mainRes.json()
      const toolInfo = mainData.results.find(r => r[KOBO_CONFIG.TOOL_ID_FIELD] === toolId)
      
      if (!toolInfo) {
        throw new Error("Tool not found")
      }

      const maturity = toolInfo[KOBO_CONFIG.MATURITY_FIELD]
if (!maturity || (maturity !== 'advance_stage' && maturity !== 'early_stage')) {
  throw new Error(`Invalid maturity level: ${maturity}. Expected 'advance_stage' or 'early_stage'`)
}

      // Fetch innovator forms
      const innovatorData = await Promise.all(
  Object.entries(KOBO_CONFIG.INNOVATOR_FORMS).map(async ([role, formId]) => {  // ✅ Correct - using INNOVATOR_FORMS
    const res = await fetch(getApiUrl(`assets/${formId}/data.json`, role))
    const data = await res.json()
    const matching = data.results.filter(r => 
      String(r["group_intro/Q_13110000"] || r["group_requester/Q_13110000"] || "").trim() === toolId
    )
    return {
      role: role === 'projectManager' ? 'Project Manager' : 
            role === 'leadership' ? 'Leadership' : 
            role === 'technical' ? 'Technical' : role,
      submitted: matching.length > 0,
      count: matching.length
    }
  })
)

      // Fetch domain experts
// Fetch domain experts
let domainExpertData = KOBO_CONFIG.DOMAIN_CATEGORIES[maturity].map(category => ({
  category,
  submitted: false,
  count: 0
}))

try {
  const domainFormId = KOBO_CONFIG.DOMAIN_EXPERT_FORMS[maturity]
  const domainRes = await fetch(getApiUrl(`assets/${domainFormId}/data.json`, "domainExperts"))
  
  if (domainRes.ok) {
    const domainData = await domainRes.json()
    const domainMatching = domainData.results.filter(r =>
      String(r["group_intro/Q_13110000"] || "").trim() === toolId
    )

    const categorySubmissions = new Map()
    domainMatching.forEach(record => {
      const expertiseString = String(
        maturity === 'early_stage'
          ? record["group_individualinfo/Q_22300000"] || ""
          : record["group_intro_001/Q_22300000"] || ""
      ).trim().toLowerCase()

      if (expertiseString) {
        const codes = expertiseString.split(/\s+/)
        codes.forEach(code => {
          const fullName = KOBO_CONFIG.DOMAIN_CODE_MAPPING[code]
          if (fullName) {
            categorySubmissions.set(fullName, (categorySubmissions.get(fullName) || 0) + 1)
          }
        })
      }
    })

    domainExpertData = KOBO_CONFIG.DOMAIN_CATEGORIES[maturity].map(category => ({
      category,
      submitted: categorySubmissions.has(category),
      count: categorySubmissions.get(category) || 0
    }))
  }
} catch (err) {
  console.error("Error fetching domain expert data:", err)
  // domainExpertData already has default empty values
}
// Fetch user surveys - FIX THIS LINE
const ut3FormId = maturity === 'advance_stage' ? KOBO_CONFIG.USERTYPE3_FORMS.advance_stage : KOBO_CONFIG.USERTYPE3_FORMS.early_stage
const ut4FormId = maturity === 'advance_stage' ? KOBO_CONFIG.USERTYPE4_FORMS.advance_stage : KOBO_CONFIG.USERTYPE4_FORMS.early_stage

      const [ut3Res, ut4Res] = await Promise.all([
        fetch(getApiUrl(`assets/${ut3FormId}/data.json`, "ut3")),
        fetch(getApiUrl(`assets/${ut4FormId}/data.json`, "ut4"))
      ])

      const ut3Data = await ut3Res.json()
      const ut4Data = await ut4Res.json()

      const getToolId = (sub) => String(
        sub["group_intro/Q_13110000"] ||
        sub["group_requester/Q_13110000"] ||
        sub["Q_13110000"] ||
        ""
      ).trim()

      const ut3Matching = ut3Data.results.filter(r => getToolId(r) === toolId)
      const ut4Matching = ut4Data.results.filter(r => getToolId(r) === toolId)

      // Get form structure (questions)
// Get form structure (questions)
const [ut3FormRes, ut4FormRes] = await Promise.all([
  fetch(getApiUrl(`assets/${ut3FormId}.json`, "ut3Form")),  // ✅ Add .json
  fetch(getApiUrl(`assets/${ut4FormId}.json`, "ut4Form"))   // ✅ Add .json
])

// Add error handling
if (!ut3FormRes.ok || !ut4FormRes.ok) {
  throw new Error("Failed to fetch form structure")
}

const ut3Form = await ut3FormRes.json()
const ut4Form = await ut4FormRes.json()

      const extractQuestions = (form) => {
        const questions = []
        const content = form.content?.survey || []
        content.forEach(item => {
          if (item.type && item.name && !item.name.startsWith('_')) {
            questions.push({
              name: item.name,
              label: item.label?.[0] || item.label || item.name,
              type: item.type,
              choices: item.select_from_list_name ? 
                (form.content?.choices?.[item.select_from_list_name] || []).map(c => ({
                  name: c.name,
                  label: c.label?.[0] || c.label || c.name
                })) : []
            })
          }
        })
        return questions
      }

      setToolData({
        toolId,
        toolName: toolInfo[KOBO_CONFIG.TOOL_NAME_FIELD],
        maturity,
        innovators: innovatorData,
        domainExperts: domainExpertData,
        directUsers: {
          data: ut3Matching,
          questions: extractQuestions(ut3Form)
        },
        indirectUsers: {
          data: ut4Matching,
          questions: extractQuestions(ut4Form)
        }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!selectedTool) return
    fetchToolData(selectedTool)
  }

  const getStatusIcon = (submitted) => {
    return submitted ?
      <CheckCircle className="h-4 w-4 text-green-600" /> :
      <XCircle className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            <span style={{ color: "#591fd5" }}>MDII</span>{" "}
            <span style={{ color: "#cbced4" }}>|</span> Tool Details
          </h1>
          <p className="text-gray-600">View detailed submissions for your assigned tools</p>
        </div>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Select Tool</h2>
          <div className="flex gap-3">
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Choose a tool...</option>
              {tools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} ({tool.id})
                </option>
              ))}
            </select>
            <Button onClick={handleSearch} disabled={!selectedTool || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {toolData && (
          <>
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-2">{toolData.toolName}</h2>
              <div className="flex gap-2">
                <span className="text-sm text-gray-600">Tool ID: {toolData.toolId}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {toolData.maturity.charAt(0).toUpperCase() + toolData.maturity.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium">Innovators Team</h3>
                  <p className="text-sm text-gray-600">Leadership, Technical, and Project Manager</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {toolData.innovators.map((innovator) => (
                      <div key={innovator.role} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(innovator.submitted)}
                          <span className="text-sm font-medium">{innovator.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${innovator.submitted ? 'text-green-600' : 'text-gray-500'}`}>
                            {innovator.submitted ? 'Submitted' : 'Not Submitted'}
                          </span>
                          {innovator.submitted && (
                            <span className="text-xs text-gray-500">({innovator.count})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium">Domain Experts</h3>
                  <p className="text-sm text-gray-600">Expert submissions by domain</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {toolData.domainExperts.map((expert) => (
                      <div key={expert.category} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(expert.submitted)}
                          <span className="text-sm">{expert.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${expert.submitted ? 'text-green-600' : 'text-gray-500'}`}>
                            {expert.submitted ? 'Submitted' : 'Not Submitted'}
                          </span>
                          {expert.submitted && (
                            <span className="text-xs text-gray-500">({expert.count})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium">Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {toolData.innovators.filter(i => i.submitted).length}/{toolData.innovators.length}
                    </div>
                    <div className="text-sm text-gray-600">Innovators</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {toolData.domainExperts.filter(e => e.submitted).length}/{toolData.domainExperts.length}
                    </div>
                    <div className="text-sm text-gray-600">Domain Experts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {toolData.directUsers.data.length}
                    </div>
                    <div className="text-sm text-gray-600">Direct Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {toolData.indirectUsers.data.length}
                    </div>
                    <div className="text-sm text-gray-600">Indirect Users</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium">User Survey Responses</h2>
                <p className="text-gray-600">Direct and Indirect user feedback</p>
              </div>

              {toolData.directUsers.data.length > 0 && (
                <div className="bg-white border rounded-lg">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-medium">Direct Users</h3>
                    <p className="text-sm text-gray-600">{toolData.directUsers.data.length} responses</p>
                  </div>
                  <div className="p-6">
                    <DataTable 
                      data={toolData.directUsers.data} 
                      questions={toolData.directUsers.questions}
                    />
                  </div>
                </div>
              )}

              {toolData.indirectUsers.data.length > 0 && (
                <div className="bg-white border rounded-lg">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-medium">Indirect Users</h3>
                    <p className="text-sm text-gray-600">{toolData.indirectUsers.data.length} responses</p>
                  </div>
                  <div className="p-6">
                    <DataTable 
                      data={toolData.indirectUsers.data} 
                      questions={toolData.indirectUsers.questions}
                    />
                  </div>
                </div>
              )}

              {toolData.directUsers.data.length === 0 && toolData.indirectUsers.data.length === 0 && (
                <div className="bg-white border rounded-lg">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No User Responses</h3>
                    <p className="text-gray-500">No survey responses found for this tool</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="bg-white border rounded-lg">
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Loading Data</h3>
              <p className="text-gray-600">Fetching tool details...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
  