import type { CardWidgetType, FieldType, TemplateField } from '@/shared/types'
import {
  AlignLeft,
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
