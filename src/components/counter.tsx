'use client'

import {
  useAppDispatch,
  useAppSelector,
  increment,
  decrement,
  reset,
} from '@/redux'
import { MinusIcon, PlusIcon, RefreshCcwIcon } from 'lucide-react'

export function Counter() {
  const count = useAppSelector(state => state.counter.value)
  const dispatch = useAppDispatch()

  return (
    <div>
      <h2>Counter: {count}</h2>
      <div>
        <button onClick={() => dispatch(decrement())}>
          <MinusIcon />
        </button>
        <button onClick={() => dispatch(reset())}>
          <RefreshCcwIcon />
        </button>
        <button onClick={() => dispatch(increment())}>
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}
