# Internal Scrolling Pattern Implementation Guide

## Overview

This guide provides a step-by-step approach to converting table pages from **external scrolling** (entire page scrolls) to **internal scrolling** (page height fixed, table scrolls internally with sticky headers/footers).

## Benefits of Internal Scrolling

✅ **Better UX**: Headers and action buttons stay visible while scrolling through data
✅ **Professional Feel**: Modern table interfaces with sticky elements
✅ **Consistent Layout**: Fixed page height prevents layout jumps
✅ **Mobile Friendly**: Better control over scrolling behavior

---

## Pattern Breakdown

### Working Example Reference

**Files to study:**
- **Page Wrapper**: `/src/pages/admin/dashboards/budget-boqs/edit/index.tsx` (lines 217-224)
- **Component Container**: `/src/pages/admin/dashboards/budget-boqs/components/BOQ/index.tsx` (lines 478-614)
- **Table Component**: `/src/pages/admin/dashboards/budget-boqs/components/BOQ/components/boqTable.tsx` (lines 689-731)

### Key Principles

1. **Container Height Calculation**: `calc(100vh - 4rem)` accounts for topbar (4rem = 64px)
2. **Flexbox Layout**: `display: flex; flexDirection: column` for vertical stacking
3. **Overflow Control**: `overflow: hidden` on container prevents external scroll
4. **Flex Distribution**:
   - Fixed sections use `flexShrink: 0`
   - Scrollable section uses `flex: 1` with `minHeight: 0`
5. **Sticky Elements**: Table headers/footers use `position: sticky` within scrollable container

---

## Pattern Template

### Level 1: Page Wrapper

```tsx
// File: /src/pages/admin/dashboards/{module}/edit/index.tsx (or details/index.tsx)

return (
    <div style={{
        width: '100%',
        height: 'calc(100vh - 4rem)',  // Full viewport minus topbar
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'              // Block external scroll
    }}>
        {/* Your component goes here */}
        <YourComponent {...props} />

        {/* Dialogs/Modals can be siblings here */}
        {showDialog && <Dialog />}
    </div>
);
```

**Key Points:**
- This wrapper takes **100% of available viewport height**
- `overflow: hidden` prevents the entire page from scrolling
- All scrolling will happen **inside** child components

---

### Level 2: Component Container (3-Section Layout)

```tsx
// File: /src/pages/admin/dashboards/{module}/components/YourComponent.tsx

return (
    <div style={{
        height: '100%',           // Take full height from parent
        width: '100%',
        minHeight: 0,             // Critical for flex children
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'        // Prevent scroll at this level
    }}>
        {/* SECTION 1: Fixed Header (Action Buttons, Filters, etc.) */}
        <div className="flex justify-between items-center mb-4" style={{ flexShrink: 0 }}>
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="btn btn-sm">Back</button>
                <select className="select select-sm">...</select>
                <button className="btn btn-sm">Clear BOQ</button>
            </div>
            <div className="flex items-center space-x-2">
                <button className="btn btn-sm">Import</button>
                <button onClick={onSave} className="btn btn-sm">Save</button>
            </div>
        </div>

        {/* SECTION 2: Scrollable Content (Table) */}
        <div style={{
            flex: 1,              // Take all remaining space
            minHeight: 0,         // CRITICAL: Allow shrinking below content size
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <YourTable {...tableProps} />
        </div>

        {/* SECTION 3: Fixed Footer (Optional - Tabs, Pagination, etc.) */}
        <div style={{ flexShrink: 0 }}>
            {/* Sheet tabs, pagination, totals, etc. */}
        </div>
    </div>
);
```

**Key Points:**
- **Section 1 (Header)**: `flexShrink: 0` keeps it fixed at top
- **Section 2 (Content)**: `flex: 1` + `minHeight: 0` allows internal scrolling
- **Section 3 (Footer)**: `flexShrink: 0` keeps it fixed at bottom

---

### Level 3: Table Component with Sticky Header/Footer

