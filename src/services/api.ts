import type {
  CardGridLayoutConfig,
  CreateRecipeDTO,
  FieldUsageReport,
  MetadataConfig,
  Recipe,
  RecipeConflict,
  RecipeHistoryEntry,
  RecipeTemplate,
  TagCategory,
  TemplateField,
} from '@/shared/types'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export const recipesApi = {
  async getAll(): Promise<Recipe[]> {
    const res = await fetch('/api/recipes')
    return handleResponse<Recipe[]>(res)
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

  async getHistory(id: number): Promise<RecipeHistoryEntry[]> {
    const res = await fetch(`/api/recipes/${id}/history`)
    return handleResponse<RecipeHistoryEntry[]>(res)
  },

  async restoreVersion(id: number, historyId: number): Promise<Recipe> {
    const res = await fetch(`/api/recipes/${id}/restore-version/${historyId}`, {
      method: 'POST',
    })
    return handleResponse<Recipe>(res)
  },
}

export interface TemplateUpdateConflict {
  error: string
  requiresResolution: true
  inUseFields: {
    fieldId: string
    name: string
    usedByCount: number
    recipeTitles: string[]
  }[]
}

export const templatesApi = {
  async getAll(): Promise<RecipeTemplate[]> {
    const res = await fetch('/api/templates')
    return handleResponse<RecipeTemplate[]>(res)
  },

  async getById(id: string): Promise<RecipeTemplate> {
    const res = await fetch(`/api/templates/${id}`)
    return handleResponse<RecipeTemplate>(res)
  },

  async create(data: {
    name: string
    description?: string
    fieldsSchema: TemplateField[]
    cardLayout: CardGridLayoutConfig
    isDefault?: boolean
  }): Promise<RecipeTemplate> {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<RecipeTemplate>(res)
  },

  async update(
    id: string,
    data: {
      name?: string
      description?: string
      isDefault?: boolean
      changeSummary?: string
      fieldsSchema: TemplateField[]
      cardLayout: CardGridLayoutConfig
      archiveRemovedFields?: boolean
      confirmPurgeRemovedFields?: boolean
    }
  ): Promise<RecipeTemplate | TemplateUpdateConflict> {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.status === 409) {
      return res.json() as Promise<TemplateUpdateConflict>
    }
    return handleResponse<RecipeTemplate>(res)
  },

  async checkFieldUsage(id: string, fieldIds: string[]): Promise<FieldUsageReport[]> {
    const res = await fetch(`/api/templates/${id}/check-field-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldIds }),
    })
    return handleResponse<FieldUsageReport[]>(res)
  },

  async rollback(id: string, targetVersionId: number): Promise<RecipeTemplate> {
    const res = await fetch(`/api/templates/${id}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersionId }),
    })
    return handleResponse<RecipeTemplate>(res)
  },

  async duplicate(id: string): Promise<RecipeTemplate> {
    const res = await fetch(`/api/templates/${id}/duplicate`, {
      method: 'POST',
    })
    return handleResponse<RecipeTemplate>(res)
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
    })
    return handleResponse<{ success: boolean; message: string }>(res)
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
