import { Send } from 'lucide-react'
import { TableCell, TableHead } from '@/components/ui/table'

export function ShareColumnHeader() {
  return (
    <TableHead className="font-mono">
      <span className="inline-flex items-center gap-1">
        <Send size={12} strokeWidth={1.5} />
        shares
      </span>
    </TableHead>
  )
}

export function ShareCount({ count }: { count: number }) {
  return (
    <TableCell className="px-4 py-2 font-mono text-xs">{count}</TableCell>
  )
}
