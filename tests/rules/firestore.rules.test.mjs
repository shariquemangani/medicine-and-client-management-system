import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit, writeBatch,
} from 'firebase/firestore'

const here = dirname(fileURLToPath(import.meta.url))
const rules = readFileSync(join(here, '..', '..', 'firestore.rules'), 'utf8')
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')

const env = await initializeTestEnvironment({
  projectId: 'demo-mediflow',
  firestore: { rules, host, port: Number(port) },
})

let passed = 0
let failed = 0
async function t(name, fn) {
  try {
    await fn()
    passed++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failed++
    console.log(`  FAIL ${name}\n       ${String(e.message).split('\n')[0]}`)
  }
}

const now = new Date().toISOString()
const A = 'adminA', B = 'adminB', SA = 'staffA', SB = 'staffB', OFF = 'staffOff'

const item = (o = {}) => ({
  medicineId: 'm', medicineName: 'Arnica', unit: 'bottles', totalQuantity: 0, reservedQuantity: 0,
  reorderLevel: 2, reorderQuantity: 5, location: 'Shelf', batches: [], createdAt: now, updatedAt: now, ...o,
})
const movement = (uid, o = {}) => ({
  stockItemId: 'full', medicineId: 'm', medicineName: 'Arnica', unit: 'bottles', type: 'purchase',
  quantity: 5, balanceAfter: 5, performedBy: 'x', performedById: uid, createdAt: now, ...o,
})

const patient = (o = {}) => ({ firstName: 'Seed', lastName: 'Patient', rollNumber: '202601001', createdAt: now, ...o })
const payment = (o = {}) => ({ patientId: 'x1', patientName: 'Seed Patient', amount: 5, method: 'cash', date: '2026-01-01', createdAt: now, ...o })

async function seed() {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    const u = (id, role, businessId, isActive = true) =>
      setDoc(doc(db, 'users', id), { name: id, email: `${id}@x.io`, role, businessId, isActive, createdAt: now })
    await u(A, 'super_admin', A)
    await u(B, 'super_admin', B)
    await u(SA, 'staff', A)
    await u(SB, 'staff', B)
    await u(OFF, 'staff', A, false)
    for (const b of [A, B]) {
      await setDoc(doc(db, 'businesses', b), { createdAt: now, profile: { name: b } })
      for (const c of ['patients', 'medicines', 'diseases', 'payments', 'feeStructures', 'billingCategories', 'prescriptions', 'activities']) {
        await setDoc(doc(db, 'businesses', b, c, 'x1'), { name: 'seed' })
      }
      await setDoc(doc(db, 'businesses', b, 'patients', 'x1'), patient())
      await setDoc(doc(db, 'businesses', b, 'payments', 'x1'), payment())
      await setDoc(doc(db, 'businesses', b, 'stockItems', 'empty'), item({ totalQuantity: 0 }))
      await setDoc(doc(db, 'businesses', b, 'stockItems', 'full'), item({ totalQuantity: 5 }))
      await setDoc(doc(db, 'businesses', b, 'stockMovements', 'm1'), movement(b))
    }
    await setDoc(doc(db, 'flagCategories', 'potency'), { name: 'Potency' })
    await setDoc(doc(db, 'flagCategories', 'potency', 'flags', 'f1'), { name: '30C' })
  })
}

const as = (uid) => env.authenticatedContext(uid).firestore()
const anon = () => env.unauthenticatedContext().firestore()
const bd = (db, b, ...p) => doc(db, 'businesses', b, ...p)
const newUser = (uid, o = {}) => ({
  name: 'N', email: 'n@x.io', role: 'super_admin', businessId: uid, isActive: true, createdAt: now, ...o,
})

await seed()

