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