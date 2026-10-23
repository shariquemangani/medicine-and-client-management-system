import { advanceWindow } from '../src/lib/api/rate-limit'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const WINDOW = 10 * 60 * 1000
let state = undefined as ReturnType<typeof advanceWindow>['next'] | undefined
const t0 = 1_000_000

for (let i = 1; i <= 5; i++) {
  const r = advanceWindow(state, t0 + i, 5, WINDOW)
  assert(r.allowed, `attempt ${i} within the limit is allowed`)
  state = r.next
}
const blocked = advanceWindow(state, t0 + 10, 5, WINDOW)
assert(!blocked.allowed, 'sixth attempt in the window is blocked')
assert(blocked.next.resetAt === t0 + 1 + WINDOW, 'blocked attempts do not extend the window')

const reopened = advanceWindow(blocked.next, t0 + 1 + WINDOW, 5, WINDOW)
assert(reopened.allowed && reopened.next.count === 1, 'counter resets once the window has passed')

console.log('verify-rate-limit: all checks passed')
