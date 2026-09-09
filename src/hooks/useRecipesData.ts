import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CreateRecipeDTO,
  DatabaseConfig,
  FilterCriteria,
  MetadataConfig,
  Recipe,
  RecipeConflict,
  RecipeQueryParams,
  RecipeSortOption,
  TagCategory,
} from '@/shared/types'
import { configApi, conflictsApi, databaseApi, recipesApi, tagsApi } from '@/services/api'
import { DEFAULT_FILTER_CRITERIA, countActiveFilters } from '@/lib/recipeFilters'
import { useDeviceSettings } from '@/lib/deviceSettings'

export function useRecipesData() {
  const { settings } = useDeviceSettings()
  const pageSize = settings.recipesPerPage || 12

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<RecipeSortOption>('created_desc')

  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(DEFAULT_FILTER_CRITERIA)
  const [allIngredients, setAllIngredients] = useState<string[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [metadataConfig, setMetadataConfig] = useState<MetadataConfig | null>(null)
  const [conflicts, setConflicts] = useState<RecipeConflict[]>([])
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipesLoading, setRecipesLoading] = useState(false)

  // Track latest request to avoid race conditions
  const latestRequestId = useRef(0)

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

  const fetchIngredients = useCallback(async () => {
    try {
      const list = await recipesApi.getIngredients()
      setAllIngredients(list)
    } catch (err) {
      console.error('Failed to load ingredients:', err)
    }
  }, [])

  const fetchRecipes = useCallback(
    async (
      overrideCriteria?: FilterCriteria,
      overridePage?: number,
      overridePageSize?: number,
      overrideSortBy?: RecipeSortOption
    ) => {
      const criteria = overrideCriteria || filterCriteria
      const page = overridePage !== undefined ? overridePage : currentPage
      const size = overridePageSize !== undefined ? overridePageSize : pageSize
      const sort = overrideSortBy || sortBy

      const requestId = ++latestRequestId.current
      setRecipesLoading(true)

      try {
        const queryParams: RecipeQueryParams = {
          searchQuery: criteria.searchQuery.trim() || undefined,
          selectedIngredients: criteria.selectedIngredients,
          ingredientsMatchMode: criteria.matchModePerElement.ingredients,
          selectedTags: criteria.selectedTags,
          tagsMatchMode: criteria.matchModePerElement.tags,
          categoryTagsMatchMode: criteria.matchModePerElement.categoryTags,
          maxTotalTime: criteria.maxTotalTime,
          maxPrepTime: criteria.maxPrepTime,
          maxCookTime: criteria.maxCookTime,
          hasImage: criteria.hasImage,
          onlyConflicts: criteria.onlyConflicts,
          sortBy: sort,
          page,
          pageSize: size,
        }

        const data = await recipesApi.getAll(queryParams)

        // Only commit state if this is the newest request
        if (requestId === latestRequestId.current) {
          setRecipes(data.items)
          setTotalCount(data.totalCount)
          setTotalPages(data.totalPages)
          setCurrentPage(data.page)
        }
      } catch (err) {
        if (requestId === latestRequestId.current) {
          console.error('Failed to load recipes:', err)
          setRecipes([])
          setTotalCount(0)
          setTotalPages(1)
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setRecipesLoading(false)
        }
      }
    },
    [filterCriteria, currentPage, pageSize, sortBy]
  )

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
        fetchIngredients(),
        fetchCategories(),
        fetchMetadataConfig(),
        fetchConflicts(),
      ])
    } else {
      setRecipes([])
      setTotalCount(0)
      setTotalPages(1)
      setCategories([])
      setConflicts([])
      setAllIngredients([])
    }
    setLoading(false)
  }, [fetchDatabaseConfig, fetchRecipes, fetchIngredients, fetchCategories, fetchMetadataConfig, fetchConflicts])

  // Initial load
  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Refetch recipes when criteria, page, or pageSize changes
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (dbConfig?.configured && dbConfig?.healthy) {
      void fetchRecipes()
    }
  }, [filterCriteria, currentPage, pageSize, sortBy, dbConfig?.configured, dbConfig?.healthy, fetchRecipes])

  // Handlers for modifying filter criteria (automatically resets page to 1)
  const updateFilterCriteria = useCallback(
    (updater: FilterCriteria | ((prev: FilterCriteria) => FilterCriteria)) => {
      setFilterCriteria((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return next
      })
      setCurrentPage(1)
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFilterCriteria(DEFAULT_FILTER_CRITERIA)
    setCurrentPage(1)
  }, [])

  const saveRecipe = useCallback(
    async (data: CreateRecipeDTO, id?: number): Promise<Recipe> => {
      const saved = id ? await recipesApi.update(id, data) : await recipesApi.create(data)
      await Promise.all([fetchRecipes(), fetchIngredients(), fetchConflicts()])
      return saved
    },
    [fetchRecipes, fetchIngredients, fetchConflicts]
  )

  const deleteRecipe = useCallback(
    async (id: number): Promise<void> => {
      await recipesApi.delete(id)
      await Promise.all([fetchRecipes(), fetchIngredients(), fetchConflicts()])
    },
    [fetchRecipes, fetchIngredients, fetchConflicts]
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

  const activeFiltersCount = useMemo(() => {
    return countActiveFilters(filterCriteria)
  }, [filterCriteria])

  const isDatabaseConnected = Boolean(dbConfig?.configured && dbConfig?.healthy)

  return {
    recipes,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    filterCriteria,
    setFilterCriteria: updateFilterCriteria,
    resetFilters,
    activeFiltersCount,
    allIngredients,
    categories,
    metadataConfig,
    conflicts,
    violationsMap,
    dbConfig,
    isDatabaseConnected,
    loading: loading || recipesLoading,
    loadAll,
    fetchDatabaseConfig,
    fetchRecipes,
    fetchIngredients,
    fetchCategories,
    fetchMetadataConfig,
    fetchConflicts,
    saveRecipe,
    deleteRecipe,
    saveConfig,
  }
}