```tsx
// File: /src/pages/admin/dashboards/{module}/components/YourTable.tsx

return (
    <div
        className="bg-base-100 rounded-t-xl border border-base-300"
        style={{
            height: '100%',       // Fill parent container
            width: '100%',
            minHeight: 0,         // Allow flex shrinking
            display: 'flex',
            flexDirection: 'column'
        }}
    >
        {/* Table Header (Non-scrollable metadata) */}
        <div className="px-4 py-3 border-b border-base-300" style={{ flexShrink: 0 }}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Table Title</h3>
                <div className="text-sm text-base-content/70">
                    {/* Breadcrumbs, counts, etc. */}
                </div>
            </div>
        </div>

        {/* Scrollable Table Container */}
        <div style={{
            flex: 1,              // Take remaining height
            minHeight: 0,         // Critical for overflow
            width: '100%',
            overflow: 'auto'      // Enable scrolling HERE
        }}>
            <table className="w-full border-collapse bg-base-100 text-xs sm:text-sm">
                {/* Sticky Header Row */}
                <thead className="sticky top-0 z-20">
                    <tr>
                        <th className="px-3 py-2.5 border border-base-300 bg-base-200">
                            Column 1
                        </th>
                        <th className="px-3 py-2.5 border border-base-300 bg-base-200">
                            Column 2
                        </th>
                        {/* ... more columns ... */}
                    </tr>
                </thead>

                <tbody>
                    {data.map(row => (
                        <tr key={row.id}>
                            <td className="border border-base-300">{row.col1}</td>
                            <td className="border border-base-300">{row.col2}</td>
                        </tr>
                    ))}
                </tbody>

                {/* Sticky Footer Row (Optional) */}
                <tfoot className="sticky bottom-0 z-10">
                    <tr className="bg-base-200">
                        <td className="px-3 py-2 border border-base-300 font-semibold">
                            TOTAL
                        </td>
                        <td className="px-3 py-2 border border-base-300 font-semibold">
                            {totals.col2}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* Sheet Tabs / Pagination (Optional) */}
        <div className="bg-base-100 flex w-full overflow-x-auto border-t border-base-300"
             style={{ flexShrink: 0 }}>
            {sheets.map(sheet => (
                <span key={sheet.id} className="px-3 py-1.5 text-sm cursor-pointer">
                    {sheet.name}
                </span>
            ))}
        </div>
    </div>
);
```

**Key Points:**
- **Sticky Header**: `className="sticky top-0 z-20"` on `<thead>`
- **Sticky Footer**: `className="sticky bottom-0 z-10"` on `<tfoot>`
- **Z-index**: Header higher than footer to prevent overlap
- **Scrolling**: Only the middle `<div>` scrolls, header/footer stay visible

---

## Step-by-Step Migration Guide

### Step 1: Identify Page Structure

**Before (External Scrolling):**
```tsx
// Page just returns component directly
return <YourComponent {...props} />;
```

**After (Internal Scrolling):**
```tsx
// Wrap in fixed-height container
return (
    <div style={{
        height: 'calc(100vh - 4rem)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    }}>
        <YourComponent {...props} />
    </div>
);
```

---

### Step 2: Update Component Container

**Before:**
```tsx
return (
    <div className="p-4">
        <div className="flex justify-between mb-4">
            {/* Action buttons */}
        </div>
        <YourTable />
    </div>
);
```

**After:**
```tsx
return (
    <div style={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    }}>
        {/* Fixed header */}
        <div className="flex justify-between mb-4" style={{ flexShrink: 0 }}>
            {/* Action buttons */}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <YourTable />
        </div>
    </div>
);
```

---

### Step 3: Update Table Component

**Before:**
```tsx
return (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>...</thead>
            <tbody>...</tbody>
        </table>
    </div>
);
```

**After:**
```tsx
return (
    <div style={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
    }}>
        {/* Non-scrollable header */}
        <div className="px-4 py-3 border-b" style={{ flexShrink: 0 }}>
            <h3>Table Title</h3>
        </div>

        {/* Scrollable table */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <table className="w-full">
                <thead className="sticky top-0 z-20 bg-base-200">...</thead>
                <tbody>...</tbody>
                <tfoot className="sticky bottom-0 z-10 bg-base-200">...</tfoot>
            </table>
        </div>
    </div>
);
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Missing `minHeight: 0`

**Problem:**
```tsx
<div style={{ flex: 1, overflow: 'auto' }}>
    {/* Table won't scroll, grows infinitely */}
</div>
```

**Solution:**
```tsx
<div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
    {/* Now it scrolls properly */}
