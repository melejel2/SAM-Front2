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

## UI/UX Design Consistency Guidelines

### SAM Legacy Design Inspiration
When creating new components, always follow the established design patterns from the existing SAM application and maintain consistency with current implementations:

#### **Component Structure Standards**
1. **Follow existing patterns**: Study components in `subcontractors-BOQs` for structure and layout
2. **Consistent header layouts**: Use the same header structure with icon, title, description pattern
3. **Action button placement**: Follow the existing right-aligned action button patterns
4. **Form field organization**: Use the same floating-label and control grouping patterns

#### **Visual Hierarchy Standards**
```typescript
// ✅ CORRECT - Consistent header pattern
<div className="flex items-center gap-3">
    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
        <span className="iconify lucide--file-text text-purple-600 dark:text-purple-400 size-5"></span>
    </div>
    <div>
        <h2 className="text-lg font-semibold text-base-content">Title</h2>
        <p className="text-sm text-base-content/70">Description</p>
    </div>
</div>
```

#### **Button Design Standards**
- **Primary Actions**: `btn-primary` with hover states
- **Secondary Actions**: `bg-base-200 text-base-content hover:bg-base-300`
- **Destructive Actions**: `btn-error` or `bg-red-600 text-white hover:bg-red-700`
- **Success Actions**: `bg-green-600 text-white hover:bg-green-700`
- **Info Actions**: `bg-blue-600 text-white hover:bg-blue-700`

#### **Table Design Standards**
- Use `SAMTable` component consistently
- Include totals row when applicable
- Follow existing column naming patterns
- Maintain consistent action button patterns (Preview, Edit, Delete)

#### **Modal Design Standards**
- Consistent modal header with close button
- Proper loading states and error handling
- Follow existing modal size and spacing patterns
- Use proper semantic colors for different modal types

#### **Form Field Standards**
```typescript
// ✅ CORRECT - Consistent form field pattern
<label className="floating-label">
    <span>Field Label</span>
    <input 
        type="text" 
        className="input input-sm bg-base-100 border-base-300" 
        placeholder="Placeholder text"
    />
</label>
```

#### **Layout Standards**
- **Container padding**: Use `p-4` for content areas
- **Section borders**: Use `border-base-300` for dividers
- **Spacing**: Use consistent gap-3, space-x-3, space-y-3 patterns
- **Background colors**: Always use semantic base colors

### Agent-Specific Design Guidelines

#### **For sam-legacy-translator Agent**
- **Primary Focus**: Maintain visual consistency with SAM Desktop while modernizing for web
- **Key Patterns**: 
  - Multi-slide interfaces → Modern step-based wizards
  - DataGrid components → SAMTable with consistent column definitions
  - Dialog patterns → DaisyUI modals with proper theming
  - Button groups → Consistent action button layouts
- **Color Translation**: 
  - Desktop grays → DaisyUI base colors
  - Status indicators → Consistent badge patterns
  - Action buttons → Semantic color system

#### **For sam-api-integrator Agent**
- **Primary Focus**: Ensure UI components properly reflect backend data structures
- **Key Patterns**:
  - Loading states during API calls
  - Error handling with consistent toast notifications
  - Proper data transformation between backend and UI formats
  - Validation feedback matching backend rules
- **Integration Standards**:
  - Use existing hook patterns (use-vo-datasets, use-vo-boq)
  - Follow established API response handling
  - Maintain consistent error messaging

### Consistency Checklist
Before implementing any new component, verify:
- [ ] Uses semantic DaisyUI colors (base-100, base-200, etc.)
- [ ] Follows existing header/title patterns
- [ ] Uses consistent button styling and placement
- [ ] Implements proper loading and error states
- [ ] Follows established spacing and layout patterns
- [ ] Uses iconify icons with consistent sizing (size-4, size-5)
- [ ] Implements proper theme support (light/dark)
- [ ] Uses SAMTable for data display when applicable
- [ ] Follows existing modal and dialog patterns
- [ ] Uses consistent form field styling

## Unsaved Changes Dialog Fix

### Problem
The unsaved changes dialog was displaying with a solid black backdrop that completely blacked out the screen behind it, creating a poor user experience.

### Solution Applied
**Changed backdrop styling from:**
```css
bg-black bg-opacity-50
```

**To:**
```css
bg-black bg-opacity-20 backdrop-blur-sm
```

