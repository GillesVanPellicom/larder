import { router } from './trpc'
import { healthRouter } from './routers/health'
import { databaseRouter } from './routers/database'
import { configRouter } from './routers/config'
import { tagsRouter } from './routers/tags'
import { ingredientsRouter } from './routers/ingredients'
import { storesRouter } from './routers/stores'
import { recipesRouter } from './routers/recipes'
import { filterTemplatesRouter } from './routers/filterTemplates'
import { shoppingListRouter } from './routers/shoppingList'
import { storageRouter } from './routers/storage'

export const appRouter = router({
  health: healthRouter,
  database: databaseRouter,
  config: configRouter,
  tags: tagsRouter,
  ingredients: ingredientsRouter,
  stores: storesRouter,
  recipes: recipesRouter,
  filterTemplates: filterTemplatesRouter,
  shoppingList: shoppingListRouter,
  storage: storageRouter,
})

export type AppRouter = typeof appRouter
export { createContext } from './trpc'
