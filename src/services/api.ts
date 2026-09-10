import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../server/src/trpc'
import type {
  CreateFilterTemplateDTO,
  CreateRecipeDTO,
  DatabaseConfig,
  FilterTemplate,
  HealthCheckResponse,
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

export type { StoreRecord } from '@/shared/types'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
})

export const recipesApi = {
  async getAll(params?: RecipeQueryParams): Promise<PaginatedRecipesResponse> {
    return trpc.recipes.list.query(params)
  },

  async getIngredients(): Promise<string[]> {
    return trpc.recipes.getDistinctIngredients.query()
  },

  async getById(id: number): Promise<Recipe> {
    return trpc.recipes.get.query({ id })
  },

  async create(data: CreateRecipeDTO): Promise<Recipe> {
    return trpc.recipes.create.mutate(data)
  },

  async update(id: number, data: Partial<CreateRecipeDTO>): Promise<Recipe> {
    return trpc.recipes.update.mutate({ id, data })
  },

  async delete(id: number): Promise<{ success: boolean; id: number }> {
    return trpc.recipes.delete.mutate({ id })
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
    return trpc.ingredients.list.query({ q, limit, offset })
  },

  async getPaginated(params?: IngredientsQueryParams): Promise<IngredientsSearchResponse> {
    return trpc.ingredients.list.query(params)
  },

  async getAll(): Promise<{ id: number; name: string }[]> {
    return trpc.ingredients.getAll.query()
  },

  async create(name: string): Promise<{ id: number; name: string }> {
    return trpc.ingredients.create.mutate({ name })
  },

  async update(id: number, name: string): Promise<{ id: number; name: string; created_at?: string; updated_at?: string }> {
    return trpc.ingredients.update.mutate({ id, name })
  },
}

export const storesApi = {
  async search(q: string, limit = 10, offset = 0): Promise<StoresSearchResponse> {
    return trpc.stores.list.query({ q, limit, offset })
  },

  async getPaginated(params?: StoresQueryParams): Promise<StoresSearchResponse> {
    return trpc.stores.list.query(params)
  },

  async getAll(): Promise<{ id: number; name: string }[]> {
    return trpc.stores.getAll.query()
  },

  async create(name: string): Promise<{ id: number; name: string; created_at?: string }> {
    return trpc.stores.create.mutate({ name })
  },

  async update(id: number, name: string): Promise<{ id: number; name: string; created_at?: string; updated_at?: string }> {
    return trpc.stores.update.mutate({ id, name })
  },
}

export const configApi = {
  async get(): Promise<MetadataConfig> {
    return trpc.config.get.query()
  },

  async update(config: MetadataConfig): Promise<MetadataConfig> {
    return trpc.config.update.mutate(config)
  },
}

export const conflictsApi = {
  async get(): Promise<{ totalConflicts: number; conflicts: RecipeConflict[] }> {
    return { totalConflicts: 0, conflicts: [] }
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
    return trpc.tags.list.query()
  },

  async createCategory(data: {
    id: string
    name: string
    exclusive?: boolean
    min_tags?: number
    max_tags?: number
    tags?: string[]
  }): Promise<TagCategory> {
    return trpc.tags.createCategory.mutate(data)
  },

  async updateCategory(
    id: string,
    data: { name?: string; exclusive?: boolean; min_tags?: number; max_tags?: number; tags?: string[] }
  ): Promise<TagCategory> {
    return trpc.tags.updateCategory.mutate({ id, data })
  },

  async deleteCategory(id: string): Promise<{ success: boolean; id: string }> {
    return trpc.tags.deleteCategory.mutate({ id })
  },

  async addTag(categoryId: string, tag: string): Promise<TagCategory> {
    return trpc.tags.addTag.mutate({ categoryId, tag })
  },

  async renameTag(
    categoryId: string,
    oldName: string,
    newName: string
  ): Promise<{ success: boolean; categoryId: string; oldName: string; newName: string; affectedRecipesCount: number }> {
    return trpc.tags.renameTag.mutate({ categoryId, oldName, newName })
  },

  async getTagUsage(categoryId: string, tag: string): Promise<TagUsageResponse> {
    return trpc.tags.getTagUsage.query({ categoryId, tag })
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
    return trpc.tags.deleteTag.mutate({ categoryId, tag, resolution, reassignTo })
  },
}

