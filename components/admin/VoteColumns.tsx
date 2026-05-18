import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { TableCell, TableHead } from '@/components/ui/table'

export function VoteColumnHeaders() {
  return (
    <>
      <TableHead className="font-mono">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp size={12} strokeWidth={1.5} />
          likes
        </span>
      </TableHead>
      <TableHead className="font-mono">
        <span className="inline-flex items-center gap-1">
          <ThumbsDown size={12} strokeWidth={1.5} />
          dislikes
        </span>
      </TableHead>
    </>
  )
}

export function VoteCounts({ likes, dislikes }: { likes: number; dislikes: number }) {
  return (
    <>
      <TableCell className="px-4 py-2 font-mono text-xs">{likes}</TableCell>
      <TableCell className="px-4 py-2 font-mono text-xs">{dislikes}</TableCell>
    </>
  )
}