console.log('1. deny by default / auth')
await t('unauthenticated cannot read patients', () => assertFails(getDoc(bd(anon(), A, 'patients', 'x1'))))
await t('unauthenticated cannot read users', () => assertFails(getDoc(doc(anon(), 'users', A))))
await t('unauthenticated cannot write flagCategories', () => assertFails(setDoc(doc(anon(), 'flagCategories', 'z'), { a: 1 })))
await t('browsers cannot read rate limit counters', () => assertFails(getDoc(doc(as(A), 'rateLimits', 'register_x'))))
await t('browsers cannot write rate limit counters', () => assertFails(setDoc(doc(as(A), 'rateLimits', 'register_x'), { count: 0 })))
await t('unknown root collection denied', () => assertFails(getDoc(doc(as(A), 'secrets', 's1'))))
await t('unknown business subcollection denied', () => assertFails(getDoc(bd(as(A), A, 'mystery', 'x'))))
await t('signed-in user without profile cannot read business data', () => assertFails(getDoc(bd(as('ghost'), A, 'patients', 'x1'))))
await t('disabled user cannot read own tenant patients', () => assertFails(getDoc(bd(as(OFF), A, 'patients', 'x1'))))
await t('disabled user cannot write patients', () => assertFails(setDoc(bd(as(OFF), A, 'patients', 'n'), { a: 1 })))
await t('disabled user cannot read flagCategories', () => assertFails(getDoc(doc(as(OFF), 'flagCategories', 'potency'))))

console.log('2. tenant isolation')
await t('admin reads own patients', () => assertSucceeds(getDoc(bd(as(A), A, 'patients', 'x1'))))
await t('admin cannot read other tenant patients', () => assertFails(getDoc(bd(as(A), B, 'patients', 'x1'))))
await t('admin cannot write other tenant patients', () => assertFails(setDoc(bd(as(A), B, 'patients', 'n'), { a: 1 })))
await t('staff cannot read other tenant patients', () => assertFails(getDoc(bd(as(SA), B, 'patients', 'x1'))))
await t('staff cannot write other tenant stockItems', () => assertFails(setDoc(bd(as(SA), B, 'stockItems', 'n'), item())))
await t('staff cannot create other tenant movements', () => assertFails(setDoc(bd(as(SA), B, 'stockMovements', 'n'), movement(SA))))
await t('admin cannot read other tenant business doc', () => assertFails(getDoc(bd(as(A), B))))
await t('admin cannot update other tenant business doc', () => assertFails(updateDoc(bd(as(A), B), { profile: { name: 'pwn' } })))
await t('admin cannot read other tenant medicines', () => assertFails(getDoc(bd(as(A), B, 'medicines', 'x1'))))

console.log('3. users collection')
await t('user reads own doc', () => assertSucceeds(getDoc(doc(as(SA), 'users', SA))))
await t('staff cannot read another user doc', () => assertFails(getDoc(doc(as(SA), 'users', A))))
await t('admin reads staff doc in same business', () => assertSucceeds(getDoc(doc(as(A), 'users', SA))))
await t('admin cannot read user in other business', () => assertFails(getDoc(doc(as(A), 'users', SB))))
await t('admin lists users where businessId == own', () => assertSucceeds(getDocs(query(collection(as(A), 'users'), where('businessId', '==', A)))))
await t('admin cannot list users of other business', () => assertFails(getDocs(query(collection(as(A), 'users'), where('businessId', '==', B)))))
await t('staff cannot list users', () => assertFails(getDocs(query(collection(as(SA), 'users'), where('businessId', '==', A)))))
await t('client cannot self-register a users doc (server-only)', () => assertFails(setDoc(doc(as('newU'), 'users', 'newU'), newUser('newU'))))
await t('register with other tenant businessId denied', () => assertFails(setDoc(doc(as('evil'), 'users', 'evil'), newUser('evil', { businessId: A }))))
await t('register as staff denied', () => assertFails(setDoc(doc(as('evil2'), 'users', 'evil2'), newUser('evil2', { role: 'staff', businessId: A }))))
await t('register for someone else uid denied', () => assertFails(setDoc(doc(as('evil3'), 'users', 'victim'), newUser('victim'))))
await t('register with extra privileged field denied', () => assertFails(setDoc(doc(as('evil4'), 'users', 'evil4'), newUser('evil4', { permissions: ['all'] }))))
await t('register inactive denied', () => assertFails(setDoc(doc(as('evil5'), 'users', 'evil5'), newUser('evil5', { isActive: false }))))
await t('unauthenticated registration denied', () => assertFails(setDoc(doc(anon(), 'users', 'anonU'), newUser('anonU'))))
await t('staff cannot overwrite own profile as super_admin', () => assertFails(setDoc(doc(as(SA), 'users', SA), newUser(SA))))
await t('staff cannot escalate own role', () => assertFails(updateDoc(doc(as(SA), 'users', SA), { role: 'super_admin' })))
await t('staff cannot change own businessId', () => assertFails(updateDoc(doc(as(SA), 'users', SA), { businessId: B })))
await t('staff cannot change own isActive', () => assertFails(updateDoc(doc(as(SA), 'users', SA), { isActive: false })))
await t('user can rename self', () => assertSucceeds(updateDoc(doc(as(SA), 'users', SA), { name: 'New Name' })))
await t('admin cannot change own role', () => assertFails(updateDoc(doc(as(A), 'users', A), { role: 'staff' })))
await t('admin cannot disable self', () => assertFails(updateDoc(doc(as(A), 'users', A), { isActive: false })))
await t('admin disables staff in own business', () => assertSucceeds(updateDoc(doc(as(A), 'users', SA), { isActive: false })))
await t('admin cannot change staff role', () => assertFails(updateDoc(doc(as(A), 'users', SA), { role: 'super_admin' })))
await t('admin cannot move staff to other business', () => assertFails(updateDoc(doc(as(A), 'users', SA), { businessId: B })))
await t('admin cannot update staff of other business', () => assertFails(updateDoc(doc(as(A), 'users', SB), { isActive: false })))
await t('admin cannot delete staff user doc', () => assertFails(deleteDoc(doc(as(A), 'users', SA))))
await t('user cannot delete own doc', () => assertFails(deleteDoc(doc(as(SA), 'users', SA))))
await seed()

