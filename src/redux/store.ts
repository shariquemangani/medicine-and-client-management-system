import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import patientReducer from './slices/patientSlice'
import stockReducer from './slices/stockSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    patients: patientReducer,
    stock: stockReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
