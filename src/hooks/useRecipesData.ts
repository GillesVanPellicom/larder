import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CreateRecipeDTO,
  DatabaseConfig,
  MetadataConfig,
  Recipe,
  RecipeConflict,
  TagCategory,
} from '@/shared/types'
import { configApi, conflictsApi, databaseApi, recipesApi, tagsApi } from '@/services/api'

export function useRecipesData() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [metadataConfig, setMetadataConfig] = useState<MetadataConfig | null>(null)
  const [conflicts, setConflicts] = useState<RecipeConflict[]>([])
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDatabaseConfig = useCallback(async () => {
    try {
      const data = await databaseApi.getConfig()
      setDbConfig(data)
      return data
    } catch (err) {
      console.error('Failed to load database config:', err)
      setDbConfig({ configured: false, healthy: false, error: 'Database unreachable' })
      return null
    }
  }, [])

  const fetchRecipes = useCallback(async () => {
    try {
      const data = await recipesApi.getAll()
      setRecipes(data)
    } catch (err) {
      console.error('Failed to load recipes:', err)
      setRecipes([])
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await tagsApi.getAll()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load tag categories:', err)
    }
  }, [])

  const fetchMetadataConfig = useCallback(async () => {
    try {
      const data = await configApi.get()
      setMetadataConfig(data)
    } catch (err) {
      console.error('Failed to load metadata config:', err)
    }
  }, [])

  const fetchConflicts = useCallback(async () => {
    try {
      const data = await conflictsApi.get()
      setConflicts(data.conflicts || [])
    } catch (err) {
      console.error('Failed to load conflicts:', err)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const db = await fetchDatabaseConfig()
    if (db && db.configured && db.healthy) {
      await Promise.allSettled([
        fetchRecipes(),
        fetchCategories(),
        fetchMetadataConfig(),
        fetchConflicts(),
      ])
    } else {
      setRecipes([])
      setCategories([])
      setConflicts([])
    }
    setLoading(false)
  }, [fetchDatabaseConfig, fetchRecipes, fetchCategories, fetchMetadataConfig, fetchConflicts])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const saveRecipe = useCallback(
    async (data: CreateRecipeDTO, id?: number): Promise<Recipe> => {
      const saved = id ? await recipesApi.update(id, data) : await recipesApi.create(data)
      await Promise.all([fetchRecipes(), fetchConflicts()])
      return saved
    },
    [fetchRecipes, fetchConflicts]
  )

  const deleteRecipe = useCallback(
    async (id: number): Promise<void> => {
      await recipesApi.delete(id)
      await Promise.all([fetchRecipes(), fetchConflicts()])
    },
    [fetchRecipes, fetchConflicts]
  )

  const saveConfig = useCallback(
    async (newConfig: MetadataConfig): Promise<void> => {
      const updated = await configApi.update(newConfig)
      setMetadataConfig(updated)
      await fetchConflicts()
    },
    [fetchConflicts]
  )

  const violationsMap = useMemo(() => {
    const map = new Map<number, RecipeConflict['violations']>()
    for (const c of conflicts) {
      map.set(c.recipe.id, c.violations)
    }
    return map
  }, [conflicts])

  const isDatabaseConnected = Boolean(dbConfig?.configured && dbConfig?.healthy)

  return {
    recipes,
    categories,
    metadataConfig,
    conflicts,
    violationsMap,
    dbConfig,
    isDatabaseConnected,
    loading,
    loadAll,
    fetchDatabaseConfig,
    fetchRecipes,
    fetchCategories,
    fetchMetadataConfig,
    fetchConflicts,
    saveRecipe,
    deleteRecipe,
    saveConfig,
  }
}

