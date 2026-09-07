import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { metadataConfigTable, recipes, tagCategories } from '../db/schema';
const router = Router();
// GET /api/conflicts - List all recipes currently violating metadata configuration
router.get('/', async (_req, res) => {
    try {
        // 1. Get global config
        const [configRow] = await db
            .select()
            .from(metadataConfigTable)
            .where(eq(metadataConfigTable.id, 'global'));
        const mandatory = configRow?.mandatoryFields || {
            title: true,
            ingredients: true,
            instructions: true,
            image_url: false,
            description: false,
            yield_amount: false,
            prep_time_minutes: false,
            cook_time_minutes: false,
            total_time_minutes: false,
        };
        const mandatoryCategories = configRow?.mandatoryCategories || [];
        // 2. Get all tag categories for orphaned tags detection
        const allCategories = await db.select().from(tagCategories);
        const categoryTagMap = new Map();
        for (const cat of allCategories) {
            categoryTagMap.set(cat.id, new Set(cat.tags || []));
        }
        // 3. Get all recipes
        const recipeRows = await db.select().from(recipes);
        const conflicts = [];
        for (const r of recipeRows) {
            const violations = [];
            // Mandatory field checks
            if (mandatory.title && (!r.title || !r.title.trim())) {
                violations.push({ field: 'title', message: 'Title is mandatory' });
            }
            if (mandatory.image_url && (!r.imageUrl || !r.imageUrl.trim())) {
                violations.push({ field: 'image_url', message: 'Recipe image is mandatory under current configuration' });
            }
            if (mandatory.description && (!r.description || !r.description.trim())) {
                violations.push({ field: 'description', message: 'Description is mandatory' });
            }
            if (mandatory.yield_amount && (!r.yieldAmount || !r.yieldAmount.trim())) {
                violations.push({ field: 'yield_amount', message: 'Yield / Servings is mandatory' });
            }
            if (mandatory.prep_time_minutes && (!r.prepTimeMinutes || r.prepTimeMinutes <= 0)) {
                violations.push({ field: 'prep_time_minutes', message: 'Preparation time is mandatory' });
            }
            if (mandatory.cook_time_minutes && (!r.cookTimeMinutes || r.cookTimeMinutes <= 0)) {
                violations.push({ field: 'cook_time_minutes', message: 'Cooking time is mandatory' });
            }
            if (mandatory.total_time_minutes && (!r.totalTimeMinutes || r.totalTimeMinutes <= 0)) {
                violations.push({ field: 'total_time_minutes', message: 'Total time is mandatory' });
            }
            if (mandatory.ingredients && (!r.ingredients || r.ingredients.length === 0)) {
                violations.push({ field: 'ingredients', message: 'At least one ingredient is required' });
            }
            if (mandatory.instructions) {
                const instr = r.instructions;
                if (!instr) {
                    violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' });
                }
                else if (typeof instr === 'string') {
                    const textOnly = instr.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                    if (!textOnly) {
                        violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' });
                    }
                }
                else if (Array.isArray(instr) && instr.length === 0) {
                    violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' });
                }
            }
            // Mandatory tag category checks
            for (const catId of mandatoryCategories) {
                const catTags = r.tags?.[catId];
                if (!Array.isArray(catTags) || catTags.length === 0) {
                    const catName = allCategories.find((c) => c.id === catId)?.name || catId;
                    violations.push({
                        field: `tags.${catId}`,
                        message: `Must have at least one tag in category "${catName}"`,
                    });
                }
            }
            // Exclusive tag category checks (only 1 tag allowed)
            for (const cat of allCategories) {
                if (cat.exclusive) {
                    const catTags = r.tags?.[cat.id];
                    if (Array.isArray(catTags) && catTags.length > 1) {
                        violations.push({
                            field: `tags.${cat.id}`,
                            message: `Category "${cat.name}" is exclusive (single tag only), but recipe has ${catTags.length} tags: ${catTags.join(', ')}`,
                        });
                    }
                }
            }
            if (violations.length > 0) {
                let ingredients = r.ingredients || [];
                if (typeof ingredients === 'string') {
                    try {
                        ingredients = JSON.parse(ingredients);
                    }
                    catch {
                        ingredients = ingredients
                            .split(',')
                            .map((name, i) => ({ id: String(i + 1), name: name.trim() }));
                    }
                }
                let instructions = r.instructions || '';
                if (typeof instructions === 'string') {
                    try {
                        const parsed = JSON.parse(instructions);
                        if (typeof parsed === 'string' || Array.isArray(parsed)) {
                            instructions = parsed;
                        }
                    }
                    catch {
                        // HTML or plain text string
                    }
                }
                const formattedRecipe = {
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    yield_amount: r.yieldAmount,
                    prep_time_minutes: r.prepTimeMinutes,
                    cook_time_minutes: r.cookTimeMinutes,
                    total_time_minutes: r.totalTimeMinutes,
                    image_url: r.imageUrl,
                    source_url: r.sourceUrl,
                    notes: r.notes,
                    ingredients,
                    instructions,
                    tags: r.tags || {},
                    created_at: r.createdAt.toISOString(),
                    updated_at: r.updatedAt.toISOString(),
                };
                conflicts.push({
                    recipe: formattedRecipe,
                    violations,
                });
            }
        }
        res.json({
            totalConflicts: conflicts.length,
            conflicts,
        });
    }
    catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        console.error('Failed to get conflicts:', err);
        res.status(500).json({ error: 'Failed to analyze metadata conflicts', details });
    }
});
export default router;
