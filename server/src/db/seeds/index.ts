import { db, pool } from '../index'
import { seedProduction } from './production'
import { seedDev } from './dev'

export async function runSeeds(options: { productionOnly?: boolean; reset?: boolean } = {}) {
  try {
    if (options.reset) {
      console.log('[Seed] Resetting database tables...')
      await pool.query(
        'TRUNCATE recipes, tag_categories, filter_templates, metadata_config, ingredients, recipe_ingredients, stores, shopping_list_items, shopping_list_history, shopping_list_store_assignments RESTART IDENTITY CASCADE;'
      )
    }

    console.log('[Seed] Seeding production data (categories, configuration, templates)...')
    await seedProduction(db)

    if (!options.productionOnly) {
      console.log('[Seed] Seeding development data (placeholder recipes)...')
      await seedDev(db)
    }

    console.log('[Seed] Seeding process completed successfully.')
  } catch (err) {
    console.error('[Seed] Error during seeding:', err)
    throw err
  }
}

// Support direct execution via tsx CLI
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('seeds/index.ts') ||
    process.argv[1].endsWith('seeds/index.js') ||
    process.argv[1].endsWith('seeds/index'))

if (isDirectExecution) {
  const isProdOnly = process.argv.includes('--prod')
  const shouldReset = process.argv.includes('--reset')

  runSeeds({ productionOnly: isProdOnly, reset: shouldReset })
    .then(() => {
      console.log('[Seed] Exiting seed process.')
      process.exit(0)
    })
    .catch(() => {
      process.exit(1)
    })
}
