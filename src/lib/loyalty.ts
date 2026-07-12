/**
 * Loyalty progress is derived from real appointment history (completed count
 * and redemption count), never from a standalone counter — so it can't drift
 * out of sync if a redemption is ever missed or double-counted.
 */
export interface LoyaltyProgress {
  visitsRequired: number
  rewardDescription: string
  completedCount: number
  redeemedCount: number
  /** Visits accrued toward the next reward, after accounting for redemptions already used. */
  progress: number
  /** Rewards earned but not yet redeemed. */
  availableRewards: number
}

export async function getLoyaltyProgress(db: any, clientId: string): Promise<LoyaltyProgress> {
  const [{ data: settings }, { count: completedCount }, { count: redeemedCount }] = await Promise.all([
    db.from('loyalty_settings').select('visits_required, reward_description').eq('active', true).limit(1).maybeSingle(),
    db.from('appointments').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'completed'),
    db.from('loyalty_redemptions').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
  ])

  const visitsRequired = settings?.visits_required ?? 10
  const rewardDescription = settings?.reward_description ?? 'Um atendimento grátis'
  const completed = completedCount ?? 0
  const redeemed = redeemedCount ?? 0

  const earnedRewards = Math.floor(completed / visitsRequired)
  const availableRewards = Math.max(0, earnedRewards - redeemed)
  const progress = completed % visitsRequired

  return { visitsRequired, rewardDescription, completedCount: completed, redeemedCount: redeemed, progress, availableRewards }
}
