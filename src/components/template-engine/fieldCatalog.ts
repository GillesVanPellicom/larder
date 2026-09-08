import type { CardGridLayoutConfig, CardWidgetType, FieldType, TemplateField } from '@/shared/types'
import {
  AlignLeft,
  FileText,
  Hash,
  Image as ImageIcon,
  Minus,
  Star,
  Table,
  Tags,
  ToggleLeft,
  Type,
} from 'lucide-react'

export interface FieldTypeDefinition {
  type: FieldType
  label: string
  description: string
  icon: typeof Type
  hasWidgetForm: boolean
  defaultWidgetType?: CardWidgetType
  defaultConfig: TemplateField['config']
}

export const FIELD_CATALOG: Record<FieldType, FieldTypeDefinition> = {
  recipe_details: {
    type: 'recipe_details',
    label: 'Recipe Details',
    description: 'Header, description, prep time, cook time, and yield.',
    icon: FileText,
    hasWidgetForm: true,
    defaultWidgetType: 'title_header',
    defaultConfig: {
      mandatoryDetails: {
        description: false,
        prepTime: false,
        cookTime: false,
        yieldAmount: false,
      },
    },
  },
  text: {
    type: 'text',
    label: 'Text Field',
    description: 'Single-line input or resizable multi-line text area.',
    icon: Type,
    hasWidgetForm: true,
    defaultWidgetType: 'text_snippet',
    defaultConfig: {
      multiline: false,
      resizable: false,
      placeholder: '',
      maxLength: 255,
    },
  },
  rich_text: {
    type: 'rich_text',
    label: 'Rich Text (Quill)',
    description: 'Formatted text with bold, italics, underline, lists, and links.',
    icon: AlignLeft,
    hasWidgetForm: false, // Full formatted text is excluded from card grid
    defaultConfig: {
      placeholder: 'Write step-by-step instructions or culinary notes...',
    },
  },
  number: {
    type: 'number',
    label: 'Numeric Value',
    description: 'Quantities, prep/cook times, temperatures, or caloric metrics.',
    icon: Hash,
    hasWidgetForm: true,
    defaultWidgetType: 'metric_chip',
    defaultConfig: {
      min: 0,
      step: 1,
      unit: 'min',
    },
  },
  ingredient_table: {
    type: 'ingredient_table',
    label: 'Ingredients Table',
    description: 'Structured table with amounts, units, ingredient names, and notes.',
    icon: Table,
    hasWidgetForm: false, // Full table excluded from compact card grid
    defaultConfig: {},
  },
  tag_category: {
    type: 'tag_category',
    label: 'Tags & Taxonomy',
    description: 'Linked tag category with single-select or multi-select options.',
    icon: Tags,
    hasWidgetForm: true,
    defaultWidgetType: 'tag_chips',
    defaultConfig: {
      exclusive: false,
    },
  },
  rating: {
    type: 'rating',
    label: 'Star Rating',
    description: '1 to 5 star rating score with half-star support.',
    icon: Star,
    hasWidgetForm: true,
    defaultWidgetType: 'rating_stars',
    defaultConfig: {
      max: 5,
      step: 1,
    },
  },
  boolean: {
    type: 'boolean',
    label: 'Toggle / Badge',
    description: 'Yes/No switch (e.g. Vegetarian, Spicy, Gluten-Free, Make Ahead).',
    icon: ToggleLeft,
    hasWidgetForm: true,
    defaultWidgetType: 'icon_badge',
    defaultConfig: {},
  },
  image: {
    type: 'image',
    label: 'Cover Photo / Media',
    description: 'High-resolution photo banner or dish thumbnail.',
    icon: ImageIcon,
    hasWidgetForm: true,
    defaultWidgetType: 'image_banner',
    defaultConfig: {
      placeholder: 'https://images.unsplash.com/...',
    },
  },
  separator: {
    type: 'separator',
    label: 'Section Divider',
    description: 'Visual separation or section title in the recipe form.',
    icon: Minus,
    hasWidgetForm: false,
    defaultConfig: {
      separatorStyle: 'heading',
    },
  },
}

export function createDefaultField(type: FieldType, order: number): TemplateField {
  const def = FIELD_CATALOG[type]
  const id = `fld_${type}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  return {
    id,
    name: `New ${def.label}`,
    type,
    required: false,
    order,
    config: { ...def.defaultConfig },
  }
}

export const DEFAULT_FIELDS: TemplateField[] = [
  {
    id: 'fld_details',
    name: 'Recipe Details',
    type: 'recipe_details',
    required: true,
    order: 1,
    config: {
      mandatoryDetails: {
        description: false,
        prepTime: false,
        cookTime: false,
        yieldAmount: false,
      },
    },
  },
  {
    id: 'fld_image',
    name: 'Cover Photo',
    type: 'image',
    required: false,
    order: 2,
    config: { placeholder: 'https://images.unsplash.com/...' },
  },
  {
    id: 'fld_tags',
    name: 'Tags & Taxonomy',
    type: 'tag_category',
    required: false,
    order: 3,
    config: { exclusive: false },
  },
  {
    id: 'fld_ingredients',
    name: 'Ingredients Table',
    type: 'ingredient_table',
    required: true,
    order: 4,
    config: {},
  },
  {
    id: 'fld_instructions',
    name: 'Instructions',
    type: 'rich_text',
    required: true,
    order: 5,
    config: {},
  },
]

export const DEFAULT_CARD_LAYOUT: CardGridLayoutConfig = {
  columns: 4,
  widgets: [
    {
      id: 'w_cover',
      fieldId: 'fld_image',
      widgetType: 'image_banner',
      col: 1,
      row: 1,
      colSpan: 4,
      rowSpan: 2,
    },
    {
      id: 'w_title',
      fieldId: 'fld_details',
      widgetType: 'title_header',
      col: 1,
      row: 3,
      colSpan: 4,
      rowSpan: 1,
    },
    {
      id: 'w_prep',
      fieldId: 'fld_details',
      widgetType: 'prep_time',
      col: 1,
      row: 4,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'w_cook',
      fieldId: 'fld_details',
      widgetType: 'cook_time',
      col: 2,
      row: 4,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'w_total',
      fieldId: 'fld_details',
      widgetType: 'total_time',
      col: 3,
      row: 4,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'w_yield',
      fieldId: 'fld_details',
      widgetType: 'yield',
      col: 4,
      row: 4,
      colSpan: 1,
      rowSpan: 1,
    },
  ],
}

