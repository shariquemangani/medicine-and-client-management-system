import {
  buildPatientRollNumber,
  formatPatientRollNumber,
  getNextPatientRollSerial,
  getPatientRollMonthStamp,
} from '../src/lib/patients/patient-roll-number'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(getPatientRollMonthStamp('2026-07-07') === '202607', 'uses year + month from visit date')
assert(formatPatientRollNumber('2026-07-07', 1) === '202607001', 'formats first serial')
assert(formatPatientRollNumber('2026-07-15', 26) === '202607026', 'formats monthly serial')
assert(formatPatientRollNumber('2026-08-01', 1) === '202608001', 'resets serial for new month')
assert(
  getNextPatientRollSerial(['202607001', '202607026', 'MF-OLD'], '2026-07-20') === 27,
  'increments serial within the same month'
)
assert(
  getNextPatientRollSerial(['202607026'], '2026-08-02') === 1,
  'starts at 1 when month changes'
)
assert(
  getNextPatientRollSerial(['20260707001'], '2026-07-07') === 1,
  'ignores legacy daily IDs when counting'
)
assert(
  buildPatientRollNumber('2026-07-07', ['202607001', '202607025']) === '202607026',
  'builds next monthly roll number'
)

console.log('verify-patient-roll-number: all checks passed')
