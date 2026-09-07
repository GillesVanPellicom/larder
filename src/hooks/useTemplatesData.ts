import { useCallback, useEffect, useMemo, useState } from 'react'
import { templatesApi, type TemplateUpdateConflict } from '@/services/api'
import type { CardGridLayoutConfig, RecipeTemplate, TemplateField } from '@/shared/types'

export function useTemplatesData() {
  const [templates, setTemplates] = useState<RecipeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await templatesApi.getAll()
      setTemplates(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch templates'
      setError(msg)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const defaultTemplate = useMemo(() => {
    return templates.find((t) => t.isDefault) || templates[0] || null
  }, [templates])

  const createTemplate = useCallback(
    async (data: {
      name: string
      description?: string
      fieldsSchema: TemplateField[]
      cardLayout: CardGridLayoutConfig
      isDefault?: boolean
    }) => {
      const created = await templatesApi.create(data)
      await fetchTemplates()
      return created
    },
    [fetchTemplates]
  )

  const updateTemplate = useCallback(
    async (
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
    ): Promise<RecipeTemplate | TemplateUpdateConflict> => {
      const result = await templatesApi.update(id, data)
      if ('requiresResolution' in result && result.requiresResolution) {
        return result
      }
      await fetchTemplates()
      return result as RecipeTemplate
    },
    [fetchTemplates]
  )

  const rollbackTemplate = useCallback(
    async (id: string, targetVersionId: number) => {
      const rolledBack = await templatesApi.rollback(id, targetVersionId)
      await fetchTemplates()
      return rolledBack
    },
    [fetchTemplates]
  )

  const duplicateTemplate = useCallback(
    async (id: string) => {
      const duplicated = await templatesApi.duplicate(id)
      await fetchTemplates()
      return duplicated
    },
    [fetchTemplates]
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      await templatesApi.delete(id)
      await fetchTemplates()
    },
    [fetchTemplates]
  )

  return {
    templates,
    defaultTemplate,
    loading,
    error,
    refreshTemplates: fetchTemplates,
    createTemplate,
    updateTemplate,
    rollbackTemplate,
    duplicateTemplate,
    deleteTemplate,
  }
}
