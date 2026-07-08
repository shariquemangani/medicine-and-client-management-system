'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared'
import type { PrescriptionItem } from '@/types'

interface PrescriptionsResultDialogProps {
  result: PrescriptionItem | null
  onClose: () => void
}

export function PrescriptionsResultDialog({ result, onClose }: PrescriptionsResultDialogProps) {

  return (
    <Dialog open={!!result} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="exams-dialog print:block">
        {result && (
          <>
            <DialogHeader>
              <DialogTitle>
                {`Result — ${result.patientName}`}
              </DialogTitle>
            </DialogHeader>
            <div className="clinic-table-shell overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="clinic-table-head hover:bg-transparent">
                    <TableHead>{'Subject'}</TableHead>
                    <TableHead>{'Score'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.marks.map((m) => (
                    <TableRow key={m.subject}>
                      <TableCell>{m.subject}</TableCell>
                      <TableCell className="tabular-nums">
                        {m.score}/{m.maxScore}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {`Total: ${result.total}/${result.maxTotal} (${result.percentage}%)`}{' '}
              — <StatusBadge status={result.status} />
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
