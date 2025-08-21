# Claude Code Configuration

## CRITICAL: Documentation Management Guidelines

**⚠️ ALWAYS find and update existing documentation instead of creating new files!**

### Key Rules:
1. **Search for existing .md files** before creating new documentation
2. **Update existing documentation** when logic changes instead of creating new files
3. **Remove redundant or outdated documentation** files immediately
4. **Consolidate multiple documentation files** into single comprehensive documents
5. **Keep documentation current** with actual implementation

### Common Documentation Anti-Patterns:
```
❌ WRONG - Creating multiple redundant files:
- README.md
- README_Enhanced.md  
- IMPLEMENTATION.md
- SETUP_GUIDE.md
- USAGE.md

✅ CORRECT - Single comprehensive file:
- README.md (contains all information)
```

### Documentation Update Process:
1. **Before creating documentation**: Search entire solution for existing .md files
2. **When changing logic**: Update the corresponding documentation immediately
3. **After updates**: Remove any outdated or redundant documentation files
4. **Verify accuracy**: Ensure documentation matches current implementation

### Why This Matters:
- **Prevents confusion**: Multiple conflicting documentation sources
- **Maintains accuracy**: Single source of truth stays current
- **Improves usability**: Users find complete information in one place
- **Reduces maintenance**: One file to update instead of many

## Project-Specific Conventions

### Navigation Property Naming
When working with navigation properties and relationships, always check existing patterns in controllers and services to maintain consistency.

### Testing Commands
- Run linting: `npm run lint` (verify this exists in package.json)
- Run type checking: `npm run typecheck` (verify this exists in package.json)
- Run tests: `npm test` (verify this exists in package.json)

### Build and Development
- Development server: `npm run dev`
- Build project: `npm run build`
- Preview build: `npm run preview`

## Important Notes
- This project is a React frontend application using Vite
- Compatible with NPM, Yarn, and Bun package managers  
- Bun is recommended for faster dependency installation
- Always verify commands exist in package.json before suggesting them

## Layout System & Zoom Issues Fix

### Tailwind CSS v4 + DaisyUI 5.0 Configuration
This project uses Tailwind CSS v4.1.12 with DaisyUI 5.0.50, which requires specific configuration syntax.

### Zoom Layout Issue Resolution
**Problem**: Layout padding changed dramatically when zooming from 100% to 125% on FullHD screens (1920px → ~1536px effective width).

**Root Cause**: Default Tailwind breakpoint `2xl: 1536px` caused responsive utilities to trigger/un-trigger at 125% zoom, creating inconsistent padding.

**Solution Applied**: Modified `src/styles/tailwind.css` with proper Tailwind CSS v4 syntax:

```css
@theme {
    /* Override default breakpoints to prevent zoom jumping */
    --breakpoint-2xl: 1700px; /* Moved from 1536px to prevent 125% zoom trigger */
    
    /* Override container sizes with consistent padding */
    --container: 80rem; /* Fixed max-width */
}

@utility container {
    margin-inline: auto;
    padding-inline: 4rem; /* Fixed 64px padding - NO responsive breakpoints */
    max-width: 80rem;
}
```

**Result**: Consistent 96px total padding (64px container + 32px from `px-8`) on both 100% and 125% zoom levels.

### Key Technical Details
- Uses `@theme` directive for breakpoint overrides (Tailwind CSS v4 syntax)
- Uses `@utility` directive for custom container utility
- Eliminates responsive breakpoint jumping by moving `2xl` from 1536px to 1700px
- Fixed padding prevents layout shifts across zoom levels

## Tailwind CSS v4 Dynamic Color Classes Issue

### Problem
This project uses Tailwind CSS v4, which has stricter content scanning and may not generate dynamically applied color classes like `!bg-blue-100`, `!border-blue-400`, etc. when they're used conditionally in JavaScript/TypeScript code.

### Symptoms
- Color classes applied via `className={cn(...)}` with conditional logic don't show visual effects
- Browser DevTools shows classes are applied but no styling appears
- Inline styles work but Tailwind classes don't

### Root Causes
1. **Tailwind v4 Content Scanning**: Classes used in dynamic/conditional contexts may not be detected during build-time scanning
2. **React Re-rendering**: Fast re-renders can clear visual state before classes take effect
3. **CSS Specificity**: Other styles may override dynamically applied classes

### Solutions

#### Option 1: Use Inline Styles (Recommended for Dynamic Styling)
```typescript
// ✅ WORKS - Direct inline styles
<tr style={isSelected ? {
    backgroundColor: 'rgb(219 234 254)', // Blue-100
    borderLeft: '4px solid rgb(96 165 250)', // Blue-400
    borderTop: '2px solid rgb(96 165 250)',
    borderRight: '2px solid rgb(96 165 250)', 
    borderBottom: '2px solid rgb(96 165 250)'
} : undefined}>

// ❌ DOESN'T WORK - Dynamic Tailwind classes
<tr className={cn("bg-base-100", {
    "!bg-blue-100 !border-blue-400": isSelected
})}>
```

