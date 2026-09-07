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
  yield_amount: string
  prep_time_minutes: number
  cook_time_minutes: number
  total_time_minutes: number
  image_url: string
  source_url: string
  notes: string
  ingredients: IngredientItem[]
  instructions: string | InstructionStep[]
  tags: RecipeTags
  created_at: string
  updated_at: string
}

export type CreateRecipeDTO = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>

export interface TagCategory {
  id: string
  name: string
  color: string
  exclusive?: boolean
  tags: string[]
  created_at?: string
  updated_at?: string
}

export interface MandatoryFieldsConfig {
  title: boolean
  ingredients: boolean
  instructions: boolean
  image_url: boolean
  description: boolean
  yield_amount: boolean
  prep_time_minutes: boolean
  cook_time_minutes: boolean
  total_time_minutes: boolean
}

export interface MetadataConfig {
  mandatoryFields: MandatoryFieldsConfig
  mandatoryCategories: string[]
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

export type MatchMode = 'any' | 'all'

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
  hasImage?: boolean | null
  onlyConflicts?: boolean
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  database: 'connected' | 'disconnected'
  error?: string
  uptimeSeconds: number
  timestamp: string
}
