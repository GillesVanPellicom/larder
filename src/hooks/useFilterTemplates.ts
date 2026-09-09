import { useState, useEffect, useCallback } from 'react'
import type { FilterCriteria, FilterTemplate, UpdateFilterTemplateDTO } from '@/shared/types'
import { filterTemplatesApi } from '@/services/api'

export function useFilterTemplates() {
  const [templates, setTemplates] = useState<FilterTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await filterTemplatesApi.getAll()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to load filter templates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  const createTemplate = useCallback(
    async (name: string, criteria: FilterCriteria): Promise<FilterTemplate> => {
      const created = await filterTemplatesApi.create({ name, criteria })
      setTemplates((prev) => [created, ...prev.filter((t) => t.id !== created.id)])
      return created
    },
    []
  )

  const updateTemplate = useCallback(
    async (id: number, dto: UpdateFilterTemplateDTO): Promise<FilterTemplate> => {
      const updated = await filterTemplatesApi.update(id, dto)
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)))
      return updated
    },
    []
  )

  const deleteTemplate = useCallback(async (id: number): Promise<void> => {
    await filterTemplatesApi.delete(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const applyTemplate = useCallback(
    async (template: FilterTemplate): Promise<void> => {
      try {
        const updated = await filterTemplatesApi.apply(template.id)
        setTemplates((prev) =>
          [updated, ...prev.filter((t) => t.id !== updated.id)]
        )
      } catch (err) {
        console.error('Failed to record filter template application:', err)
      }
    },
    []
  )

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  }
}
