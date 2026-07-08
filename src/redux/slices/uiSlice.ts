import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AdminBreadcrumbSegment } from '@/lib/admin-breadcrumbs'

interface UiState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  breadcrumbOverrides: AdminBreadcrumbSegment[] | null
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  breadcrumbOverrides: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
    setBreadcrumbOverrides(state, action: PayloadAction<AdminBreadcrumbSegment[]>) {
      state.breadcrumbOverrides = action.payload
    },
    clearBreadcrumbOverrides(state) {
      state.breadcrumbOverrides = null
    },
  },
})

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setMobileSidebarOpen,
  toggleMobileSidebar,
  setBreadcrumbOverrides,
  clearBreadcrumbOverrides,
} = uiSlice.actions
export default uiSlice.reducer
