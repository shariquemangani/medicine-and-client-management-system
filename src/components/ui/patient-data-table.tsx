'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit, Package, MapPin } from 'lucide-react'
import { Patient } from '@/types/patient'
import GeneticInsightsTab from '@/app/(Navigations)/patients/[id]/tabs/genetic-insights'

interface PatientDataTableProps {
  patients: Patient[]
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'All' | 'Active' | 'Inactive' | 'Pending LSA' | 'Genetic'
  onStatusFilterChange: (
    filter: 'All' | 'Active' | 'Inactive' | 'Pending LSA' | 'Genetic'
  ) => void
  onViewPatient: (patientId: string) => void
  onEditPatient: (patientId: string) => void
  // Pagination props
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (limit: number) => void
  showPagination?: boolean
  // Loading props
  loading?: boolean
}

const getWellnessScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

const getWellnessScoreTextColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

const getWellnessScoreProgressColor = (score: number) => {
  if (score >= 80) return '[&>div]:bg-green-500'
  if (score >= 60) return '[&>div]:bg-blue-500'
  if (score >= 40) return '[&>div]:bg-orange-500'
  return '[&>div]:bg-red-500'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-500'
    case 'Inactive':
      return 'bg-red-500'
    case 'Pending LSA':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

const getConditionStyles = (condition: string) => {
  // Red coded conditions - warning UI
  const redCodedConditions = ['CKD', 'Nephritis', 'Autism', 'ADHD', 'Cancer']

  // Check if condition matches red coded conditions (case-insensitive)
  const isRedCoded = redCodedConditions.some(
    redCondition => condition.toLowerCase() === redCondition.toLowerCase()
  )

  if (isRedCoded) {
    return 'text-red-700 bg-red-50 '
  }

  // All other conditions - gray background
  return 'text-gray-700 bg-gray-100 '
}

export function PatientDataTable({
  patients,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewPatient,
  onEditPatient,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showPagination = true,
  loading = false,
}: PatientDataTableProps) {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery)

  // Update local search query when prop changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  const handleSearchInputChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange(value)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className="p-6 bg-card border-none shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
      {/* Header Section - No Loading Overlay */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Patient data</h2>
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-gray-200">
            <Button
              variant={statusFilter === 'All' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange('All')}
              className={`rounded-r-none ${
                statusFilter === 'All'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'Active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange('Active')}
              className={`rounded-none border-x border-gray-200 ${
                statusFilter === 'Active'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'Inactive' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange('Inactive')}
              className={`rounded-none border-x border-gray-200 ${
                statusFilter === 'Inactive'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              Inactive
            </Button>
            <Button
              variant={statusFilter === 'Pending LSA' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange('Pending LSA')}
              className={`rounded-none border-x border-gray-200 ${
                statusFilter === 'Pending LSA'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              Pending LSA
            </Button>
            <Button
              variant={statusFilter === 'Genetic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onStatusFilterChange('Genetic')}
              className={`rounded-l-none ${
                statusFilter === 'Genetic'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              Genetic
            </Button>
          </div>
          <div className="relative">
            <Input
              placeholder={statusFilter === 'Genetic' ? "Search by name or email..." : "Search by patient ID or name"}
              value={localSearchQuery}
              onChange={e => handleSearchInputChange(e.target.value)}
              className="w-64 pr-8 bg-white"
            />
            {localSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchInputChange('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section with Loading Overlay */}
      {statusFilter === 'Genetic' ? (
        <div className="mt-4">
          <GeneticInsightsTab embedded={true} searchQueryProp={localSearchQuery} />
        </div>
      ) : (
        <>
          <div className="relative">
            {/* Custom Table with Sticky Header */}
            <div className="relative bg-white">
              {/* Sticky Header */}
              <div className="sticky top-0 z-20 bg-white">
                <div className="grid grid-cols-[2fr_1.8fr_2fr_1.5fr_1.2fr_1.4fr_1fr] gap-4 p-4 text-sm font-medium text-gray-900">
                  <div className="text-left">Patient</div>
                  <div className="text-left">Package</div>
                  <div className="text-left">Health conditions</div>
                  <div className="text-left">Wellness score</div>
                  <div className="text-left">Status</div>
                  <div className="text-left">Program date</div>
                  <div className="text-left">Actions</div>
                </div>
              </div>
              {/* Scrollable Body */}
              {patients.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto min-h-[300px]">
                  <div className="divide-y divide-gray-200">
                    {patients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => onViewPatient(patient.id)}
                        className="grid grid-cols-[2fr_1.8fr_2fr_1.5fr_1.2fr_1.4fr_1fr] gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {/* Patient Column */}
                        <div className="flex items-center justify-start gap-3">
                          {patient.name && patient.id ? (
                            <>
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10">
                                  {getInitials(patient.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {patient.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {patient.id}
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 flex items-center justify-center">
                              -
                            </span>
                          )}
                        </div>

                        {/* Package Column */}
                        {patient.package?.name && patient.package?.location ? (
                          <div className="flex items-center justify-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {patient.package.name}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {patient.package.location}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center">
                            -
                          </span>
                        )}

                        {/* Health Conditions Column */}
                        {patient.healthConditions &&
                        patient.healthConditions.length > 0 ? (
                          <div className="flex items-center justify-start gap-2 flex-wrap">
                            {patient.healthConditions
                              .slice(0, 2)
                              .map((condition, index, array) => (
                                <span
                                  key={index}
                                  className={`text-sm font-medium px-2 py-1 rounded-md ${getConditionStyles(condition)}`}
                                >
                                  {condition}
                                  {index < array.length - 1}
                                </span>
                              ))}
                            {patient.healthConditions.length > 2 && (
                              <span className="text-sm font-medium bg-primary/90 px-2 py-1 rounded-md text-white">
                                +{patient.healthConditions.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center">
                            -
                          </span>
                        )}

                        {/* Wellness Score Column */}
                        {patient.wellnessScore !== undefined &&
                        patient.wellnessScore !== null ? (
                          <div className="flex items-center justify-start gap-3">
                            <Progress
                              value={patient.wellnessScore}
                              className={`w-16 h-2 ${getWellnessScoreProgressColor(patient.wellnessScore)}`}
                            />
                            <span
                              className={`text-sm font-medium ${getWellnessScoreTextColor(patient.wellnessScore)}`}
                            >
                              {patient.wellnessScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center">
                            -
                          </span>
                        )}

                        {/* Status Column */}
                        {patient.status ? (
                          <div className="flex items-center justify-start gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusColor(patient.status)}`}
                            />
                            <span className="text-sm text-gray-900">
                              {patient.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center">
                            -
                          </span>
                        )}

                        {/* Program Date Column */}
                        {patient.programDates?.start || patient.programDates?.end ? (
                          <div className="text-sm text-left">
                            <div className="text-gray-900 font-medium">
                              {patient.programDates.start
                                ? formatDate(patient.programDates.start)
                                : 'Not set'}
                            </div>
                            <div className="text-gray-500 flex items-center gap-1.5">
                              {patient.programDates.end && (
                                <img
                                  src="/icons/right.svg"
                                  alt=""
                                  className="w-4 h-4"
                                />
                              )}
                              <span>
                                {patient.programDates.end
                                  ? formatDate(patient.programDates.end)
                                  : 'Not set'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center">
                            -
                          </span>
                        )}

                        {/* Actions Column */}
                        <div className="flex items-center justify-start gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              onEditPatient(patient.id)
                            }}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center flex items-center justify-center py-8 text-gray-500">
                  No patients found matching your criteria.
                </div>
              )}
            </div>

            {/* Loading Overlay - Only covers table */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Loading...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {showPagination && totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              showItemsPerPage={true}
              itemsPerPageOptions={[10, 20, 50]}
              className="mt-6"
            />
          )}
        </>
      )}
    </Card>
  )
}
