export type { StoreRecord } from '@/shared/types'

import type {
  CreateFilterTemplateDTO,
  CreateRecipeDTO,
  DatabaseConfig,
  FilterTemplate,
  MetadataConfig,
  PaginatedRecipesResponse,
  Recipe,
  RecipeConflict,
  RecipeQueryParams,
  ShoppingListHistoryItem,
  ShoppingListItem,
  StorageConfig,
  StorageConfigDTO,
  StoresQueryParams,
  StoresSearchResponse,
  TagCategory,
  UpdateFilterTemplateDTO,
  UploadImageResponse,
} from '@/shared/types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export const recipesApi = {
  async getAll(params?: RecipeQueryParams): Promise<PaginatedRecipesResponse> {
    const searchParams = new URLSearchParams()
    if (params) {
      if (params.searchQuery) searchParams.set('searchQuery', params.searchQuery)
      if (params.selectedIngredients && params.selectedIngredients.length > 0) {
        searchParams.set('selectedIngredients', JSON.stringify(params.selectedIngredients))
      }
      if (params.ingredientsMatchMode) {
        searchParams.set('ingredientsMatchMode', params.ingredientsMatchMode)
      }
      if (params.selectedTags && Object.keys(params.selectedTags).length > 0) {
        searchParams.set('selectedTags', JSON.stringify(params.selectedTags))
      }
      if (params.tagsMatchMode) {
        searchParams.set('tagsMatchMode', params.tagsMatchMode)
      }
      if (params.categoryTagsMatchMode && Object.keys(params.categoryTagsMatchMode).length > 0) {
        searchParams.set('categoryTagsMatchMode', JSON.stringify(params.categoryTagsMatchMode))
      }
      if (params.maxTotalTime !== undefined) {
        searchParams.set('maxTotalTime', String(params.maxTotalTime))
      }
      if (params.maxPrepTime !== undefined) {
        searchParams.set('maxPrepTime', String(params.maxPrepTime))
      }
      if (params.maxCookTime !== undefined) {
        searchParams.set('maxCookTime', String(params.maxCookTime))
      }
      if (params.hasImage !== undefined && params.hasImage !== null && params.hasImage !== 'any') {
        searchParams.set('hasImage', String(params.hasImage))
      }
      if (params.onlyConflicts !== undefined && params.onlyConflicts !== null && params.onlyConflicts !== 'any') {
        searchParams.set('onlyConflicts', String(params.onlyConflicts))
      }
      if (params.sortBy) {
        searchParams.set('sortBy', params.sortBy)
      }
      if (params.page) {
        searchParams.set('page', String(params.page))
      }
      if (params.pageSize) {
        searchParams.set('pageSize', String(params.pageSize))
      }
    }

    const qs = searchParams.toString()
    const url = qs ? `/api/recipes?${qs}` : '/api/recipes'
    const res = await fetch(url)
    return handleResponse<PaginatedRecipesResponse>(res)
  },

  async getIngredients(): Promise<string[]> {
    const res = await fetch('/api/recipes/ingredients')
    return handleResponse<string[]>(res)
  },

  async getById(id: number): Promise<Recipe> {
    const res = await fetch(`/api/recipes/${id}`)
    return handleResponse<Recipe>(res)
  },

  async create(data: CreateRecipeDTO): Promise<Recipe> {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Recipe>(res)
  },

  async update(id: number, data: Partial<CreateRecipeDTO>): Promise<Recipe> {
    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Recipe>(res)
  },

  async delete(id: number): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    return handleResponse<{ success: boolean; id: number }>(res)
  },
}

export interface IngredientRecord {
  id: number
  name: string
  created_at?: string
  usage_count?: number
}

export interface IngredientsSearchResponse {
  items: IngredientRecord[]
  totalCount: number
  totalPages?: number
  currentPage?: number
  hasMore: boolean
}