console.log('5. businesses doc')
await t('client cannot create own business doc (server-only)', () => assertFails(setDoc(bd(as('newB'), 'newB'), { createdAt: now, profile: { name: 'c' } })))
await t('cannot create business doc for other uid', () => assertFails(setDoc(bd(as('newB2'), 'someoneElse'), { createdAt: now })))
await t('staff cannot create a business doc', () => assertFails(setDoc(bd(as(SA), SA), { createdAt: now })))
await t('member reads business doc', () => assertSucceeds(getDoc(bd(as(SA), A))))
await t('admin updates business profile', () => assertSucceeds(updateDoc(bd(as(A), A), { profile: { name: 'Clinic' } })))
await t('admin updates clinicConfig', () => assertSucceeds(updateDoc(bd(as(A), A), { clinicConfig: { academicYear: '2026' } })))
await t('staff cannot update business profile', () => assertFails(updateDoc(bd(as(SA), A), { profile: { name: 'x' } })))
await t('nobody can delete business doc', () => assertFails(deleteDoc(bd(as(A), A))))

console.log('6. role matrix')
for (const c of ['prescriptions', 'prescriptionItems', 'activities']) {
  await t(`staff writes ${c}`, () => assertSucceeds(setDoc(bd(as(SA), A, c, 'new1'), { any: 'shape' })))
}
await t('staff writes a valid patient', () => assertSucceeds(setDoc(bd(as(SA), A, 'patients', 'new1'), patient({ rollNumber: '202601002' }))))
await t('staff writes a valid payment', () => assertSucceeds(setDoc(bd(as(SA), A, 'payments', 'new1'), payment())))
await t('staff cannot delete prescriptionItems', () => assertFails(deleteDoc(bd(as(SA), A, 'prescriptionItems', 'new1'))))
await t('admin deletes prescriptionItems', () => assertSucceeds(deleteDoc(bd(as(A), A, 'prescriptionItems', 'new1'))))
await t('legacy inventory collection is denied', () => assertFails(getDoc(bd(as(A), A, 'inventory', 'x1'))))
await t('legacy staff collection is denied', () => assertFails(getDoc(bd(as(A), A, 'staff', 'x1'))))

