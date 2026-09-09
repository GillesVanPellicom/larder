export interface IngredientItem {
  id: string
  name: string
  amount?: string
  unit?: string
  notes?: string
}

export interface InstructionStep {
  step: number
  text: string
}

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

// ==========================================
// Template & Dynamic Component Architecture
// ==========================================

export type FieldType =
  | 'recipe_details'
  | 'text'
  | 'rich_text'
  | 'number'
  | 'ingredient_table'
  | 'tag_category'
  | 'rating'
  | 'boolean'
  | 'image'
  | 'separator'

export interface FieldConfig {
  multiline?: boolean
  resizable?: boolean
  placeholder?: string
  maxLength?: number
  min?: number
  max?: number
  step?: number
  unit?: string // e.g. 'min', 'servings', 'g', '°C'
  categoryId?: string // for 'tag_category'
  exclusive?: boolean // for 'tag_category': single-select vs multi
  separatorStyle?: 'line' | 'dashed' | 'heading'
  isContainer?: boolean // allows nesting other fields
  mandatoryDetails?: {
    description?: boolean
    prepTime?: boolean
    cookTime?: boolean
    yieldAmount?: boolean
  }
}

export interface TemplateField {
  id: string // Immutable unique identifier e.g. 'fld_prep_time_01'
  name: string
  type: FieldType
  required: boolean
  order: number
  config: FieldConfig
  isArchived?: boolean // Safe deprecation without data loss
  parentId?: string // For fields nested inside a container separator
}

// Mobile-first 4-Column Card Grid System
export type CardWidgetType =
  | 'image_banner'
  | 'title_header'
  | 'description'
  | 'prep_time'
  | 'cook_time'
  | 'total_time'
  | 'yield'
  | 'metric_chip'
  | 'tag_chips'
  | 'rating_stars'
  | 'icon_badge'
  | 'text_snippet'

export interface CardGridWidget {
  id: string
  fieldId: string // References a TemplateField.id
  widgetType: CardWidgetType
  col: number // 1 to 4 (1-indexed start column)
  row: number // 1-indexed start row
  colSpan: number // 1 to 4 columns wide
  rowSpan: number // 1 to 3 rows high
  options?: {
    showLabel?: boolean
    variant?: 'subtle' | 'outline' | 'solid'
    align?: 'left' | 'center' | 'right'
    icon?: string
    selectedTagGroups?: string[]
  }
}

export interface CardGridLayoutConfig {
  columns: number // Fixed at 4 for mobile-first equivalence
  widgets: CardGridWidget[]
}

export interface TemplateVersion {
  id: number
  templateId: string
  version: number
  changeSummary?: string
  fieldsSchema: TemplateField[]
  cardLayout: CardGridLayoutConfig
  createdAt: string
}

export interface RecipeTemplate {
  id: string
  name: string
  description: string
  isDefault: boolean
  currentVersionId: number
  currentVersion?: TemplateVersion
  versions?: TemplateVersion[]
  createdAt: string
  updatedAt: string
}

export interface RecipeHistoryEntry {
  id: number
  recipeId: number
  templateVersionId: number
  snapshot: Record<string, unknown>
  savedAt: string
}

export interface FieldUsageReport {
  fieldId: string
  inUse: boolean
  usedByCount: number
  recipeTitles: string[]
}

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


