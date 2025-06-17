# Project Rules: Askim Candles E-commerce Platform

## Memory Bank System (ESSENTIAL)

### Documentation Structure
```
memory-bank/
├── projectbrief.md        # Foundation document
├── productContext.md      # Why project exists, problems solved
├── activeContext.md       # Current work focus (UPDATE AFTER TASK)
├── systemPatterns.md      # Architecture decisions
├── techContext.md         # Technical context (UPDATE WITH NEW TECH)
├── progress.md            # Status tracking (UPDATE AFTER TASK)
└── deployment_guide.md    # Deployment procedures
```

### MANDATORY Actions for Every Task
1. **Before starting**: Read ALL memory-bank/ files
2. **After completing**: Update activeContext.md with changes
3. **After completing**: Update progress.md with new status
4. **If architecture changes**: Update systemPatterns.md
5. **If tech stack changes**: Update techContext.md

### Memory Bank Update Example
```markdown
## activeContext.md Updates Required:
### Recent Changes
- ✅ Migrated to React 19.1.0
- ✅ Fixed Tailwind CSS 4.x compatibility  
- ✅ Resolved all Checkbox component issues
- ✅ Updated Docker configuration

### Current Status  
- All builds passing
- Components working correctly
- Ready for next development phase
```

## Project Context
This is an e-commerce platform for artisanal scented candles and home decor with:
- Multi-language support (UZ default, RU, EN)
- Admin panel with role-based access (ADMIN/MANAGER)
- Corporate client focus
- Docker deployment ready
- Prisma + PostgreSQL backend (planned)

## Critical Current Issues to Fix

### 1. Tailwind CSS 4.x Migration (PRIORITY 1)
- Must support Tailwind CSS 4.1.10 with Next.js 15.3.3
- Update postcss.config.js for new Tailwind architecture
- Install @tailwindcss/postcss if required
- Ensure all existing Tailwind classes continue working
- NO rollback to older Tailwind versions allowed

### 2. React 19.1 Compatibility (PRIORITY 1)
- Fix all onCheckedChange handlers in Checkbox components
- Update useParams usage with optional chaining
- Ensure form components work with React Hook Form 7.58.0
- Maintain strict TypeScript typing
- Update forwardRef patterns if needed

### 3. Component-Specific Fixes Required

#### src/app/[locale]/account/addresses/page.tsx
- Fix Checkbox onCheckedChange handlers
- Ensure form validation works
- Fix useParams typing
- Maintain existing functionality

#### src/components/products/ProductFilters.tsx  
- Fix all filter Checkbox components
- Ensure price range sliders work
- Maintain URL state management
- Keep responsive design

#### src/components/ui/checkbox.tsx
- Update for React 19.1 compatibility
- Maintain ShadCN UI patterns
- Ensure proper TypeScript types

#### src/components/ui/form.tsx
- Fix FormControl aria-invalid typing
- Ensure React Hook Form compatibility
- Maintain existing form patterns

## Architecture Constraints

### Main Site Structure
- Path-based i18n: `/[locale]/page`
- Product catalog with filtering/sorting
- Shopping cart with localStorage persistence
- Hybrid auth: NextAuth + simulated email/password
- Mobile-responsive design

### Admin Panel Structure  
- Protected routes with role checking
- Client-side i18n (EN/RU) with localStorage
- Dark/light theme support
- Product management with image uploads
- Mobile access restriction (except login)

### Docker Requirements
- Remove deprecated 'version' from docker-compose.yml
- Multi-stage build with Next.js standalone
- PostgreSQL + Next.js app containers
- Development and production configs

## Specific Component Patterns

### Checkbox Usage Pattern (MUST FIX)
```typescript
// CORRECT for React 19.1:
<Checkbox
  checked={selectedItems.includes(item)}
  onCheckedChange={(checked) => {
    if (checked === true) {
      setSelectedItems(prev => [...prev, item]);
    } else {
      setSelectedItems(prev => prev.filter(i => i !== item));
    }
  }}
/>
```

### useParams Pattern (MUST FIX)
```typescript
// CORRECT for React 19.1:
const params = useParams();
const locale = (params?.locale as Locale) || 'uz';
```

### Form Field Pattern
```typescript
// MAINTAIN this pattern:
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## File Dependencies & Imports

### Required Imports for Problem Files
- `"use client"` directive for client components
- Proper ShadCN UI component imports
- React Hook Form imports with correct resolvers
- Lucide React icons
- Type imports with `import type`

### Critical Dependencies
- @hookform/resolvers ^5.1.1 (updated)
- react ^19.1.0 (updated)
- react-dom ^19.1.0 (updated)
- tailwindcss ^4.1.10 (updated)
- @types/react ^19.1.8 (updated)

## Testing & Validation

### Build Requirements
- `npm run build` must complete without errors
- No TypeScript compilation errors
- No ESLint errors (with current config)
- Docker build must succeed

### Functional Requirements
- All forms must submit successfully
- Checkbox filtering must work
- Language switching must work
- Admin panel navigation must work
- Product pages must load and display

### Performance Requirements
- Fast build times
- Minimal bundle size
- No hydration errors
- Proper SSR/SSG where applicable

## Forbidden Actions
- DO NOT downgrade any package versions
- DO NOT use deprecated React APIs
- DO NOT ignore TypeScript errors
- DO NOT break existing functionality
- DO NOT remove i18n support
- DO NOT modify core business logic

## Success Criteria
1. ✅ Tailwind CSS 4.x works with Next.js 15.3.3
2. ✅ All Checkbox components work with React 19.1
3. ✅ All forms submit and validate correctly
4. ✅ Product filtering functions properly
5. ✅ Docker builds and runs without warnings
6. ✅ TypeScript compilation passes
7. ✅ No runtime errors in browser console
8. ✅ All existing features continue working
9. ✅ Memory Bank documentation updated with changes

## Post-Completion Requirements

### MUST Update Memory Bank Files:

#### activeContext.md
- Document what was changed
- Update current focus
- List completed tasks
- Note any new decisions made

#### progress.md  
- Update "What works" section
- Add new completed features
- Update current status
- Note any new issues discovered

#### techContext.md (if applicable)
- Document new React 19.1 patterns used
- Add Tailwind CSS 4.x configuration details
- Update dependency information
- Add any new technical constraints

### Failure to Update = Incomplete Task
Memory Bank updates are NOT optional - they are essential for project continuity and future development work.