</div>
```

**Why:** Flex children have implicit `min-height: auto`, preventing them from shrinking below content size. Setting `minHeight: 0` allows the container to respect the flex constraint.

---

### ❌ Pitfall 2: Wrong Height Calculation

**Problem:**
```tsx
// Forgot to account for topbar
<div style={{ height: '100vh' }}>
```

**Solution:**
```tsx
// Subtract topbar height (4rem = 64px)
<div style={{ height: 'calc(100vh - 4rem)' }}>
```

---

### ❌ Pitfall 3: Overflow on Wrong Element

**Problem:**
```tsx
<div style={{ overflow: 'auto' }}>  {/* Container scrolls */}
    <div style={{ flex: 1 }}>
        <table>...</table>
    </div>
</div>
```

**Solution:**
```tsx
<div style={{ overflow: 'hidden' }}>  {/* Container blocks scroll */}
    <div style={{ flex: 1, overflow: 'auto' }}>  {/* Child scrolls */}
        <table>...</table>
    </div>
</div>
```

---

### ❌ Pitfall 4: Sticky Header Not Working

**Problem:**
```tsx
<div style={{ overflow: 'auto' }}>
    <div>
        <table>
            <thead className="sticky top-0">  {/* Won't stick! */}
```

**Reason:** Sticky positioning requires the scrollable container to be a **direct ancestor** of the sticky element.

**Solution:**
```tsx
<div style={{ overflow: 'auto' }}>
    <table>  {/* Table is direct child of scroll container */}
        <thead className="sticky top-0 z-20">  {/* Now it works! */}
```

---

### ❌ Pitfall 5: Removing Padding Too Early

**Problem:**
```tsx
// Removed all padding, elements touch edges
<div style={{ height: '100%', overflow: 'hidden' }}>
    <div style={{ flexShrink: 0 }}>Buttons</div>
</div>
```

**Solution:**
```tsx
// Keep padding/margin for spacing
<div style={{ height: '100%', overflow: 'hidden' }}>
    <div className="mb-4" style={{ flexShrink: 0 }}>Buttons</div>
