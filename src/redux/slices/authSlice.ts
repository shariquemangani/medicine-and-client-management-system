import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminUser } from '@/types'
import { authService } from '@/services/auth-services'
import { clearAuthSession, readStoredAuthSession } from '@/lib/auth-session'
import { clearBusinessId } from '@/lib/firebase/business-context'

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingOut: boolean
  /** True once the server session and profile were confirmed (cached profiles render before that). */
  sessionVerified: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingOut: false,
  sessionVerified: false,
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
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Fast path: a cached profile plus a live session cookie means the user was signed in on
      // this device. Render the app right away and verify against Firebase in the background.
      const cached = readStoredAuthSession()
      if (cached && authService.hasSessionFlag()) {
        void authService
          .restoreSession()
          .then((session) => dispatch(session ? sessionConfirmed(session.user) : sessionInvalidated()))
          // Network hiccup: keep the user in, the next request will surface a real auth failure.
          .catch(() => dispatch(sessionConfirmed(null)))
        return { user: cached.user, token: null, verified: false }
      }

      const session = await authService.restoreSession()
      return session ? { user: session.user, token: session.token, verified: true } : null
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
    /** Background verification succeeded (optionally with a refreshed profile). */
    sessionConfirmed(state, action: PayloadAction<AdminUser | null>) {
      state.sessionVerified = true
      if (action.payload) state.user = action.payload
    },
    /** Background verification found no valid Firebase user / profile: sign the app out. */
    sessionInvalidated(state) {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.sessionVerified = false
      state.isLoading = false
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
        state.sessionVerified = true
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
        state.sessionVerified = true
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
          state.sessionVerified = action.payload.verified
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
export const { sessionConfirmed, sessionInvalidated } = authSlice.actions
export default authSlice.reducer