export const databaseApi = {
  async getConfig(): Promise<DatabaseConfig> {
    return trpc.database.getConfig.query()
  },

  async testConnection(connectionString: string): Promise<{ healthy: boolean; error?: string; databaseVersion?: string }> {
    return trpc.database.testConnection.mutate({ connectionString })
  },

  async saveConfig(connectionString: string): Promise<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean; error?: string; databaseVersion?: string }> {
    return trpc.database.saveConfig.mutate({ connectionString })
  },

  async disconnect(): Promise<{ success: boolean; configured: boolean; connectionStringMasked: string; healthy: boolean }> {
    return trpc.database.disconnect.mutate()
  },
}

export const storageApi = {
  async getConfig(): Promise<StorageConfig> {
    return trpc.storage.getStatus.query()
  },

  async testConnection(config: StorageConfigDTO): Promise<{ success: boolean; error?: string }> {
    return trpc.storage.testConnection.mutate(config)
  },

  async saveConfig(config: StorageConfigDTO): Promise<{ success: boolean; configured: boolean; endpoint?: string; bucket?: string; error?: string }> {
    return trpc.storage.saveConfig.mutate(config)
  },

  async disconnect(): Promise<{ success: boolean; configured: boolean }> {
    return trpc.storage.disconnect.mutate()
  },
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert image Blob to base64 string'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const imagesApi = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(blob: Blob, _filename = 'image.webp'): Promise<UploadImageResponse> {
    const base64 = await blobToBase64(blob)
    return trpc.storage.upload.mutate({ base64 })
  },
}

export const filterTemplatesApi = {
  async getAll(): Promise<FilterTemplate[]> {
    return trpc.filterTemplates.list.query()
  },

  async create(dto: CreateFilterTemplateDTO): Promise<FilterTemplate> {
    return trpc.filterTemplates.create.mutate(dto)
  },

  async update(id: number, dto: UpdateFilterTemplateDTO): Promise<FilterTemplate> {
    return trpc.filterTemplates.update.mutate({ id, data: dto })
  },

  async apply(id: number): Promise<FilterTemplate> {
    return trpc.filterTemplates.recordUse.mutate({ id })
  },

  async delete(id: number): Promise<void> {
    await trpc.filterTemplates.delete.mutate({ id })
  },
}

export const shoppingListApi = {
  async get(): Promise<{
    items: ShoppingListItem[]
    history: ShoppingListHistoryItem[]
    storeAssignments?: Record<string, string[]>
  }> {
    return trpc.shoppingList.get.query()
  },

  async updateStoreAssignments(assignments: Record<string, string[]>): Promise<{ success: boolean; assignments: Record<string, string[]> }> {
    return trpc.shoppingList.saveStoreAssignments.mutate({ assignments })
  },

  async add(recipeId: number, checkedIngredients?: string[], multiplier?: number): Promise<ShoppingListItem> {
    return trpc.shoppingList.addItem.mutate({ recipeId, checkedIngredients, multiplier })
  },

  async updateChecked(recipeId: number, checkedIngredients: string[]): Promise<{ success: boolean; checked_ingredients: string[] }> {
    return trpc.shoppingList.updateChecked.mutate({ recipeId, checkedIngredients })
  },

  async updateMultiplier(recipeId: number, multiplier: number): Promise<{ success: boolean; multiplier: number }> {
    return trpc.shoppingList.updateMultiplier.mutate({ recipeId, multiplier })
  },

  async remove(recipeId: number): Promise<{ success: boolean; recipeId: number }> {
    return trpc.shoppingList.removeItem.mutate({ recipeId })
  },

  async clear(): Promise<{ success: boolean }> {
    return trpc.shoppingList.clear.mutate()
  },

  async loadHistory(historyId: number): Promise<{ success: boolean; loadedRecipeIds: number[] }> {
    return trpc.shoppingList.loadHistory.mutate({ id: historyId })
  },

  async deleteHistory(historyId: number): Promise<{ success: boolean; id: number }> {
    return trpc.shoppingList.deleteHistory.mutate({ id: historyId })
  },
}

export const healthApi = {
  async check(): Promise<HealthCheckResponse> {
    return trpc.health.check.query()
  },
}
