import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, FileText, AlertCircle, CheckCircle, XCircle, Users, User, Calendar, ChevronDown, ChevronUp, Eye } from "lucide-react"
import { useData } from "@/context/DataContext"
import { KOBO_CONFIG } from "@/config/koboConfig"
import { getApiUrl } from "@/config/apiConfig"

// Form IDs for innovators and domain experts
const INNOVATOR_FORMS = {
  leadership: "afiUqEoYaGMS8RaygTPuAR",
  technical: "aqxEbPgQTMQQqe42ZFW2cc",
  projectManager: "auq274db5dfNGasdH4bWdU"
}

const DOMAIN_EXPERT_FORMS = {
  advanced: "ap6dUEDwX7KUsKLFZUD7kb",
  early: "au52CRd6ATzV7S36WcAdDu"
}

const DOMAIN_CODE_MAPPING = {
  'ce': 'Country Expert',
  'country_expert': 'Country Expert',
  'data': 'Data',
  'econ': 'Economics',
  'gesi': 'Gender Equity and Social Inclusion',
  'hcd': 'Human-Centered Design',
  'ict': 'Information and Communication Technologies'
}

const DOMAIN_CATEGORIES = {
  advanced: [
    "Country Expert",
    "Data",
    "Economics",
    "Gender Equity and Social Inclusion",
    "Human-Centered Design",
    "Information and Communication Technologies"
  ],
  early: [
    "Country Expert",
    "Data",
    "Economics",
    "Gender Equity and Social Inclusion",
    "Information and Communication Technologies"
  ]
}