### Files Updated
- `src/pages/admin/dashboards/subcontractors-BOQs/shared/components/UnsavedChangesDialog.tsx`
- `src/pages/admin/dashboards/budget-boqs/edit/index.tsx`
- `src/pages/admin/dashboards/budget-boqs/components/BOQ/index.tsx` (Clear BOQ dialogs)
- `src/pages/admin/dashboards/subcontractors-BOQs/new/steps/Step5_BOQItems.tsx`
- `src/pages/admin/dashboards/subcontractors-BOQs/index.tsx`
- `src/pages/admin/dashboards/subcontractors-BOQs/edit/steps/EditStep5_BOQItems.tsx`
- `src/pages/admin/dashboards/subcontractors-BOQs/components/SheetSelectionModal.tsx`
- `src/pages/admin/(layout)/components/Topbar.tsx`

### Result
- Dialog now displays with a subtle blur effect behind it
- Screen content remains visible but blurred, providing better context
- Maintains focus on the dialog while keeping user aware of background content
- Consistent styling across all unsaved changes dialogs in the application
- Fixed both `bg-opacity-50` and `bg-black/50` syntax variations
- All modal dialogs throughout the application now use consistent blur backdrop styling

## Advance Payment Field Structure Fix

### Problem
The "Advance (%)" field in contract forms was incorrectly bound to the `advancePayment` field, which stores contract total amounts instead of percentages. This caused the UI to display large monetary values (e.g., "850000") in a field labeled as percentage.

### Root Cause Analysis
Based on investigation of both legacy SAM-Desktop and current SAMBACK:

1. **Legacy SAM-Desktop correctly used**:
   - `AdvancePayment` (double) - **stores monetary amounts** (contract totals or cumulative advance payments)
   - `SubcontractorAdvancePayee` (string) - **stores percentage eligible for advance** (e.g., "15" for 15%)
   - `RecoverAdvance` (string) - **stores percentage recovery rate** (e.g., "10" for 10%)

2. **Current SAMBACK maintains same structure**:
   - `advancePayment` - stores contract totals/monetary amounts
   - `subcontractorAdvancePayee` - stores advance payment eligibility percentage
   - `recoverAdvance` - stores advance recovery percentage

### Solution Applied

**Frontend Field Changes:**
- **Before**: "Advance (%)" field bound to `formData.advancePayment` (wrong - monetary amounts)
- **After**: "Advance Payment Eligible (%)" field bound to `formData.subcontractorAdvancePayee` (correct - percentages)

**Files Updated:**
- `src/pages/admin/dashboards/subcontractors-BOQs/edit/steps/EditStep4_ContractDetails.tsx`
- `src/pages/admin/dashboards/subcontractors-BOQs/new/steps/Step4_ContractDetails.tsx`

**Changes Made:**
```typescript
// REMOVED - Incorrect field binding
<span className="label-text">Advance (%)</span>
<input value={formData.advancePayment || ''} onChange={(e) => handleFieldChange('advancePayment', Number(e.target.value))} />

// CONSOLIDATED - Correct field with clearer label
<span className="label-text">Advance Payment Eligible (%)</span>
<input value={formData.subcontractorAdvancePayee || ''} onChange={(e) => handleFieldChange('subcontractorAdvancePayee', e.target.value)} />
```

### Three-Field Advance Payment System

The correct advance payment system uses three distinct fields:

1. **Contract Level - Terms Setup** (`subcontractorAdvancePayee`):
   - **Purpose**: Defines what percentage of the contract value is eligible for advance payment
   - **Example**: "15" means 15% of contract total is eligible
   - **Storage**: String field in ContractsDatasets

2. **IPC Level - Payment Requests** (`advancePaymentPercentage`):
   - **Purpose**: During IPC creation, specifies what percentage of eligible amount to actually pay
   - **Example**: If 15% is eligible ($15,000), user might request 60% of that ($9,000)
   - **Storage**: Double field in Ipcs

3. **Tracking - Monetary Amounts** (`advancePayment`, `advancePaymentAmount`):
   - **Purpose**: Stores actual calculated monetary amounts
   - **Example**: $9,000 actual advance payment amount
   - **Storage**: Double fields for calculations and audit trail