</div>
```

---

## Before/After Examples

### Example 1: Simple Table Page

**Before:**
```tsx
const TablePage = () => {
    return (
        <div className="p-4">
            <div className="flex justify-between mb-4">
                <button>Back</button>
                <button>Save</button>
            </div>
            <table className="w-full">
                <thead><tr><th>Column</th></tr></thead>
                <tbody>{/* 1000 rows */}</tbody>
            </table>
        </div>
    );
};
```

**After:**
```tsx
const TablePage = () => {
    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed header */}
            <div className="flex justify-between p-4" style={{ flexShrink: 0 }}>
                <button>Back</button>
                <button>Save</button>
            </div>

            {/* Scrollable table */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <table className="w-full">
                    <thead className="sticky top-0 z-20 bg-base-200">
                        <tr><th>Column</th></tr>
                    </thead>
                    <tbody>{/* 1000 rows - scrolls internally */}</tbody>
                </table>
            </div>
        </div>
    );
};
```

---

### Example 2: Table with Tabs (Like Budget BOQ)

**Before:**
```tsx
const BOQPage = () => {
    return (
        <div className="p-4">
            <div className="flex gap-2 mb-4">
                <button>Import</button>
                <button>Save</button>
            </div>
            <table>...</table>
            <div className="flex border-t">
                {tabs.map(tab => <span key={tab.id}>{tab.name}</span>)}
            </div>
        </div>
    );
};
```

**After:**
```tsx
const BOQPage = () => {
    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed action buttons */}
            <div className="flex gap-2 p-4" style={{ flexShrink: 0 }}>
                <button>Import</button>
                <button>Save</button>
            </div>

            {/* Scrollable table */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <table className="w-full">
                    <thead className="sticky top-0 z-20">...</thead>
                    <tbody>...</tbody>
                    <tfoot className="sticky bottom-0 z-10">...</tfoot>
                </table>
            </div>

            {/* Fixed tabs */}
            <div className="flex border-t" style={{ flexShrink: 0 }}>
                {tabs.map(tab => <span key={tab.id}>{tab.name}</span>)}
            </div>
        </div>
    );
};
```

---

## Testing Checklist

After implementing the pattern, verify:

- [ ] **Page height is fixed**: No scroll bar on the body/html
- [ ] **Table scrolls internally**: Scroll bar appears on table container
- [ ] **Header stays visible**: Action buttons visible when scrolled to bottom
- [ ] **Footer stays visible**: Tabs/pagination visible when scrolled to top
- [ ] **Sticky table header works**: Column headers visible when scrolling rows
- [ ] **Sticky table footer works** (if used): Totals row visible when scrolling up
- [ ] **Responsive**: Works at different zoom levels (100%, 125%, 150%)
- [ ] **No layout jumps**: Height remains constant during interactions
- [ ] **Dialogs/Modals work**: Fixed-position overlays still appear correctly

---

## Quick Reference Card

| Element | Style Properties | Purpose |
|---------|-----------------|---------|
| **Page Wrapper** | `height: calc(100vh - 4rem)` <br> `display: flex` <br> `flexDirection: column` <br> `overflow: hidden` | Fixed viewport height, block external scroll |
| **Fixed Header** | `flexShrink: 0` | Prevent shrinking, stay at top |
| **Scrollable Content** | `flex: 1` <br> `minHeight: 0` <br> `overflow: auto` | Take remaining space, enable scroll |
| **Fixed Footer** | `flexShrink: 0` | Prevent shrinking, stay at bottom |
| **Sticky Table Header** | `className="sticky top-0 z-20"` | Stick to top when scrolling |
| **Sticky Table Footer** | `className="sticky bottom-0 z-10"` | Stick to bottom when scrolling |

---

## Conversion Priority

Apply this pattern to pages in this order:

### High Priority (Most Benefit)
1. **Budget BOQ Edit** ✅ (Already implemented - reference example)
2. **Subcontractor BOQ Edit** - Similar table structure
3. **Subcontractor BOQ Details** - Large data tables
4. **IPC Management** - Complex tables with calculations

### Medium Priority
5. **Contract Templates List** - Long lists
6. **Contracts Dataset List** - Long lists
7. **Project Management** - Table views
8. **VO Management** - Data-heavy tables

### Low Priority (Optional)
9. **Admin Tools** - Usually shorter lists
10. **Dashboards** - Different layout needs

---

## Advanced: Nested Scrolling

For pages with **multiple scrollable sections** (e.g., split view):

```tsx
<div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
    {/* Left sidebar - scrollable */}
    <div style={{ width: '300px', flexShrink: 0, overflow: 'auto' }}>
        <nav>...</nav>
    </div>

    {/* Right content - scrollable */}
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>Fixed Header</div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>Scrollable Table</div>
    </div>
</div>
```

---

## Troubleshooting

### Issue: Table grows beyond container

**Check:**
1. Is `minHeight: 0` set on all flex children?
2. Is `overflow: hidden` on the container?
3. Is `overflow: auto` on the correct scrollable div?

### Issue: Sticky header not working

**Check:**
1. Is `<table>` a direct child of the scroll container?
2. Is `className="sticky top-0"` on `<thead>`?
3. Does the thead have a background color?

### Issue: Footer tabs overlap content

**Check:**
1. Is footer div using `flexShrink: 0`?
2. Is the scrollable section using `flex: 1`?
3. Is container using `flexDirection: column`?

---

## Additional Resources

- **Working Example**: `/src/pages/admin/dashboards/budget-boqs/edit/index.tsx`
- **Component Pattern**: `/src/pages/admin/dashboards/budget-boqs/components/BOQ/index.tsx`
- **Table Pattern**: `/src/pages/admin/dashboards/budget-boqs/components/BOQ/components/boqTable.tsx`

---

## Summary

The internal scrolling pattern provides a better UX by:

1. **Keeping key actions visible** (buttons, filters)
2. **Maintaining context** (breadcrumbs, tabs)
3. **Improving performance** (smaller scroll containers)
4. **Modernizing the interface** (sticky headers/footers)

**Key Formula:**
```
Page Wrapper (calc(100vh - 4rem), overflow: hidden)
    ├── Fixed Header (flexShrink: 0)
    ├── Scrollable Content (flex: 1, minHeight: 0, overflow: auto)
    └── Fixed Footer (flexShrink: 0)
```

Follow this pattern consistently across all table pages for a cohesive, professional application experience.

---

**Last Updated**: January 2025
**Pattern Version**: 1.0
**Tested On**: Budget BOQ Edit page (fully functional)