console.log('6a. patient and payment integrity')
await t('patient without a name denied', () => assertFails(setDoc(bd(as(SA), A, 'patients', 'bad'), patient({ firstName: '' }))))
await t('patient without a roll number denied', () => assertFails(setDoc(bd(as(SA), A, 'patients', 'bad'), patient({ rollNumber: '' }))))
await t('patient with a non-string phone denied', () => assertFails(setDoc(bd(as(SA), A, 'patients', 'bad'), patient({ phone: 12345 }))))
await t('patient with an oversized note denied', () => assertFails(setDoc(bd(as(SA), A, 'patients', 'bad'), patient({ notes: 'a'.repeat(10001) }))))
await t('staff edits a patient address', () => assertSucceeds(updateDoc(bd(as(SA), A, 'patients', 'x1'), { address: 'New street' })))
await t('patient roll number cannot change', () => assertFails(updateDoc(bd(as(SA), A, 'patients', 'x1'), { rollNumber: '999' })))
await t('patient createdAt cannot change', () => assertFails(updateDoc(bd(as(SA), A, 'patients', 'x1'), { createdAt: '2000-01-01' })))
await t('payment with negative amount denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ amount: -50 }))))
await t('payment with zero amount denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ amount: 0 }))))
await t('payment with an absurd amount denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ amount: 1e12 }))))
await t('payment with a string amount denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ amount: '10' }))))
await t('payment for an unknown patient denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ patientId: 'ghost' }))))
await t('payment without a date denied', () => assertFails(setDoc(bd(as(SA), A, 'payments', 'bad'), payment({ date: '' }))))
await t('admin cannot correct a payment into a negative amount', () => assertFails(updateDoc(bd(as(A), A, 'payments', 'x1'), { amount: -1 })))
await t('staff reads medicines', () => assertSucceeds(getDoc(bd(as(SA), A, 'medicines', 'x1'))))
await t('staff reads diseases', () => assertSucceeds(getDoc(bd(as(SA), A, 'diseases', 'x1'))))
await t('staff reads feeStructures', () => assertSucceeds(getDoc(bd(as(SA), A, 'feeStructures', 'x1'))))
for (const c of ['medicines', 'diseases', 'feeStructures', 'billingCategories']) {
  await t(`staff cannot write ${c}`, () => assertFails(setDoc(bd(as(SA), A, c, 'new1'), { a: 1 })))
  await t(`staff cannot delete ${c}`, () => assertFails(deleteDoc(bd(as(SA), A, c, 'x1'))))
  await t(`admin writes ${c}`, () => assertSucceeds(setDoc(bd(as(A), A, c, 'new1'), { a: 1 })))
}
await t('staff reads flagCategories', () => assertSucceeds(getDoc(doc(as(SA), 'flagCategories', 'potency'))))
await t('staff reads flags', () => assertSucceeds(getDoc(doc(as(SA), 'flagCategories', 'potency', 'flags', 'f1'))))
await t('staff cannot write flagCategories', () => assertFails(setDoc(doc(as(SA), 'flagCategories', 'n'), { a: 1 })))
await t('staff cannot write flags', () => assertFails(setDoc(doc(as(SA), 'flagCategories', 'potency', 'flags', 'n'), { a: 1 })))
await t('admin cannot write the global flag template', () => assertFails(setDoc(doc(as(A), 'flagCategories', 'n'), { a: 1 })))
await t('admin cannot write global template flags', () => assertFails(setDoc(doc(as(A), 'flagCategories', 'potency', 'flags', 'n'), { a: 1 })))
await t('admin of A cannot delete the global template', () => assertFails(deleteDoc(doc(as(A), 'flagCategories', 'potency'))))
await t('admin writes own flag categories', () => assertSucceeds(setDoc(bd(as(A), A, 'flagCategories', 'c1'), { name: 'Potency' })))
await t('admin writes own flags', () => assertSucceeds(setDoc(bd(as(A), A, 'flagCategories', 'c1', 'flags', 'f1'), { label: '30C' })))
await t('staff reads own flag categories', () => assertSucceeds(getDoc(bd(as(SA), A, 'flagCategories', 'c1'))))
await t('staff reads own flags', () => assertSucceeds(getDoc(bd(as(SA), A, 'flagCategories', 'c1', 'flags', 'f1'))))
await t('staff cannot write own flag categories', () => assertFails(setDoc(bd(as(SA), A, 'flagCategories', 'n'), { name: 'x' })))
await t('staff cannot write own flags', () => assertFails(setDoc(bd(as(SA), A, 'flagCategories', 'c1', 'flags', 'n'), { label: 'x' })))
await t('admin of A cannot read tenant B flag categories', () => assertFails(getDoc(bd(as(A), B, 'flagCategories', 'c1'))))
await t('admin of A cannot write tenant B flag categories', () => assertFails(setDoc(bd(as(A), B, 'flagCategories', 'pwn'), { name: 'pwn' })))
await t('admin of A cannot write tenant B flags', () => assertFails(setDoc(bd(as(A), B, 'flagCategories', 'c1', 'flags', 'pwn'), { label: 'pwn' })))


console.log('6b. destructive operations are admin-only')
await t('staff cannot delete patients', () => assertFails(deleteDoc(bd(as(SA), A, 'patients', 'x1'))))
await t('admin deletes patients', () => assertSucceeds(deleteDoc(bd(as(A), A, 'patients', 'x1'))))
await t('staff cannot delete prescriptions', () => assertFails(deleteDoc(bd(as(SA), A, 'prescriptions', 'x1'))))
await t('staff creates a payment', () => assertSucceeds(setDoc(bd(as(SA), A, 'payments', 'pay-new'), payment({ patientId: 'new1', amount: 10 }))))
await t('staff cannot edit a payment', () => assertFails(updateDoc(bd(as(SA), A, 'payments', 'x1'), { amount: 1 })))
await t('staff cannot delete a payment', () => assertFails(deleteDoc(bd(as(SA), A, 'payments', 'x1'))))
await t('admin can correct a payment', () => assertSucceeds(updateDoc(bd(as(A), A, 'payments', 'x1'), { amount: 1 })))
await t('activity feed is append-only (staff update denied)', () => assertFails(updateDoc(bd(as(SA), A, 'activities', 'x1'), { message: 'forged' })))
await t('activity feed is append-only (admin delete denied)', () => assertFails(deleteDoc(bd(as(A), A, 'activities', 'x1'))))
await t('staff appends an activity', () => assertSucceeds(setDoc(bd(as(SA), A, 'activities', 'act-new'), { message: 'ok' })))

console.log('6c. roll number reservations')
await t('staff reserves a roll number', () => assertSucceeds(setDoc(bd(as(SA), A, 'rollNumbers', '202610001'), { patientId: 'p1' })))
await t('roll number cannot be re-issued (update denied)', () => assertFails(setDoc(bd(as(A), A, 'rollNumbers', '202610001'), { patientId: 'p2' })))
await t('roll number cannot be deleted', () => assertFails(deleteDoc(bd(as(A), A, 'rollNumbers', '202610001'))))
await t('other tenant cannot reserve in this business', () => assertFails(setDoc(bd(as(B), A, 'rollNumbers', '202610002'), { patientId: 'p3' })))

console.log('7. stockItems validation')
const S = () => as(SA)
await t('staff creates valid stock item', () => assertSucceeds(setDoc(bd(S(), A, 'stockItems', 'ok'), item())))
await t('item cannot be created with stock already in it', () => assertFails(setDoc(bd(as(A), A, 'stockItems', 'ok2'), item({ totalQuantity: 3, batches: [{ id: 'b', quantity: 3 }] }))))
await t('negative totalQuantity denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ totalQuantity: -1 }))))
await t('string totalQuantity denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ totalQuantity: '5' }))))
await t('negative reorderLevel denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ reorderLevel: -1 }))))
await t('negative reorderQuantity denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ reorderQuantity: -3 }))))
await t('invalid unit denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ unit: 'barrels' }))))
await t('batches not a list denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ batches: 'x' }))))
await t('empty medicineName denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ medicineName: '' }))))
await t('overlong medicineName denied', () => assertFails(setDoc(bd(S(), A, 'stockItems', 'bad'), item({ medicineName: 'a'.repeat(201) }))))
await t('update to negative quantity denied', () => assertFails(updateDoc(bd(S(), A, 'stockItems', 'full'), { totalQuantity: -2 })))
await t('settings update (same quantity) succeeds', () => assertSucceeds(updateDoc(bd(S(), A, 'stockItems', 'full'), { reorderLevel: 9 })))
await t('quantity change without a ledger entry denied', () => assertFails(updateDoc(bd(S(), A, 'stockItems', 'full'), { totalQuantity: 9 })))
const pairedWrite = async (ctx, { itemId = 'full', movementId = 'mv-new', total = 9, mov = {} }) => {
  const b = writeBatch(ctx)
  b.update(bd(ctx, A, 'stockItems', itemId), { totalQuantity: total, lastMovementId: movementId })
  b.set(bd(ctx, A, 'stockMovements', movementId), movement(SA, { stockItemId: itemId, quantity: total - 5, balanceAfter: total, ...mov }))
  await b.commit()
}
await t('quantity change with a matching ledger entry succeeds', () => assertSucceeds(pairedWrite(S(), {})))
await t('ledger entry with the wrong balance denied', () => assertFails(pairedWrite(S(), { mov: { balanceAfter: 8 } })))
await t('ledger entry with the wrong delta denied', () => assertFails(pairedWrite(S(), { mov: { quantity: 1 } })))
await t('ledger entry for another item denied', () => assertFails(pairedWrite(S(), { mov: { stockItemId: 'empty' } })))
await t('an existing ledger entry cannot be reused', () => assertFails(pairedWrite(S(), { movementId: 'm1' })))
await t('quantity change pointing at a missing ledger entry denied', () => assertFails(updateDoc(bd(S(), A, 'stockItems', 'full'), { totalQuantity: 7, lastMovementId: 'nope' })))
await t('delete with stock denied', () => assertFails(deleteDoc(bd(S(), A, 'stockItems', 'full'))))
await t('staff cannot delete even an empty item', () => assertFails(deleteDoc(bd(S(), A, 'stockItems', 'empty'))))
await t('admin deletes empty item', () => assertSucceeds(deleteDoc(bd(as(A), A, 'stockItems', 'empty'))))
await t('admin cannot delete item with stock either', () => assertFails(deleteDoc(bd(as(A), A, 'stockItems', 'full'))))

console.log('8. stockMovements immutable')
await t('staff creates valid movement', () => assertSucceeds(setDoc(bd(S(), A, 'stockMovements', 'n1'), movement(SA))))
await t('negative signed quantity (dispense) allowed', () => assertSucceeds(setDoc(bd(S(), A, 'stockMovements', 'n2'), movement(SA, { type: 'dispense', quantity: -2, balanceAfter: 3 }))))
await t('zero quantity denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(SA, { quantity: 0 }))))
await t('invalid type denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(SA, { type: 'steal' }))))
await t('spoofed performedById denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(A))))
await t('missing performedById denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(SA, { performedById: null }))))
await t('non-string createdAt denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(SA, { createdAt: 12345 }))))
await t('negative balanceAfter denied', () => assertFails(setDoc(bd(S(), A, 'stockMovements', 'b'), movement(SA, { balanceAfter: -1 }))))
await t('staff cannot update movement', () => assertFails(updateDoc(bd(S(), A, 'stockMovements', 'm1'), { notes: 'x' })))
await t('admin cannot update movement', () => assertFails(updateDoc(bd(as(A), A, 'stockMovements', 'm1'), { notes: 'x' })))
await t('staff cannot delete movement', () => assertFails(deleteDoc(bd(S(), A, 'stockMovements', 'm1'))))
await t('admin cannot delete movement', () => assertFails(deleteDoc(bd(as(A), A, 'stockMovements', 'm1'))))
await t('movements list query (createdAt desc, limit 300) allowed', () => assertSucceeds(getDocs(query(collection(S(), 'businesses', A, 'stockMovements'), orderBy('createdAt', 'desc'), limit(300)))))
await t('movements list of other tenant denied', () => assertFails(getDocs(query(collection(S(), 'businesses', B, 'stockMovements'), orderBy('createdAt', 'desc'), limit(300)))))

console.log(`\n${passed} passed, ${failed} failed (${passed + failed} total)`)
await env.cleanup()
process.exit(failed ? 1 : 0)
