import { describe, it, expect } from 'vitest'
import { getLoyaltyProgress } from './loyalty'

// Mimics the three chained Supabase calls getLoyaltyProgress fires in
// parallel: loyalty_settings select, appointments count, redemptions count.
function mockDb(opts: { visitsRequired?: number; rewardDescription?: string; completedCount: number; redeemedCount: number }) {
  return {
    from: (table: string) => {
      if (table === 'loyalty_settings') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: opts.visitsRequired !== undefined
                    ? { visits_required: opts.visitsRequired, reward_description: opts.rewardDescription ?? 'Um atendimento grátis' }
                    : null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'appointments') {
        return { select: () => ({ eq: () => ({ eq: async () => ({ count: opts.completedCount }) }) }) }
      }
      // loyalty_redemptions
      return { select: () => ({ eq: async () => ({ count: opts.redeemedCount }) }) }
    },
  }
}

describe('getLoyaltyProgress', () => {
  it('computes progress as completed visits mod visits required', async () => {
    const progress = await getLoyaltyProgress(mockDb({ visitsRequired: 10, completedCount: 7, redeemedCount: 0 }), 'client-1')
    expect(progress.progress).toBe(7)
    expect(progress.availableRewards).toBe(0)
  })

  it('grants a reward once completed visits reach the threshold', async () => {
    const progress = await getLoyaltyProgress(mockDb({ visitsRequired: 10, completedCount: 10, redeemedCount: 0 }), 'client-1')
    expect(progress.availableRewards).toBe(1)
    expect(progress.progress).toBe(0)
  })

  it('subtracts already-redeemed rewards from what is currently available', async () => {
    // 23 completed visits at a 10-visit threshold earns 2 rewards; 1 already redeemed.
    const progress = await getLoyaltyProgress(mockDb({ visitsRequired: 10, completedCount: 23, redeemedCount: 1 }), 'client-1')
    expect(progress.availableRewards).toBe(1)
    expect(progress.progress).toBe(3)
  })

  it('never lets availableRewards go negative if redemptions outpace earned rewards', async () => {
    const progress = await getLoyaltyProgress(mockDb({ visitsRequired: 10, completedCount: 5, redeemedCount: 3 }), 'client-1')
    expect(progress.availableRewards).toBe(0)
  })

  it('falls back to defaults when no active loyalty_settings row exists', async () => {
    const progress = await getLoyaltyProgress(mockDb({ completedCount: 3, redeemedCount: 0 }), 'client-1')
    expect(progress.visitsRequired).toBe(10)
    expect(progress.rewardDescription).toBe('Um atendimento grátis')
  })
})
