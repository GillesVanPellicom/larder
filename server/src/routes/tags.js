import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { recipes, tagCategories } from '../db/schema';
const router = Router();
// GET /api/tags - Fetch all tag categories and tags
router.get('/', async (_req, res) => {
    try {
        const rows = await db.select().from(tagCategories);
        const result = rows.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            exclusive: r.exclusive ?? false,
            tags: r.tags || [],
            created_at: r.createdAt.toISOString(),
            updated_at: r.updatedAt.toISOString(),
        }));
        res.json(result);
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to get tag categories:', err);
        res.status(500).json({ error: 'Failed to retrieve tag categories', details });
    }
});
// POST /api/tags/categories - Create a new tag category
router.post('/categories', async (req, res) => {
    try {
        const { id, name, color, exclusive, tags } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const categoryId = (id || name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9_-]/g, '-');
        const [created] = await db
            .insert(tagCategories)
            .values({
            id: categoryId,
            name: name.trim(),
            color: color || 'neutral',
            exclusive: Boolean(exclusive),
            tags: tags || [],
        })
            .returning();
        res.status(201).json(created);
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to create tag category:', err);
        res.status(500).json({ error: 'Failed to create tag category', details });
    }
});
// PUT /api/tags/categories/:id - Update category metadata
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, exclusive } = req.body;
        const updatePayload = {
            updatedAt: new Date(),
        };
        if (name !== undefined)
            updatePayload.name = name.trim();
        if (color !== undefined)
            updatePayload.color = color;
        if (exclusive !== undefined)
            updatePayload.exclusive = Boolean(exclusive);
        const [updated] = await db
            .update(tagCategories)
            .set(updatePayload)
            .where(eq(tagCategories.id, id))
            .returning();
        if (!updated) {
            return res.status(404).json({ error: 'Tag category not found' });
        }
        res.json(updated);
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to update tag category:', err);
        res.status(500).json({ error: 'Failed to update tag category', details });
    }
});
// POST /api/tags/:categoryId - Add tag to category
router.post('/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { tag } = req.body;
        if (!tag || !tag.trim()) {
            return res.status(400).json({ error: 'Tag name is required' });
        }
        const trimmedTag = tag.trim();
        const [category] = await db
            .select()
            .from(tagCategories)
            .where(eq(tagCategories.id, categoryId));
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const currentTags = category.tags || [];
        if (currentTags.some((t) => t.toLowerCase() === trimmedTag.toLowerCase())) {
            return res.status(400).json({ error: 'Tag already exists in this category' });
        }
        const updatedTags = [...currentTags, trimmedTag];
        const [updated] = await db
            .update(tagCategories)
            .set({
            tags: updatedTags,
            updatedAt: new Date(),
        })
            .where(eq(tagCategories.id, categoryId))
            .returning();
        res.status(201).json(updated);
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to add tag:', err);
        res.status(500).json({ error: 'Failed to add tag', details });
    }
});
// PUT /api/tags/:categoryId/rename - Rename tag and cascade to all recipes without conflict
router.put('/:categoryId/rename', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { oldName, newName } = req.body;
        if (!oldName || !newName || !newName.trim()) {
            return res.status(400).json({ error: 'Both oldName and newName are required' });
        }
        const trimmedNew = newName.trim();
        const [category] = await db
            .select()
            .from(tagCategories)
            .where(eq(tagCategories.id, categoryId));
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        // 1. Update tag category tags array
        const updatedCategoryTags = (category.tags || []).map((t) => t === oldName ? trimmedNew : t);
        await db
            .update(tagCategories)
            .set({
            tags: updatedCategoryTags,
            updatedAt: new Date(),
        })
            .where(eq(tagCategories.id, categoryId));
        // 2. Cascade rename into all recipes using this tag
        const allRecipes = await db.select().from(recipes);
        let affectedRecipesCount = 0;
        for (const r of allRecipes) {
            const catTags = r.tags?.[categoryId];
            if (Array.isArray(catTags) && catTags.includes(oldName)) {
                const nextCatTags = catTags.map((t) => (t === oldName ? trimmedNew : t));
                const nextTags = {
                    ...r.tags,
                    [categoryId]: nextCatTags,
                };
                await db
                    .update(recipes)
                    .set({
                    tags: nextTags,
                    updatedAt: new Date(),
                })
                    .where(eq(recipes.id, r.id));
                affectedRecipesCount++;
            }
        }
        res.json({
            success: true,
            categoryId,
            oldName,
            newName: trimmedNew,
            affectedRecipesCount,
        });
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to rename tag:', err);
        res.status(500).json({ error: 'Failed to rename tag', details });
    }
});
// GET /api/tags/:categoryId/:tag/usage - Check how many recipes use this tag
router.get('/:categoryId/:tag/usage', async (req, res) => {
    try {
        const { categoryId, tag } = req.params;
        const allRecipes = await db.select().from(recipes);
        const usingRecipes = allRecipes.filter((r) => {
            const catTags = r.tags?.[categoryId];
            return Array.isArray(catTags) && catTags.includes(tag);
        });
        res.json({
            categoryId,
            tag,
            count: usingRecipes.length,
            recipes: usingRecipes.map((r) => ({ id: r.id, title: r.title })),
        });
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to get tag usage:', err);
        res.status(500).json({ error: 'Failed to get tag usage', details });
    }
});
// DELETE /api/tags/:categoryId/:tag - Delete tag with resolution for affected recipes
router.delete('/:categoryId/:tag', async (req, res) => {
    try {
        const { categoryId, tag } = req.params;
        const { resolution, reassignTo } = (req.body || {});
        const [category] = await db
            .select()
            .from(tagCategories)
            .where(eq(tagCategories.id, categoryId));
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const allRecipes = await db.select().from(recipes);
        const usingRecipes = allRecipes.filter((r) => {
            const catTags = r.tags?.[categoryId];
            return Array.isArray(catTags) && catTags.includes(tag);
        });
        // If recipes use this tag and no resolution is provided, abort with 409 Conflict
        if (usingRecipes.length > 0 && !resolution) {
            return res.status(409).json({
                error: 'Tag is currently used by recipes',
                usageCount: usingRecipes.length,
                recipes: usingRecipes.map((r) => ({ id: r.id, title: r.title })),
                availableTags: (category.tags || []).filter((t) => t !== tag),
            });
        }
        // Apply resolution to all affected recipes
        if (usingRecipes.length > 0) {
            for (const r of usingRecipes) {
                const catTags = r.tags[categoryId] || [];
                let nextCatTags;
                if (resolution === 'reassign' && reassignTo) {
                    nextCatTags = catTags.map((t) => (t === tag ? reassignTo : t));
                    // Deduplicate if reassignTo already existed
                    nextCatTags = Array.from(new Set(nextCatTags));
                }
                else {
                    // 'strip'
                    nextCatTags = catTags.filter((t) => t !== tag);
                }
                const nextTags = {
                    ...r.tags,
                    [categoryId]: nextCatTags,
                };
                await db
                    .update(recipes)
                    .set({
                    tags: nextTags,
                    updatedAt: new Date(),
                })
                    .where(eq(recipes.id, r.id));
            }
        }
        // Remove from category's tags list
        const updatedCategoryTags = (category.tags || []).filter((t) => t !== tag);
        await db
            .update(tagCategories)
            .set({
            tags: updatedCategoryTags,
            updatedAt: new Date(),
        })
            .where(eq(tagCategories.id, categoryId));
        res.json({
            success: true,
            categoryId,
            deletedTag: tag,
            resolution: resolution || 'none',
            affectedRecipesCount: usingRecipes.length,
        });
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to delete tag:', err);
        res.status(500).json({ error: 'Failed to delete tag', details });
    }
});
// DELETE /api/tags/categories/:id - Delete an empty tag category
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [cat] = await db.select().from(tagCategories).where(eq(tagCategories.id, id));
        if (!cat) {
            return res.status(404).json({ error: 'Category not found' });
        }
        if (cat.tags && cat.tags.length > 0) {
            return res
                .status(400)
                .json({ error: 'Cannot delete category that still contains tags. Delete or move tags first.' });
        }
        await db.delete(tagCategories).where(eq(tagCategories.id, id));
        res.json({ success: true, id });
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: 'Failed to delete category', details });
    }
});
export default router;
