export interface NormalizedIngredient {
  id: number
  name: string
  created_at?: string
  updated_at?: string
}

export interface IngredientItem {
  id?: string | number
  ingredient_id?: number
  name: string
  amount?: string
  unit?: string
  notes?: string
}

export interface InstructionStep {
  step: number
  text: string
}

export type PageView =
  | 'recipes'
  | 'recipe-view'
  | 'recipe-form'
  | 'settings'
  | 'shopping-list'
  | 'ingredients'

// Category ID -> Array of tag values (e.g. { season: ['Winter', 'Spring'], course: ['Main'] })
export type RecipeTags = Record<string, string[]>

export interface Recipe {
  id: number
  title: string
  description: string
  yield_amount: number
  yield_unit: string
  prep_time_minutes: number
  cook_time_minutes: number
  total_time_minutes: number
  image_url: string
  source_url: string
  ingredients: IngredientItem[]
  instructions: string | InstructionStep[]
  tags: RecipeTags
  has_violations?: boolean
  violations?: RecipeViolation[]
  created_at: string
  updated_at: string
}

export type CreateRecipeDTO = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>

export interface TagCategory {
  id: string
  name: string
  color: string
  exclusive?: boolean
  min_tags?: number
  max_tags?: number
  tags: string[]
  created_at?: string
  updated_at?: string
}

export type TimeTrackingMode = 'prep_and_cook' | 'total_only' | 'no_cook'

export interface MandatoryFieldsConfig {
  title: boolean
  ingredients: boolean
  instructions: boolean
  image_url: boolean
  description: boolean
  yield_amount: boolean
  prep_time_minutes: boolean
  cook_time_minutes: boolean
  source_url: boolean
}

export interface MetadataConfig {
  mandatoryFields: MandatoryFieldsConfig
  mandatoryCategories: string[]
  timeTrackingMode?: TimeTrackingMode
  updated_at?: string
}

export interface RecipeViolation {
  field: string
  message: string
}

export interface RecipeConflict {
  recipe: Recipe
  violations: RecipeViolation[]
}

export type MatchMode = 'any' | 'all' | 'none'
export type TriStateFilter = 'any' | 'none' | 'only'

export interface FilterCriteria {
  searchQuery: string
  matchModePerElement: {
    ingredients: MatchMode
    tags: MatchMode
    categoryTags: Record<string, MatchMode>
  }
  selectedIngredients: string[]
  selectedTags: Record<string, string[]>
  maxTotalTime?: number
  maxPrepTime?: number
  maxCookTime?: number
  hasImage?: TriStateFilter | boolean | null
  onlyConflicts?: TriStateFilter | boolean
}

export type RecipeSortOption =
  | 'created_desc'
  | 'created_asc'
  | 'title_asc'
  | 'title_desc'
  | 'total_time_asc'
  | 'total_time_desc'

export interface RecipeQueryParams {
  searchQuery?: string
  selectedIngredients?: string[]
  ingredientsMatchMode?: MatchMode
  selectedTags?: Record<string, string[]>
  tagsMatchMode?: MatchMode
  categoryTagsMatchMode?: Record<string, MatchMode>
  maxTotalTime?: number
  maxPrepTime?: number
  maxCookTime?: number
  hasImage?: TriStateFilter | boolean | null
  onlyConflicts?: TriStateFilter | boolean
  sortBy?: RecipeSortOption
  page?: number
  pageSize?: number
}

export interface PaginatedRecipesResponse {
  items: Recipe[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  database: 'connected' | 'disconnected'
  error?: string
  uptimeSeconds: number
  timestamp: string
}

export interface DatabaseConfig {
  configured: boolean
  connectionStringMasked?: string
  healthy: boolean
  error?: string
  databaseVersion?: string
}

export interface StorageConfig {
  configured: boolean
  endpoint?: string
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKeyMasked?: string
  publicUrlPrefix?: string
  forcePathStyle?: boolean
}

export interface StorageConfigDTO {
  endpoint: string
  region?: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrlPrefix: string
  forcePathStyle?: boolean
}

export interface UploadImageResponse {
  url: string
  key: string
  sizeBytes: number
  contentType: string
}

export interface FilterTemplate {
  id: number
  name: string
  criteria: FilterCriteria
  use_count: number
  last_used_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateFilterTemplateDTO {
  name: string
  criteria: FilterCriteria
}

export interface UpdateFilterTemplateDTO {
  name?: string
  criteria?: FilterCriteria
}

export interface ShoppingListItem {
  id: number
  recipe_id: number
  recipe: Recipe
  checked_ingredients: string[]
  multiplier: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ShoppingListHistoryItem {
  id: number
  recipe_ids: number[]
  recipe_titles: string[]
  ingredient_count: number
  created_at: string
}

export interface ConsolidatedIngredient {
  name: string
  displayQuantity: string
  instances: Array<{
    recipeId: number
    recipeTitle: string
    amount: string
    unit: string
    itemKey: string
    isChecked: boolean
  }>
  isChecked: boolean
  isPartial: boolean
}


