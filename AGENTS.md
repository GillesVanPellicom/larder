# Workspace Guidelines & Design Rules

## UI & Design Principles

### 1. Explanatory Information & Tooltips
- **NO Subheaders / Subtitles for Info Text**: Explanatory text, helper instructions, and disclaimers (e.g. *"Adjust ingredient quantities to fit how much you want to make. Your original recipe won't be changed."*) must NEVER be placed as subheaders or subtitle text below titles.
- **Always use `InfoTooltip`**: All informational notes, tips, and hints must be placed in the `<InfoTooltip content="..." />` component (icon with tooltip) next to the corresponding label or title.

### 2. Header & Navigation Architecture
- **No Global Top Header**: There is no global top header bar. Primary actions and navigation controls belong directly at the top of their respective pages.
- **Catalog Toolbar as Command Hub**: The recipes catalog toolbar houses search, filter controls, the `+ New Recipe` button, and the `Settings` button.
- **No Conflicts Page**: There is no conflicts page; metadata conflicts view has been fully removed.
- **Settings Navigation**: Settings is accessible via the gear icon on the recipes catalog toolbar, and provides a Back button to return to the catalog.

### 3. Settings & Appearance
- **Appearance Tab**: Settings includes an "Appearance" tab where users select their theme (Light / Dark) and access PWA install options.
- **Cookie-Based Device Settings Store**: Device-level preferences (such as appearance/theme) must be persisted using the cookie-based settings store (`src/lib/deviceSettings.ts` / `src/lib/cookies.ts`), NOT in `localStorage`.

### 4. Ingredients Context Menu
- **Yield Multiplier**: Name the item `"Yield multiplier"` with the `Scale` icon (`lucide-react`) in neutral text color, without subtext or trailing "s".
- **No Dividers**: Do not place dividers/separators between menu items.
- **Neutral Colors**: All items in the menu (including Microsoft To Do) use standard neutral foreground colors—no colored text or icons (e.g. no blue, amber, etc.).

### 5. Yield Multiplier Modal & Presets
- **Modal Title**: The title of the modal is `"Adjust recipe yield"`.
- **Volatile State**: The yield multiplier is purely session state; it must never trigger persistent database saves or mutate stored recipe data.
- **Quick Presets**: Quick shortcuts display clean multipliers without parenthetical descriptions (`½×`, `1×`, `2×`, `3×`, `4×`) in a prominent font size.
- **Decimal Precision**: Graceful cutoff of at most 2 decimal places (`formatGracefulNumber`) across all quantities and numbers.
- **Friendly Non-Technical Copy**: Informational tooltips must be warm and clear without technical jargon (e.g. no "session only", "volatile", or "permanent saves"). Reassure users simply that their original recipe won't be changed.

### 6. Modal Dialogs Global Styling
- **Background & Backdrop Blur**: All modal dialogs globally feature `backdrop-blur-md` with semi-translucent background (`bg-card/85`).
- **Seamless Footer**: Dialog footers share the modal's background and blur with no different background color and no top border.

### 7. Microsoft To Do Integration
- **Icon**: Always use the `ListTodo` icon (`list-todo` from `lucide-react`) for Microsoft To Do integrations.
- **Naming**: Use `"Export to Microsoft To Do"`.
- **Neutral Styling**: Use standard app theme neutral colors (no custom blue tints).
- **Pre-checked Items**: Any ingredients already checked off in the recipe view must be unchecked by default when exporting to avoid adding acquired items to the grocery list.

### 8. Set Recipe Form & Card Architecture
- **Set Style**: No customizable card layout widgets or designer. Recipe cards in the catalog use a consistent, fixed set layout.
- **Fixed Recipe Fields**: Recipe form uses a set sequence: Title (`Input`), Description (`Textarea`), Prep time (`Stepper` in minutes), Cook time (`Stepper` in minutes), Total time (calculated display), Yield (`Stepper`), Cover photo (image URL & preview), Tags (categories with range rules), Ingredients (`RecipeIngredientsEditor`), and Instructions (`RecipeInstructionsEditor` with Quill).
- **Times in Minutes**: All preparation, cooking, and total durations are strictly in minutes.

### 9. Stepper Component & Small Variant
- **Small Variant (`variant="small"`)**: Standard field height (`h-8`), editable number input on left with optional symbol suffix (e.g. `"min"`, `"servings"`), and a fused `<ButtonGroup>` on the right containing `-` and `+` buttons. Clamps strictly to configured bounds on blur, enter, or programmatic updates.
- **Default Variant (`variant="default"`)**: Large display with `-` on left and `+` on right for modals and focal controls.

### 10. Tag Categories Selection Range
- **Range Slider**: Replaces the binary "required" and "exclusive" switches. Configured via the `Slider` component with range `[min, max]`.
- **Slider Indents**: The slider displays tick marks and numbered indents from `0` to `N` (where `N` is the total number of tags in the category).
- **Max Decrement on Tag Removal**: When a tag is deleted and the category's range max is currently at the total count, automatically decrement max (`max--`).
- **Required Semantics**: `min >= 1` means the category is required in recipes; `min = 0` means optional.

### 11. Minimal Action Labels
- **Action-Only Copy**: Action descriptions and button labels must simply state the action verb or core noun without redundant contextual descriptors (e.g. `"Add"` instead of `"Add Ingredient Row"`, `"Edit"` instead of `"Edit Recipe"`, `"New"` instead of `"New Recipe"`, `"Save"` instead of `"Save Rules"`, `"Delete"` instead of `"Delete Category"`). The surrounding page/section context provides all necessary meaning.