### Result
- ✅ Frontend now displays correct percentage values (e.g., "15") instead of monetary amounts (e.g., "850000")
- ✅ Field labels are clearer and more descriptive
- ✅ Maintains compatibility with existing backend structure
- ✅ Follows legacy SAM-Desktop patterns exactly

## Icon System Architecture & Square Icon Fix

### Problem: Square Icons Instead of Proper Icons
Icons were displaying as squares in various components, particularly in trade selection dialogs and buttons, due to inconsistent icon implementation patterns.

### Root Cause
The application uses **two different icon approaches**:

1. **❌ WRONG - String-based icons (causes squares)**:
   ```typescript
   <Icon icon="lucide:layers" className="w-4 h-4" />
   <span className="iconify lucide--upload w-4 h-4"></span>  // Double-hyphen syntax
   ```

2. **✅ CORRECT - Imported icon objects (matches stepper)**:
   ```typescript
   import layersIcon from "@iconify/icons-lucide/layers";
   <Icon icon={layersIcon} className="w-4 h-4" />
   ```

### Solution Applied

**Established Icon Design Language** - Following the pattern used in `StepIndicator.tsx`:

```typescript
// ✅ CORRECT - Import icon objects at top of file
import layersIcon from "@iconify/icons-lucide/layers";
import editIcon from "@iconify/icons-lucide/edit-2";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import xIcon from "@iconify/icons-lucide/x";
import infoIcon from "@iconify/icons-lucide/info";

// ✅ CORRECT - Use imported objects in JSX
<Icon icon={layersIcon} className="w-4 h-4" />
<Icon icon={editIcon} className="w-3 h-3 opacity-60" />
<Icon icon={uploadIcon} className="w-4 h-4" />
```

**Files Fixed:**
- `src/pages/admin/dashboards/subcontractors-BOQs/new/steps/Step5_BOQItems.tsx`
- `src/pages/admin/dashboards/subcontractors-BOQs/components/SheetSelectionModal.tsx`

### Icon Implementation Standards

#### ✅ DO - Use Imported Icon Objects
```typescript
// Import at top of file
import folderIcon from "@iconify/icons-lucide/folder";
import buildingIcon from "@iconify/icons-lucide/building";

// Use in component
<Icon icon={folderIcon} width={16} height={16} />
<Icon icon={buildingIcon} className="w-4 h-4" />
```

#### ❌ DON'T - Use String Names or Class Syntax
```typescript
// These cause square icons:
<Icon icon="lucide:folder" className="w-4 h-4" />           // String syntax
<span className="iconify lucide--folder w-4 h-4"></span>   // Class syntax
<span className="iconify lucide-folder w-4 h-4"></span>    // Single hyphen
```

### Why This Pattern Works
1. **Consistent with Stepper**: Matches the design language established in `StepIndicator.tsx`
2. **Bundle Optimization**: Tree-shaking works better with explicit imports
3. **Type Safety**: TypeScript can validate imported icon objects
4. **Performance**: Avoids runtime icon resolution issues
5. **Reliability**: Prevents missing icon display problems

### Migration Checklist
When fixing square icons in any component:
- [ ] Import required icon objects at top of file
- [ ] Replace all string-based icon usage
- [ ] Remove any `iconify` class-based icons
- [ ] Test in browser to verify icons display properly
- [ ] Ensure consistent sizing (`w-4 h-4`, `w-12 h-12`, etc.)

### Common Icon Imports
```typescript
// Navigation & Actions
import xIcon from "@iconify/icons-lucide/x";
import checkIcon from "@iconify/icons-lucide/check";
import editIcon from "@iconify/icons-lucide/edit";
import trashIcon from "@iconify/icons-lucide/trash";
import eyeIcon from "@iconify/icons-lucide/eye";

// UI Elements  
import searchIcon from "@iconify/icons-lucide/search";
import infoIcon from "@iconify/icons-lucide/info";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import layersIcon from "@iconify/icons-lucide/layers";

// Business Objects
import folderIcon from "@iconify/icons-lucide/folder";
import buildingIcon from "@iconify/icons-lucide/building";
import userIcon from "@iconify/icons-lucide/user";
import calculatorIcon from "@iconify/icons-lucide/calculator";
```

### Result
- ✅ Trade selection icons now display properly instead of squares
- ✅ Consistent icon system across all components
- ✅ Matches established stepper design language
- ✅ Improved maintainability and type safety