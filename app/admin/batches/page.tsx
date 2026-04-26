import { createClient } from '@/lib/supabase-server'
import { BatchControlPanel } from '@/components/admin/BatchControlPanel'

export default async function BatchesPage() {
  const supabase = await createClient()

  const { data: batches, error } = await supabase
    .from('batches')
    .select(
      'id, anthropic_batch_id, batch_month, status, total_requests, succeeded, errored, is_retry, parent_batch_id, submitted_at, completed_at'
    )
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('[admin/batches] failed to load batches:', error.message)
  }

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm font-mono">{'// batches'}</p>
      {error ? (
        <p className="text-error text-sm font-mono">
          {'// error loading batches — check server logs'}
        </p>
      ) : (
        <BatchControlPanel batches={batches ?? []} />
      )}
    </div>
  )
}
