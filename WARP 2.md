# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Main Application (Next.js)
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the Next.js application for production
- `npm start` - Start the production server after building
- `npm run lint` - Run ESLint to check code quality
- `npm run type-check` - Run TypeScript compiler without emitting files (type checking only)
- `npm run export` - Export static files (if needed)
- `npm run clean` - Remove .next and out directories

### WebSocket Server (Separate Service)
- `cd server && npm start` - Run the WebSocket server on port 7654 (or Railway's PORT env var)

## System Architecture

MessMass is a **real-time collaborative event statistics dashboard** built with:

**Frontend:**
- Next.js 15.4.6 with App Router
- React 18 with TypeScript
- Real-time WebSocket client integration
- Admin panel with session-based authentication

**Backend:**
- MongoDB Atlas for data persistence
- Standalone WebSocket server (Node.js) for real-time collaboration
- Next.js API routes for REST operations

**Key Directories:**
- `app/` - Next.js app router pages and API routes
- `app/api/projects/` - REST API for project CRUD operations
- `app/admin/` - Admin panel pages and components
- `server/` - Standalone WebSocket server for real-time features
- `lib/` - Shared utilities (MongoDB connection, authentication)
- `components/` - React components
- `middleware.ts` - Route protection for admin areas

## Real-Time Collaboration System

The application implements multi-user real-time statistics tracking:

**WebSocket Architecture:**
- Standalone WebSocket server (`server/websocket-server.js`)
- Project-based "rooms" for isolated collaboration
- Automatic reconnection with exponential backoff
- Heartbeat/ping system to detect stale connections

**Collaboration Features:**
- Live user count per project
- Real-time statistics synchronization 
- Optimistic updates with server validation
- Conflict-free increment/decrement operations
- Cross-user project state updates

**Message Types:**
- `join-project` - Join a project room
- `stat-update` - Broadcast statistic changes
- `project-update` - Sync project metadata changes
- `heartbeat` - Connection health check

## Admin Panel & Authentication

**Admin Access:**
- Route: `/admin` (protected by middleware)
- Simple password-based authentication
- Session stored in HTTP-only cookies
- Role-based permissions system

### Admin Features
- View all projects with detailed statistics
- Export projects to CSV
- Delete projects (with confirmation)
- Update "Success Manager" metrics
- Real-time admin dashboard
- Enhanced chart visualizations with PNG export
- Core Fan Team metric calculation and analysis
- **Hashtag Overview Dashboard**: Visual grid of hashtags with project counts
- **Aggregated Statistics**: Cross-project analytics via hashtag categorization
- **Project Tagging**: Add up to 5 hashtags per project for organization
- **Hashtag Color Management**: ColoredHashtagBubble component with dynamic colors
- **Hashtag Editor**: HashtagEditor component for color customization
- **Enhanced Chart Export**: Improved PNG styling with better container design
- **Table Column Reordering**: Event Name | Date | Images | Total Fans | Attendees | Actions

**Authentication Flow:**
- Login at `/admin/login`
- Session validation via `lib/auth.ts`
- Route protection via `middleware.ts`
- Cookie-based session management

### Chart System Architecture

**Enhanced Visualization Components (`components/StatsCharts.tsx`):**
- **Pie Charts**: SVG-rendered with large emoji centers and simplified legends
- **Horizontal Bar Charts**: Color-coded metrics with value calculations
- **Chart Export**: html2canvas integration for PNG downloads
- **Responsive Layout**: Organized in logical rows for optimal viewing

**Chart Layout Structure:**
```
Row 1: Merchandise | Engagement | Value
Row 2: Gender Distribution | Age Groups
Row 3: Location | Sources
```

**Core Fan Team Metric:**
- **Formula**: `(merched fans / total fans) × event attendees`
- **Purpose**: Projects highly engaged merchandise-wearing fans to stadium attendance
- **Example**: (16 merched / 257 fans) × 1200 attendees = 75 core fans
- **Display**: Whole number result with "Core Fan Team" description
- **Fix Applied**: Removed incorrect currency (€) formatting for Engagement chart totals

**Chart Export Enhancements:**
- **Improved Styling**: Better container design with rounded corners and shadows
- **Download Button Positioning**: External positioning to avoid interference with exported content
- **Enhanced Visual Hierarchy**: Better typography and spacing in exported charts
- **CORS Support**: Added useCORS option for html2canvas compatibility

**New Components (v1.7.0):**
- **ColoredHashtagBubble.tsx**: Dynamic colored hashtag display component
- **HashtagEditor.tsx**: Hashtag color management component
- **Enhanced DynamicChart.tsx**: Improved chart export with better styling

## Database Structure (MongoDB)

**Collections:**
- `projects` - Event statistics projects

**Project Document Schema:**
```typescript
{
  _id: ObjectId,
  eventName: string,
  eventDate: string, // ISO date string
  hashtags?: string[], // Array of hashtag strings for categorization
  stats: {
    // Image tracking
    remoteImages: number,
    hostessImages: number,
    selfies: number,
    
    // Fan location tracking  
    indoor: number,
    outdoor: number,
    stadium: number,
    
    // Demographics
    female: number, male: number,
    genAlpha: number, genYZ: number, genX: number, boomer: number,
    
    // Merchandise
    merched: number, jersey: number, scarf: number,
    flags: number, baseballCap: number, other: number,
    
    // Success Manager fields (optional)
    approvedImages?: number,
    rejectedImages?: number,
    visitQrCode?: number,
    visitShortUrl?: number,
    visitWeb?: number,
    visitFacebook?: number,
    visitInstagram?: number,
    visitYoutube?: number,
    visitTiktok?: number,
    visitX?: number,
    visitTrustpilot?: number,
    eventAttendees?: number,
    eventTicketPurchases?: number,
    eventResultHome?: number,
    eventResultVisitor?: number,
    eventValuePropositionVisited?: number,
    eventValuePropositionPurchases?: number
  },
  createdAt: string, // ISO 8601 with milliseconds
  updatedAt: string  // ISO 8601 with milliseconds
}
```

## API Endpoints

**`/api/projects`:**
- `GET` - Fetch all projects (sorted by updatedAt desc)
- `POST` - Create new project (requires eventName, eventDate, stats, optional hashtags)
- `PUT` - Update existing project (requires projectId + update fields, supports hashtags)
- `DELETE` - Delete project by projectId query parameter

**`/api/hashtags`:**
- `GET` - Fetch all hashtags with project counts

**`/api/hashtags/[hashtag]`:**
- `GET` - Fetch aggregated statistics for specific hashtag

**Example API Usage:**
```javascript
// Create project with hashtags
POST /api/projects
{
  "eventName": "Match vs Team X",
  "eventDate": "2024-03-15",
  "hashtags": ["football", "home-game", "champions-league"],
  "stats": { /* initial stats object */ }
}

// Update project with hashtags
PUT /api/projects  
{
  "projectId": "507f1f77bcf86cd799439011",
  "eventName": "Updated Name",
  "hashtags": ["football", "away-game"],
  "stats": { /* updated stats */ }
}

// Get aggregated hashtag statistics
GET /api/hashtags/football
// Returns combined statistics from all projects tagged with "football"
```
```

## Environment Configuration

**Required Environment Variables:**
```bash
# MongoDB Atlas connection
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass

# WebSocket server (for production)
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
# Development: ws://localhost:7654 (default)

# Admin authentication
ADMIN_PASSWORD=your_secure_password
```

## WebSocket Server Deployment

**Local Development:**
1. `cd server`
2. `npm install`
3. `npm start` (runs on port 7654)

**Production Considerations:**
- Deploy WebSocket server separately (Railway, Heroku, etc.)
- Set `PORT` environment variable for hosting platform
- Update `NEXT_PUBLIC_WS_URL` to point to production WebSocket server
- WebSocket server handles automatic cleanup of stale connections

## Key Implementation Details

**Versioning Requirements:**
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Update version in `package.json` before commits
- Version must be reflected across all documentation

**Timestamp Standards:**
- All timestamps must use ISO 8601 format with milliseconds: `YYYY-MM-DDTHH:MM:SS.sssZ`
- Applied to database records (`createdAt`, `updatedAt`)
- Used in WebSocket messages and logging

**State Synchronization:**
- Client-side optimistic updates for responsive UI
- WebSocket broadcasts ensure all connected clients stay synchronized
- Database serves as source of truth for persistence
- Auto-save functionality with 1-second debounce

**Code Quality Standards:**
- TypeScript strict mode enabled
- All code must include functional and strategic comments
- ESLint configuration enforced
- No test frameworks (MVP factory approach - tests prohibited)

**Chart Implementation Standards:**
- SVG-based pie charts for scalability and clarity
- Emoji centers (36px) for visual appeal: 👥 📍 🌐
- Simplified legends without calculation details
- Consistent color schemes across chart types
- Responsive design with proper mobile optimization
- Math.round() for whole number results in calculations

## Prohibited Patterns

- **No breadcrumb navigation** - Use clear top-level navigation instead
- **No test files** - This is an MVP factory, tests are prohibited
- **No manual timestamp formats** - Must use ISO 8601 with milliseconds

## Development Workflow

1. **Start development environment:**
   ```bash
   npm run dev              # Next.js app on :3000
   cd server && npm start   # WebSocket server on :7654
   ```

2. **Code changes:**
   - Increment PATCH version before `npm run dev`
   - Add strategic comments explaining implementation decisions
   - Follow existing naming conventions and patterns

3. **Before committing:**
   - Increment MINOR version, reset PATCH to 0
   - Run `npm run build` to verify build passes
   - Update relevant documentation
   - Ensure WebSocket server compatibility

4. **Production deployment:**
   - Deploy WebSocket server to separate platform
   - Deploy Next.js app to Vercel with correct environment variables
   - Verify real-time functionality works across deployments
