import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { StockAdjustInput, StockItem, StockMovement, StockReceiveInput } from '@/types/stock'
import {
  adjustStock,
  fetchStockItems,
  fetchStockMovements,
  receiveStock,
  updateStockReorder,
} from '@/services/stock-api'
import { buildStockAlerts } from '@/lib/stock-utils'
import { computeStockStats } from '@/lib/stock-stats'
import type { StockAlert } from '@/types/stock'

interface StockState {
  items: StockItem[]
  movements: StockMovement[]
  alerts: StockAlert[]
  stats: ReturnType<typeof computeStockStats> | null
  loading: boolean
  saving: boolean
  error: string | null
}

const initialState: StockState = {
  items: [],
  movements: [],
  alerts: [],
  stats: null,
  loading: false,
  saving: false,
  error: null,
}

export const loadStockData = createAsyncThunk('stock/load', async (_, { rejectWithValue }) => {
  try {
    const [items, movements] = await Promise.all([fetchStockItems(), fetchStockMovements()])
    return { items, movements }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load stock')
  }
})

export const receiveStockItem = createAsyncThunk(
  'stock/receive',
  async (input: StockReceiveInput, { rejectWithValue }) => {
    try {
      await receiveStock(input)
      const [items, movements] = await Promise.all([fetchStockItems(), fetchStockMovements()])
      return { items, movements }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to receive stock')
    }
  }
)

export const adjustStockItem = createAsyncThunk(
  'stock/adjust',
  async (input: StockAdjustInput, { rejectWithValue }) => {
    try {
      await adjustStock(input)
      const [items, movements] = await Promise.all([fetchStockItems(), fetchStockMovements()])
      return { items, movements }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to adjust stock')
    }
  }
)

export const updateReorderLevels = createAsyncThunk(
  'stock/updateReorder',
  async (
    { stockItemId, reorderLevel, reorderQuantity }: {
      stockItemId: string
      reorderLevel: number
      reorderQuantity: number
    },
    { rejectWithValue }
  ) => {
    try {
      await updateStockReorder(stockItemId, reorderLevel, reorderQuantity)
      const items = await fetchStockItems()
      return { items }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update reorder')
    }
  }
)

function applyStockData(state: StockState, items: StockItem[], movements: StockMovement[]) {
  state.items = items
  state.movements = movements
  state.alerts = buildStockAlerts(items)
  state.stats = computeStockStats(items, movements)
}

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    clearStockError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStockData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadStockData.fulfilled, (state, action) => {
        state.loading = false
        applyStockData(state, action.payload.items, action.payload.movements)
      })
      .addCase(loadStockData.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Failed to load stock'
      })
      .addCase(receiveStockItem.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(receiveStockItem.fulfilled, (state, action) => {
        state.saving = false
        applyStockData(state, action.payload.items, action.payload.movements)
      })
      .addCase(receiveStockItem.rejected, (state, action) => {
        state.saving = false
        state.error = (action.payload as string) ?? 'Failed to receive stock'
      })
      .addCase(adjustStockItem.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(adjustStockItem.fulfilled, (state, action) => {
        state.saving = false
        applyStockData(state, action.payload.items, action.payload.movements)
      })
      .addCase(adjustStockItem.rejected, (state, action) => {
        state.saving = false
        state.error = (action.payload as string) ?? 'Failed to adjust stock'
      })
      .addCase(updateReorderLevels.fulfilled, (state, action) => {
        const movements = state.movements
        applyStockData(state, action.payload.items, movements)
      })
  },
})

export const { clearStockError } = stockSlice.actions
export default stockSlice.reducer
