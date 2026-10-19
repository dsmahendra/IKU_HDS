# HDS Delivery IKU Admin Frontend

React frontend for HDS Delivery IKU Admin (Workout Meals).

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Opens on `http://localhost:3000`

The frontend automatically proxies API calls to `http://localhost:3001` (backend).

### 3. Build for Production

```bash
npm run build
```

Builds to `dist/` folder ready for deployment.

---

## Project Structure

```
src/
├── App.jsx                 # Main app component
├── App.css                 # Global styles
├── main.jsx               # React entry point
└── components/
    ├── RegionsList.jsx    # Screen 1: List all regions
    ├── RegionCard.jsx     # Individual region card
    └── RegionDetail.jsx   # Screen 2: Region detail view
```

---

## Screens

### Screen 1: Delivery Regions (`RegionsList.jsx`)
- List all HDS regions
- Toggle enable/disable with quick toggle switches
- Bulk select and bulk enable/disable
- Search filter
- View region configuration

**Features:**
- ✅ Fetch regions from API
- ✅ Toggle individual regions
- ✅ Bulk enable/disable
- ✅ Error handling + success messages
- ✅ Loading states
- ✅ Responsive design

### Screen 2: Region Configuration (`RegionDetail.jsx`)
- View single region's delivery schedules
- See cutoff → pack → delivery day flow
- Mark default schedule
- Add new schedules (UI ready, endpoint pending)

**Features:**
- ✅ Fetch region details
- ✅ Display delivery schedules with visual flow
- ✅ Back navigation
- ✅ Error handling

### Screen 3: Suburbs/Postcodes
- Coming next: Table view of suburb to region mappings
- Search + filter by region
- Bulk import/export

---

## API Integration

### Backend URL
Default: `http://localhost:3001/api`

Configure in `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### Endpoints Used

**Regions List:**
```
GET /api/regions
```

**Get Region:**
```
GET /api/regions/:id
```

**Toggle Region:**
```
PUT /api/regions/:id/toggle
```

**Bulk Enable:**
```
POST /api/regions/bulk/enable
Body: { "ids": [1, 2, 3] }
```

**Bulk Disable:**
```
POST /api/regions/bulk/disable
Body: { "ids": [1, 2, 3] }
```

---

## Component APIs

### RegionsList

**Props:**
- `onSelectRegion(regionId)` - Called when user clicks "View Config"

**Features:**
- Fetches regions on mount
- Handles region toggling
- Manages bulk selection state
- Filters by search term
- Shows loading/error states

### RegionCard

**Props:**
- `region` - Region object
- `selected` - Boolean (is selected)
- `onSelect(checked)` - Checkbox callback
- `onToggle()` - Toggle enable/disable
- `onViewConfig()` - Navigate to detail

### RegionDetail

**Props:**
- `regionId` - ID of region to display
- `onBack()` - Go back to list

**Features:**
- Fetches region detail on mount
- Shows delivery schedules with visual flow
- Ready for schedule editing (endpoints pending)

---

## Styling

### Color Scheme
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Success: `#4caf50` (Green)
- Error: `#c33` (Red)
- Background: `#f5f5f5` (Light Gray)

### Responsive Breakpoints
- Desktop: `>1024px` - Full grid layout
- Tablet: `768px-1024px` - Adjusted grid
- Mobile: `<768px` - Single column

---

## Development Notes

### State Management
Currently using React hooks (`useState`). For more complex state, consider:
- React Context
- Redux
- Zustand

### Error Handling
- Network errors: Caught and displayed in UI
- Form validation: Ready to implement
- Server errors: Displayed in error messages

### Testing
Add tests with:
```bash
npm install --save-dev vitest @testing-library/react
```

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Alternative Hosting
- Build: `npm run build`
- Upload `dist/` folder to any static host
- Configure API proxy in build settings

---

## Next Steps

1. ✅ Screen 1: Regions list (complete)
2. ✅ Screen 2: Region detail (complete)
3. Screen 3: Suburbs/Postcodes mapping
4. Testing + error handling refinement
5. Deployment setup

---

Developed with ❤️ for Workout Meals
