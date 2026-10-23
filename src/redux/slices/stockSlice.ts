import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type {
  StockAdjustInput,
  StockAlert,
  StockItem,
  StockItemInput,
  StockItemUpdate,
  StockMovement,
  StockReceiveInput,
} from '@/types/stock'
import {
  adjustStock,
  createStockItem,
  deleteStockItem,
  fetchStockItems,
  fetchStockMovements,
  receiveStock,
  updateStockItem,
  updateStockReorder,
} from '@/services/stock-api'
import { buildStockAlerts } from '@/lib/stock-utils'
import { computeStockStats } from '@/lib/stock-stats'

interface StockState {
  items: StockItem[]
  movements: StockMovement[]
  alerts: StockAlert[]
  stats: ReturnType<typeof computeStockStats> | null
  loading: boolean
  /** Epoch ms of the last successful load; lets screens reuse fresh data instead of re-reading Firestore. */
  lastLoadedAt: number
  saving: boolean
  /** Load failures only. Mutation errors are returned to the caller so they can toast the real message. */
  error: string | null
}

const initialState: StockState = {
  items: [],
  movements: [],
  alerts: [],
  stats: null,
  loading: false,
  lastLoadedAt: 0,
  saving: false,
  error: null,
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

async function loadAll() {
  const [items, movements] = await Promise.all([fetchStockItems(), fetchStockMovements()])
  return { items, movements }
}

/** Stock data younger than this is reused (the sidebar badge, dashboard and inventory share one load). */
const STOCK_FRESH_MS = 60_000

/**
 * Loads items + recent movements. Skipped while a load is running or the data is fresh, unless
 * `{ force: true }` (the Refresh button).
 */
export const loadStockData = createAsyncThunk<
  Awaited<ReturnType<typeof loadAll>>,
  { force?: boolean } | undefined,
  { rejectValue: string }
>(
  'stock/load',
  async (_, { rejectWithValue }) => {
    try {
      return await loadAll()
    } catch (error) {
      return rejectWithValue(messageOf(error, 'Failed to load stock'))
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true
      const { stock } = getState() as { stock: StockState }
      if (stock.loading) return false
      return Date.now() - stock.lastLoadedAt > STOCK_FRESH_MS
    },
  }
)

/** Builds a thunk that runs a mutation, then reloads items and movements. */
function mutationThunk<Arg>(type: string, fallback: string, run: (arg: Arg) => Promise<unknown>) {
  return createAsyncThunk(type, async (arg: Arg, { rejectWithValue }) => {
    try {
      await run(arg)
      return await loadAll()
    } catch (error) {
      return rejectWithValue(messageOf(error, fallback))
    }
  })
}

export const createStockItemThunk = mutationThunk<StockItemInput>(
  'stock/createItem',
  'Failed to create stock item',
  (input) => createStockItem(input)
)

export const updateStockItemThunk = mutationThunk<{ id: string; patch: StockItemUpdate }>(
  'stock/updateItem',
  'Failed to update stock item',
  ({ id, patch }) => updateStockItem(id, patch)
)

export const deleteStockItemThunk = mutationThunk<string>(
  'stock/deleteItem',
  'Failed to delete stock item',
  (id) => deleteStockItem(id)
)

export const receiveStockItem = mutationThunk<StockReceiveInput>(
  'stock/receive',
  'Failed to receive stock',
  (input) => receiveStock(input)
)

export const adjustStockItem = mutationThunk<StockAdjustInput>(
  'stock/adjust',
  'Failed to adjust stock',
  (input) => adjustStock(input)
)

export const updateReorderLevels = mutationThunk<{
  stockItemId: string
  reorderLevel: number
  reorderQuantity: number
}>('stock/updateReorder', 'Failed to update reorder levels', ({ stockItemId, reorderLevel, reorderQuantity }) =>
  updateStockReorder(stockItemId, reorderLevel, reorderQuantity)
)

function applyStockData(state: StockState, items: StockItem[], movements: StockMovement[]) {
  state.items = items
  state.movements = movements
  state.alerts = buildStockAlerts(items)
  state.stats = computeStockStats(items, movements)
}

const mutations = [
  createStockItemThunk,
  updateStockItemThunk,
  deleteStockItemThunk,
  receiveStockItem,
  adjustStockItem,
  updateReorderLevels,
]

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
        state.lastLoadedAt = Date.now()
        applyStockData(state, action.payload.items, action.payload.movements)
      })
      .addCase(loadStockData.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? 'Failed to load stock'
      })

    for (const thunk of mutations) {
      builder
        .addCase(thunk.pending, (state) => {
          state.saving = true
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.saving = false
          state.lastLoadedAt = Date.now()
          applyStockData(state, action.payload.items, action.payload.movements)
        })
        .addCase(thunk.rejected, (state) => {
          state.saving = false
        })
    }
  },
})

export const { clearStockError } = stockSlice.actions
export default stockSlice.reducer