export interface IngredientsQueryParams {
  q?: string
  page?: number
  pageSize?: number
  limit?: number
  offset?: number
  sortBy?: 'name' | 'created_at' | 'usage_count'
  sortOrder?: 'asc' | 'desc'
}

export const ingredientsApi = {
  async search(q: string, limit = 10, offset = 0): Promise<IngredientsSearchResponse> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (limit) params.set('limit', String(limit))
    if (offset) params.set('offset', String(offset))
    const res = await fetch(`/api/ingredients?${params.toString()}`)
    return handleResponse<IngredientsSearchResponse>(res)
  },

  async getPaginated(params?: IngredientsQueryParams): Promise<IngredientsSearchResponse> {
    const searchParams = new URLSearchParams()
    if (params) {
      if (params.q) searchParams.set('q', params.q)
      if (params.page !== undefined) searchParams.set('page', String(params.page))
      if (params.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize))
      if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
      if (params.offset !== undefined) searchParams.set('offset', String(params.offset))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    }
    const qs = searchParams.toString()
    const url = qs ? `/api/ingredients?${qs}` : '/api/ingredients'
    const res = await fetch(url)
    return handleResponse<IngredientsSearchResponse>(res)
  },

  async getAll(): Promise<{ id: number; name: string }[]> {
    const res = await fetch('/api/ingredients/all')
    return handleResponse<{ id: number; name: string }[]>(res)
  },

  async create(name: string): Promise<{ id: number; name: string }> {
    const res = await fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse<{ id: number; name: string }>(res)
  },

  async update(id: number, name: string): Promise<{ id: number; name: string; created_at?: string; updated_at?: string }> {
    const res = await fetch(`/api/ingredients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse<{ id: number; name: string; created_at?: string; updated_at?: string }>(res)
  },
}

export const storesApi = {
  async search(q: string, limit = 10, offset = 0): Promise<StoresSearchResponse> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (limit) params.set('limit', String(limit))
    if (offset) params.set('offset', String(offset))
    const res = await fetch(`/api/stores?${params.toString()}`)
    return handleResponse<StoresSearchResponse>(res)
  },

  async getPaginated(params?: StoresQueryParams): Promise<StoresSearchResponse> {
    const searchParams = new URLSearchParams()
    if (params) {
      if (params.q) searchParams.set('q', params.q)
      if (params.page !== undefined) searchParams.set('page', String(params.page))
      if (params.pageSize !== undefined) searchParams.set('pageSize', String(params.pageSize))
      if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
      if (params.offset !== undefined) searchParams.set('offset', String(params.offset))
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    }
    const qs = searchParams.toString()
    const url = qs ? `/api/stores?${qs}` : '/api/stores'
    const res = await fetch(url)
    return handleResponse<StoresSearchResponse>(res)
  },

  async getAll(): Promise<{ id: number; name: string }[]> {
    const res = await fetch('/api/stores/all')
    return handleResponse<{ id: number; name: string }[]>(res)
  },

  async create(name: string): Promise<{ id: number; name: string; created_at?: string }> {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse<{ id: number; name: string; created_at?: string }>(res)
  },

  async update(id: number, name: string): Promise<{ id: number; name: string; created_at?: string; updated_at?: string }> {
    const res = await fetch(`/api/stores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return handleResponse<{ id: number; name: string; created_at?: string; updated_at?: string }>(res)
  },
}

export const configApi = {
  async get(): Promise<MetadataConfig> {
    const res = await fetch('/api/config')
    return handleResponse<MetadataConfig>(res)
  },

  async update(config: MetadataConfig): Promise<MetadataConfig> {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    return handleResponse<MetadataConfig>(res)
  },
}

export const conflictsApi = {
  async get(): Promise<{ totalConflicts: number; conflicts: RecipeConflict[] }> {
    const res = await fetch('/api/conflicts')
    return handleResponse<{ totalConflicts: number; conflicts: RecipeConflict[] }>(res)
  },
}

