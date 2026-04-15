'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface EnrichmentResult {
  success: boolean
  error?: string
}

export async function triggerEnrichment(contactId: string): Promise<EnrichmentResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if there's an enrichment job in the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentJob } = await supabase
    .from('enrichment_jobs')
    .select('id, created_at')
    .eq('contact_id', contactId)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentJob) {
    return { success: false, error: 'Aguarde 24h desde o último enriquecimento' }
  }

  // Create enrichment job with status='pendente'
  const { error } = await supabase.from('enrichment_jobs').insert({
    contact_id: contactId,
    status: 'pendente',
    triggered_by: 'manual',
  })

  if (error) {
    return { success: false, error: 'Erro ao criar job de enriquecimento' }
  }

  return { success: true }
}
