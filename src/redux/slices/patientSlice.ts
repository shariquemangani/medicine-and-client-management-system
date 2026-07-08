import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Medicine, PatientCreateInput, PatientUpdateInput } from '@/types'
import type { PatientProfileData, PatientProfileUpdateBody } from '@/types/patient-profile'
import {
  createPatientApi,
  fetchPatientProfileApi,
  updatePatientApi,
} from '@/services/patient-api'
import { fetchMedicines } from '@/services/pharmacy-api'

interface PatientState {
  profile: PatientProfileData | null
  profileId: string | null
  classes: Medicine[]
  loadingProfile: boolean
  loadingClasses: boolean
  creating: boolean
  saving: boolean
  error: string | null
}

const initialState: PatientState = {
  profile: null,
  profileId: null,
  classes: [],
  loadingProfile: false,
  loadingClasses: false,
  creating: false,
  saving: false,
  error: null,
}

export const fetchPatientMedicines = createAsyncThunk(
  'patients/fetchMedicines',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchMedicines({ limit: 100 })
      return res.data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load classes')
    }
  }
)

export const createPatient = createAsyncThunk(
  'patients/create',
  async (data: PatientCreateInput, { rejectWithValue }) => {
    try {
      return await createPatientApi(data)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create patient')
    }
  }
)

export const fetchPatientProfile = createAsyncThunk(
  'patients/fetchProfile',
  async (id: string, { rejectWithValue }) => {
    try {
      return await fetchPatientProfileApi(id)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load patient')
    }
  }
)

export const updatePatient = createAsyncThunk(
  'patients/update',
  async (
    { id, data }: { id: string; data: PatientUpdateInput | PatientProfileUpdateBody },
    { rejectWithValue }
  ) => {
    try {
      return await updatePatientApi(id, data)
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update patient')
    }
  }
)

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearPatientProfile(state) {
      state.profile = null
      state.profileId = null
      state.error = null
    },
    clearPatientError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientMedicines.pending, (state) => {
        state.loadingClasses = true
      })
      .addCase(fetchPatientMedicines.fulfilled, (state, action) => {
        state.loadingClasses = false
        state.classes = action.payload
      })
      .addCase(fetchPatientMedicines.rejected, (state, action) => {
        state.loadingClasses = false
        state.error = action.payload as string
      })
      .addCase(createPatient.pending, (state) => {
        state.creating = true
        state.error = null
      })
      .addCase(createPatient.fulfilled, (state) => {
        state.creating = false
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload as string
      })
      .addCase(fetchPatientProfile.pending, (state, action) => {
        state.loadingProfile = true
        state.error = null
        if (state.profileId !== action.meta.arg) {
          state.profile = null
        }
        state.profileId = action.meta.arg
      })
      .addCase(fetchPatientProfile.fulfilled, (state, action) => {
        state.loadingProfile = false
        state.profile = action.payload
        state.profileId = action.payload.header.id
      })
      .addCase(fetchPatientProfile.rejected, (state, action) => {
        state.loadingProfile = false
        state.profile = null
        state.error = action.payload as string
      })
      .addCase(updatePatient.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.saving = false
        state.profile = action.payload
        state.profileId = action.payload.header.id
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload as string
      })
  },
})

export const { clearPatientProfile, clearPatientError } = patientSlice.actions
export default patientSlice.reducer