export interface TagUsageResponse {
  categoryId: string
  tag: string
  count: number
  recipes: { id: number; title: string }[]
}

export interface TagDeleteConflict {
  error: string
  usageCount: number
  recipes: { id: number; title: string }[]
  availableTags: string[]
}

export const tagsApi = {
  async getAll(): Promise<TagCategory[]> {
    const res = await fetch('/api/tags')
    return handleResponse<TagCategory[]>(res)
  },

  async createCategory(data: {
    id: string
    name: string
    exclusive?: boolean
    min_tags?: number
    max_tags?: number
    tags?: string[]
  }): Promise<TagCategory> {
    const res = await fetch('/api/tags/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<TagCategory>(res)
  },

  async updateCategory(
    id: string,
    data: { name?: string; exclusive?: boolean; min_tags?: number; max_tags?: number; tags?: string[] }
  ): Promise<TagCategory> {
    const res = await fetch(`/api/tags/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<TagCategory>(res)
  },

  async deleteCategory(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`/api/tags/categories/${id}`, { method: 'DELETE' })
    return handleResponse<{ success: boolean; id: string }>(res)
  },

  async addTag(categoryId: string, tag: string): Promise<TagCategory> {
    const res = await fetch(`/api/tags/${categoryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    return handleResponse<TagCategory>(res)
  },

  async renameTag(
    categoryId: string,
    oldName: string,
    newName: string
  ): Promise<{ success: boolean; categoryId: string; oldName: string; newName: string; affectedRecipesCount: number }> {
    const res = await fetch(`/api/tags/${categoryId}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName }),
    })
    return handleResponse(res)
  },

  async getTagUsage(categoryId: string, tag: string): Promise<TagUsageResponse> {
    const res = await fetch(`/api/tags/${categoryId}/${encodeURIComponent(tag)}/usage`)
    return handleResponse<TagUsageResponse>(res)
  },

  async deleteTag(
    categoryId: string,
    tag: string,
    resolution?: 'strip' | 'reassign',
    reassignTo?: string
  ): Promise<
    | { success: true; categoryId: string; deletedTag: string; resolution: string; affectedRecipesCount: number }
    | TagDeleteConflict
  > {
    const res = await fetch(`/api/tags/${categoryId}/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, reassignTo }),
    })

    if (res.status === 409) {
      return res.json() as Promise<TagDeleteConflict>
    }
    return handleResponse(res)
  },
}

export const databaseApi = {
  async getConfig(): Promise<DatabaseConfig> {
    const res = await fetch('/api/database/config')
    return handleResponse<DatabaseConfig>(res)
  },

  async testConnection(connectionString: string): Promise<{ healthy: boolean; error?: string; databaseVersion?: string }> {
    const res = await fetch('/api/database/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString }),
    })
    return handleResponse<{ healthy: boolean; error?: string; databaseVersion?: string }>(res)
  },

  async saveConfig(connectionString: string): Promise<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean; error?: string; databaseVersion?: string }> {
    const res = await fetch('/api/database/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString }),
    })
    return handleResponse<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean; error?: string; databaseVersion?: string }>(res)
  },

  async disconnect(): Promise<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean }> {
    const res = await fetch('/api/database/config', {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean }>(res)
  },
}

export const storageApi = {
  async getConfig(): Promise<StorageConfig> {
    const res = await fetch('/api/storage/config')
    return handleResponse<StorageConfig>(res)
  },

  async testConnection(config: StorageConfigDTO): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/storage/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    return handleResponse<{ success: boolean; error?: string }>(res)
  },

  async saveConfig(config: StorageConfigDTO): Promise<{ success: boolean; configured: boolean; endpoint?: string; bucket?: string; error?: string }> {
    const res = await fetch('/api/storage/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    return handleResponse<{ success: boolean; configured: boolean; endpoint?: string; bucket?: string; error?: string }>(res)
  },

  async disconnect(): Promise<{ success: boolean; configured: boolean }> {
    const res = await fetch('/api/storage/config', {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean; configured: boolean }>(res)
  },
}

export const imagesApi = {
  async upload(blob: Blob, filename = 'image.webp'): Promise<UploadImageResponse> {
    const res = await fetch('/api/images/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/webp',
        'X-Filename': filename,
      },
      body: blob,
    })
    return handleResponse<UploadImageResponse>(res)
  },
}

