# FlashMart Smart Search

## Current State
The Customer Dashboard displays all vendor products in a grid with no search or filter functionality. Products are fetched from the backend and rendered directly. There is no search bar, filtering, or sorting.

## Requested Changes (Diff)

### Add
- Smart search bar at the top of the product grid in CustomerDashboard
- `useSmartSearch` hook with NLP-style query parsing logic (pure frontend, no external APIs)
- `SmartSearchBar` component with:
  - Search input with debounce
  - Auto-suggestions dropdown (based on product names + categories)
  - Recent searches (stored in localStorage)
  - Trending searches (hardcoded popular queries)
  - Natural language query parser that extracts: price filters, category hints, keyword relevance
  - Search result ranking: price match > category match > keyword match > popular items
- `searchUtils.ts` utility for NLP query parsing

### Modify
- `CustomerDashboard.tsx`: add `SmartSearchBar` above product grid; filter/rank `products` array using smart search results before rendering

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/utils/searchUtils.ts` — NLP query parser:
   - Keyword→category mapping (e.g. "snack" → snacks, "healthy" → vegetables/fruits, "party" → beverages/snacks)
   - Price intent extraction: "under 100", "cheap", "budget" → maxPrice
   - Scoring function: score each product against parsed query
   - Ranking: popular (high price proxy for now, or fixed popularity scores) + relevance score
2. Create `src/frontend/src/components/SmartSearchBar.tsx`:
   - Controlled search input
   - Debounced suggestions
   - Dropdown with: recent searches, trending searches, product name suggestions
   - Keyboard navigation
   - Clear button
3. Update `CustomerDashboard.tsx`:
   - Import and render `SmartSearchBar`
   - Apply filtered+ranked product list to the grid