// Enhanced DataTable component
export default function DataTable({ data, questions }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState(new Set())
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [showDemographics, setShowDemographics] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const itemsPerPage = 10
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    enabled: false
  })

  const getUserTypeAndMaturity = (record) => {
    if (record['group_individualinfo/Q_32120000'] !== undefined || record['group_intro_001/Q_32120000'] !== undefined) {
      if (record['group_individualinfo/Q_32120000'] !== undefined) {
        return { userType: 'direct', maturity: 'early' }
      } else {
        return { userType: 'direct', maturity: 'advanced' }
      }
    } else if (record['group_individualinfo/Q_42120000'] !== undefined || record['Q_individualinfo/Q_42120000'] !== undefined) {
      if (record['group_individualinfo/Q_42120000'] !== undefined) {
        return { userType: 'indirect', maturity: 'early' }
      } else {
        return { userType: 'indirect', maturity: 'advanced' }
      }
    }
    return { userType: 'direct', maturity: 'early' }
  }

  const getDemographicFields = (userType, maturity) => {
    const fieldMap = {
      direct: {
        early: {
          gender: 'group_individualinfo/Q_32120000',
          age: 'group_individualinfo/Q_32110000'
        },
        advanced: {
          gender: 'group_intro_001/Q_32120000',
          age: 'group_intro_001/Q_32110000'
        }
      },
      indirect: {
        early: {
          gender: 'group_individualinfo/Q_42120000',
          age: 'group_individualinfo/Q_42110000'
        },
        advanced: {
          gender: 'Q_individualinfo/Q_42120000',
          age: 'Q_individualinfo/Q_32110000'
        }
      }
    }
    return fieldMap[userType][maturity]
  }

  const { displayColumns, tableData, demographicStats } = useMemo(() => {
    if (!data.length) return { displayColumns: [], tableData: [], demographicStats: { genderStats: {}, ageStats: {}, totalResponses: 0 } }

    let filteredRawData = data
    if (dateFilter.enabled && (dateFilter.startDate || dateFilter.endDate)) {
      filteredRawData = data.filter(record => {
        const dateFields = Object.keys(record).filter(key =>
          key.toLowerCase().includes('start') ||
          key.toLowerCase().includes('end') ||
          key.toLowerCase().includes('time') ||
          key.toLowerCase().includes('date')
        )

        let recordDate = null
        for (const field of dateFields) {
          const value = record[field]
          if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            recordDate = new Date(value)
            break
          }
        }

        if (!recordDate) return true

        const recordDateOnly = recordDate.toISOString().split('T')[0]

        if (dateFilter.startDate && recordDateOnly < dateFilter.startDate) {
          return false
        }
        if (dateFilter.endDate && recordDateOnly > dateFilter.endDate) {
          return false
        }
        return true
      })
    }

    const firstRecord = filteredRawData[0] || {}
    const orderedFields = Object.keys(firstRecord).filter(
      key =>
        !key.startsWith('_') &&
        !key.startsWith('formhub/') &&
        !key.startsWith('meta/') &&
        key !== '__version__'
    )

    const displayColumns = orderedFields
      .map(fieldName => {
        const normalizedField = fieldName.split('/').pop() || fieldName
        const question = questions.find(
          q => q.name === normalizedField || q.name === fieldName
        )
        if (!question) return null
        return {
          key: fieldName,
          label: question.label || 'Unknown Question',
          type: question.type || 'text',
          choices: question.choices || []
        }
      })
      .filter(col => col !== null)
      .sort((a, b) => {
        if (a.key.includes('toolid') || a.key.includes('Q_13110000')) return -1
        if (b.key.includes('toolid') || b.key.includes('Q_13110000')) return 1
        return 0
      })

    if (visibleColumns.size === 0) {
      setVisibleColumns(new Set(displayColumns.map(col => col.key)))
    }

    const genderStats = {}
    const ageStats = {}

    filteredRawData.forEach(record => {
      const { userType, maturity } = getUserTypeAndMaturity(record)
      const fields = getDemographicFields(userType, maturity)

      const possibleGenderFields = [
        fields.gender,
        'group_individualinfo/Q_32120000',
        'group_intro_001/Q_32120000',
        'group_individualinfo/Q_42120000',
        'Q_individualinfo/Q_42120000',
        'Q_32120000',
        'Q_42120000'
      ]

      let genderValue = null
      let genderFieldUsed = null
      for (const field of possibleGenderFields) {
        if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
          genderValue = record[field]
          genderFieldUsed = field
          break
        }
      }

      const possibleAgeFields = [
        fields.age,
        'group_individualinfo/Q_32110000',
        'group_intro_001/Q_32110000',
        'group_individualinfo/Q_42110000',
        'Q_individualinfo/Q_32110000',
        'Q_32110000',
        'Q_42110000'
      ]

      let ageValue = null
      let ageFieldUsed = null
      for (const field of possibleAgeFields) {
        if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
          ageValue = record[field]
          ageFieldUsed = field
          break
        }
      }

      if (genderValue) {
        const genderColumn = displayColumns.find(col => col.key === genderFieldUsed)
        let genderLabel = genderValue
        if (genderColumn && genderColumn.choices.length > 0) {
          const choice = genderColumn.choices.find(c => c.name === genderValue)
          if (choice) {
            genderLabel = choice.label
          }
        }
        genderStats[genderLabel] = (genderStats[genderLabel] || 0) + 1
      }

      if (ageValue) {
        const ageColumn = displayColumns.find(col => col.key === ageFieldUsed)
        let ageLabel = ageValue
        if (ageColumn && ageColumn.choices.length > 0) {
          const choice = ageColumn.choices.find(c => c.name === ageValue)
          if (choice) {
            ageLabel = choice.label
          }
        }
        ageStats[ageLabel] = (ageStats[ageLabel] || 0) + 1
      }
    })

    const tableData = filteredRawData.map(record => {
      const processedRecord = {}
      displayColumns.forEach(col => {
        let value = record[col.key]

        if (value && col.choices.length > 0) {
          const choice = col.choices.find(c => c.name === value)
          if (choice) {
            value = choice.label
          }
        }

        if (value && typeof value === 'string' &&
          (col.key.toLowerCase().includes('start') ||
            col.key.toLowerCase().includes('end') ||
            col.key.toLowerCase().includes('time')) &&
          value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          try {
            const date = new Date(value)
            value = date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          } catch (e) {
            // Keep original value
          }
        }

        processedRecord[col.key] = value ?? '-'
      })
      return processedRecord
    })

    const demographicStats = {
      genderStats,
      ageStats,
      totalResponses: filteredRawData.length
    }

    return { displayColumns, tableData, demographicStats }
  }, [data, questions, visibleColumns.size, dateFilter])

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = String(a[sortConfig.column] || '')
        const bValue = String(b[sortConfig.column] || '')
        const result = aValue.localeCompare(bValue)
        return sortConfig.direction === 'asc' ? result : -result
      })
    }

    return filtered
  }, [tableData, searchTerm, sortConfig])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleSort = (columnKey) => {
    setSortConfig(current => ({
      column: columnKey,
      direction: current?.column === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleColumnVisibility = (columnKey) => {
    const newVisibleColumns = new Set(visibleColumns)
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey)
    } else {
      newVisibleColumns.add(columnKey)
    }
    setVisibleColumns(newVisibleColumns)
  }

  const visibleDisplayColumns = displayColumns.filter(col => visibleColumns.has(col.key))

  if (!data.length) {
    return (
      <div className="border border-gray-200 rounded bg-white">
        <div className="text-center py-16">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">No survey responses to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                Date
                {dateFilter.enabled && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">ON</span>}
              </button>
              {showDateFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDateFilter(false)} />
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border rounded shadow-lg z-20 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dateFilter.enabled}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, enabled: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">Enable filtering</span>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Start Date</label>
                        <input
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          disabled={!dateFilter.enabled}
                          className="w-full px-3 py-2 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">End Date</label>
                        <input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          disabled={!dateFilter.enabled}
                          className="w-full px-3 py-2 text-sm border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDemographics(!showDemographics)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                <Users className="h-4 w-4" />
                Demographics
              </button>
              {showDemographics && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDemographics(false)} />
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white border rounded shadow-lg z-20 p-4">
{Object.keys(demographicStats.genderStats).length > 0 && (
  <div className="mb-4">
    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Gender</div>
    {Object.entries(demographicStats.genderStats).map(([gender, count]) => {
      const genderCount = count as number; // ✅ explicitly cast
      return (
        <div key={gender} className="flex justify-between text-sm">
          <span>{gender}</span>
          <span>
            {genderCount} ({((genderCount / demographicStats.totalResponses) * 100).toFixed(1)}%)
          </span>
        </div>
      );
    })}
  </div>
)}

{Object.keys(demographicStats.ageStats).length > 0 && (
  <div>
    <div className="text-xs font-medium text-gray-500 uppercase mb-2">Age</div>
    {Object.entries(demographicStats.ageStats).map(([age, count]) => {
      const ageCount = count as number; // ✅ explicitly cast
      return (
        <div key={age} className="flex justify-between text-sm">
          <span>{age}</span>
          <span>
            {ageCount} ({((ageCount / demographicStats.totalResponses) * 100).toFixed(1)}%)
          </span>
        </div>
      );
    })}
  </div>
)}

                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Columns
              </button>
              {showColumnSelector && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColumnSelector(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded shadow-lg z-20 max-h-64 overflow-y-auto">
                    {displayColumns.map(col => (
                      <label key={col.key} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.key)}
                          onChange={() => toggleColumnVisibility(col.key)}
                          className="mr-3"
                        />
                        <span className="text-sm">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-2 rounded text-sm bg-blue-100 text-blue-800">
              {filteredAndSortedData.length} records
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              {visibleDisplayColumns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{col.label}</span>
                    {sortConfig?.column === col.key && (
                      sortConfig.direction === 'asc' ?
                        <ChevronUp className="h-3 w-3" /> :
                        <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {visibleDisplayColumns.map(col => (
                  <td key={col.key} className="px-4 py-2 text-sm border-r last:border-r-0">
                    {String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t px-4 py-3 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length}
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}