#### Option 2: Prevent React Re-rendering Loops
```typescript
// ✅ Use functional state updates to prevent unnecessary re-renders
const handleRowClick = useCallback((row: any) => {
    setSelectedRow(prevSelected => {
        // Only update if actually different
        if (prevSelected?.id === row.id) {
            return prevSelected;
        }
        return row;
    });
}, []);
```

#### Option 3: Add Classes to Tailwind Safelist (if needed)
In `tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Colors that might be used dynamically
    { pattern: /bg-(blue|green|red|yellow)-(50|100|200|300|400|500)/ },
    { pattern: /border-(blue|green|red|yellow)-(200|300|400|500)/ },
    { pattern: /text-(blue|green|red|yellow)-(600|700|800|900)/ }
  ]
}
```

### Best Practices
1. **Use inline styles for truly dynamic conditional styling**
2. **Use Tailwind classes for static/predictable styling**
3. **Optimize React state updates to prevent re-render loops**
4. **Test color classes in browser DevTools to verify they're generated**

### When to Use Each Approach
- **Inline Styles**: Dynamic selections, hover effects, conditional states
- **Tailwind Classes**: Static layouts, consistent component styling, design system colors
- **Safelist**: When you need Tailwind classes for dynamic content but they're not being detected

## DaisyUI Theme System & Color Guidelines

### App Theme vs System Theme
This application manages its own theme state independently from the system theme. Users can select light or dark mode within the app regardless of their system preferences.

### DaisyUI Semantic Color Variables (Theme-Aware)
Always use DaisyUI's semantic color variables instead of fixed Tailwind colors to ensure proper theme compatibility:

#### ✅ CORRECT - Theme-Aware Colors
```html
<!-- Light gray buttons that adapt to themes -->
<button class="btn bg-base-200 text-base-content hover:bg-base-300">
    Button
</button>

<!-- Background colors that respect themes -->
<div class="bg-base-100 text-base-content">Content</div>
<div class="bg-base-200 text-base-content">Lighter background</div>
<div class="bg-base-300 text-base-content">Even lighter</div>
```

#### ❌ WRONG - Fixed Colors (Don't adapt to themes)
```html
<!-- These will look wrong in dark mode -->
<button class="btn bg-gray-200 text-gray-800">Button</button>
<div class="bg-white text-black">Content</div>
```

### DaisyUI Color Reference
**Base Colors (Auto-adapt to theme):**
- `bg-base-100` + `text-base-content` - Main background
- `bg-base-200` + `text-base-content` - Slightly different background  
- `bg-base-300` + `text-base-content` - Even more contrast
- `border-base-300` - Subtle borders

**Semantic Colors (Consistent across themes):**
- `btn-primary` / `bg-primary` + `text-primary-content` - Main actions
- `btn-secondary` / `bg-secondary` + `text-secondary-content` - Secondary actions
- `btn-info` / `bg-info` + `text-info-content` - Information (blue)
- `btn-success` / `bg-success` + `text-success-content` - Success (green)
- `btn-warning` / `bg-warning` + `text-warning-content` - Warning (yellow)
- `btn-error` / `bg-error` + `text-error-content` - Error/destructive (red)

### Button Color Guidelines

#### Light Gray Buttons (Recommended for secondary actions)
```html
<button class="btn bg-base-200 text-base-content hover:bg-base-300 transition-all duration-200 ease-in-out">
    Secondary Action
</button>
```

#### Semantic Action Buttons
```html
<!-- Primary actions -->
<button class="btn btn-primary hover:btn-primary-focus transition-all duration-200 ease-in-out">
    Save
</button>

<!-- Success actions -->  
<button class="btn btn-success hover:btn-success-focus transition-all duration-200 ease-in-out">
    Complete
</button>

<!-- Destructive actions -->
<button class="btn btn-error hover:btn-error-focus transition-all duration-200 ease-in-out">
    Delete
</button>
```

### Theme Switching Implementation
When implementing theme switching, ensure all components use semantic variables:

```typescript
// Theme switching logic should update DaisyUI data-theme attribute
document.documentElement.setAttribute('data-theme', 'light'); // or 'dark'
```

### Testing Theme Compatibility
1. Test all UI components in both light and dark modes
2. Verify text contrast meets accessibility standards
3. Ensure hover states work properly in both themes
4. Check that custom colors don't break theme consistency

### Common Anti-Patterns to Avoid
- Using fixed gray colors (`bg-gray-200`) instead of semantic (`bg-base-200`)
- Hardcoding text colors instead of using `text-base-content`
- Creating custom CSS that doesn't respect theme variables
- Using `btn-neutral` (appears too dark) instead of `bg-base-200` for light gray