export const filterTemplatesApi = {
  async getAll(): Promise<FilterTemplate[]> {
    const res = await fetch('/api/filter-templates')
    return handleResponse<FilterTemplate[]>(res)
  },

  async create(dto: CreateFilterTemplateDTO): Promise<FilterTemplate> {
    const res = await fetch('/api/filter-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<FilterTemplate>(res)
  },

  async update(id: number, dto: UpdateFilterTemplateDTO): Promise<FilterTemplate> {
    const res = await fetch(`/api/filter-templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<FilterTemplate>(res)
  },

  async apply(id: number): Promise<FilterTemplate> {
    const res = await fetch(`/api/filter-templates/${id}/apply`, {
      method: 'POST',
    })
    return handleResponse<FilterTemplate>(res)
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`/api/filter-templates/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok && res.status !== 204) {
      const errorBody = await res.json().catch(() => ({}))
      throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`)
    }
  },
}

export const shoppingListApi = {
  async get(): Promise<{
    items: ShoppingListItem[]
    history: ShoppingListHistoryItem[]
    storeAssignments?: Record<string, string[]>
  }> {
    const res = await fetch('/api/shopping-list')
    return handleResponse<{
      items: ShoppingListItem[]
      history: ShoppingListHistoryItem[]
      storeAssignments?: Record<string, string[]>
    }>(res)
  },

  async updateStoreAssignments(assignments: Record<string, string[]>): Promise<{ success: boolean; assignments: Record<string, string[]> }> {
    const res = await fetch('/api/shopping-list/store-assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments }),
    })
    return handleResponse<{ success: boolean; assignments: Record<string, string[]> }>(res)
  },

  async add(recipeId: number, checkedIngredients?: string[], multiplier?: number): Promise<ShoppingListItem> {
    const res = await fetch('/api/shopping-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, checkedIngredients, multiplier }),
    })
    return handleResponse<ShoppingListItem>(res)
  },

  async updateChecked(recipeId: number, checkedIngredients: string[]): Promise<{ success: boolean; checked_ingredients: string[] }> {
    const res = await fetch(`/api/shopping-list/${recipeId}/checked`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedIngredients }),
    })
    return handleResponse<{ success: boolean; checked_ingredients: string[] }>(res)
  },

  async updateMultiplier(recipeId: number, multiplier: number): Promise<{ success: boolean; multiplier: number }> {
    const res = await fetch(`/api/shopping-list/${recipeId}/multiplier`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ multiplier }),
    })
    return handleResponse<{ success: boolean; multiplier: number }>(res)
  },

  async remove(recipeId: number): Promise<{ success: boolean; recipeId: number }> {
    const res = await fetch(`/api/shopping-list/${recipeId}`, {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean; recipeId: number }>(res)
  },

  async clear(): Promise<{ success: boolean }> {
    const res = await fetch('/api/shopping-list/clear', {
      method: 'POST',
    })
    return handleResponse<{ success: boolean }>(res)
  },

  async loadHistory(historyId: number): Promise<{ success: boolean; loadedRecipeIds: number[] }> {
    const res = await fetch(`/api/shopping-list/load-history/${historyId}`, {
      method: 'POST',
    })
    return handleResponse<{ success: boolean; loadedRecipeIds: number[] }>(res)
  },

  async deleteHistory(historyId: number): Promise<{ success: boolean; id: number }> {
    const res = await fetch(`/api/shopping-list/history/${historyId}`, {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean; id: number }>(res)
  },
}


