import { db } from '../db/index.js';
import { subscriptionPlans } from '../db/schema/subscriptionPlans.js';
import { eq } from 'drizzle-orm';

const PLANS = [
  { name: 'Free', slug: 'free', priceMonthly: '0', features: ['3 analyses per month', 'Buy & Hold only', 'Basic breakdown'] },
  { name: 'Starter', slug: 'starter', priceMonthly: '1900', features: ['50 analyses per month', 'All 4 strategies', 'Full breakdown', 'PDF export'] },
  { name: 'Pro', slug: 'pro', priceMonthly: '4900', features: ['Unlimited analyses', 'Priority AI scraping', 'Share links', 'Team access (up to 5)'] },
  { name: 'Lifetime', slug: 'lifetime', priceMonthly: '0', features: ['Unlimited analyses forever', 'All strategies', 'All export options', 'Priority support'] },
];

async function main() {
  for (const plan of PLANS) {
    const existing = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, plan.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`Created plan: ${plan.name}`);
    } else {
      console.log(`Plan already exists: ${plan.name}`);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
