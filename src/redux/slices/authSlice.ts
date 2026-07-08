import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AdminUser } from '@/types'
import { authService } from '@/services/auth-services'
import { clearAuthSession } from '@/lib/auth-session'
import { clearBusinessId } from '@/lib/firebase/business-context'

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingOut: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string; rememberMe?: boolean },
    { rejectWithValue }
  ) => {
    const response = await authService.login(email, password)
    if (!response.success) {
      return rejectWithValue(response.message ?? 'Login failed')
    }
    return { token: response.token, user: response.user }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (
    { fullName, email, password }: { fullName: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    const response = await authService.register(fullName, email, password)
    if (!response.success) {
      return rejectWithValue(response.message ?? 'Registration failed')
    }
    return { token: response.token, user: response.user }
  }
)

export const initAuth = createAsyncThunk(
  'auth/init',
  async (_, { rejectWithValue }) => {
    try {
      const session = await authService.restoreSession()
      return session
    } catch {
      clearAuthSession()
      return rejectWithValue('Failed to restore session')
    }
  },
  {
    condition: (_, { getState }) => {
      const auth = (getState() as { auth: AuthState }).auth
      // Run only once per page load — ReduxProvider owns initialization
      if (auth.isAuthenticated && auth.user) return false
      return true
    },
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout()
    return true
  } catch {
    clearAuthSession()
    clearBusinessId()
    return rejectWithValue('Logout failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.error = null
        state.isLoggingOut = false
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoggingOut = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isLoggingOut = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.error = null
        state.isLoggingOut = false
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoggingOut = false
        state.isAuthenticated = true
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.isLoggingOut = false
        state.error = action.payload as string
      })
      .addCase(initAuth.pending, (state) => {
        state.isLoggingOut = false
        if (!state.isAuthenticated) {
          state.isLoading = true
        }
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoggingOut = false
        if (action.payload) {
          state.isAuthenticated = true
          state.token = action.payload.token
          state.user = action.payload.user
          return
        }
        // Do not wipe a session established while initAuth was in flight
        if (state.isAuthenticated && state.user) return
        state.isAuthenticated = false
        state.token = null
        state.user = null
      })
      .addCase(initAuth.rejected, (state) => {
        state.isLoading = false
        state.isLoggingOut = false
        state.isAuthenticated = false
        state.token = null
        state.user = null
      })
      .addCase(logout.pending, (state) => {
        state.error = null
        state.isLoggingOut = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.isLoading = false
        state.isLoggingOut = false
        state.error = null
      })
      .addCase(logout.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.isLoading = false
        state.isLoggingOut = false
        state.error = null
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
