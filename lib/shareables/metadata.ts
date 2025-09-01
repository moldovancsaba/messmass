// lib/shareables/metadata.ts
// Component registry and metadata system for MessMass Shareables

export interface ComponentMetadata {
  id: string                    // Unique component identifier
  name: string                  // Display name
  description: string           // Brief description
  category: ComponentCategory   // Component category
  version: string              // Component version (semantic versioning)
  lastUpdated: string          // ISO 8601 timestamp
  dependencies: Dependency[]    // Required packages and versions
  tags: string[]               // Search tags
  compatibility: Compatibility // Framework compatibility
  files: ComponentFile[]       // Associated files
  demoUrl?: string             // Optional live demo URL
  exportable: boolean          // Can be exported as package
}

export interface Dependency {
  name: string          // Package name (e.g., "next", "react")
  version: string       // Version requirement (e.g., "^18.3.1", ">=15.0.0")
  type: 'dependency' | 'devDependency' | 'peerDependency'
  optional?: boolean    // Whether dependency is optional
}

export interface Compatibility {
  nextjs: string[]      // Supported Next.js versions
  react: string[]       // Supported React versions
  typescript: boolean   // TypeScript support
  nodejs: string[]      // Supported Node.js versions
}

export interface ComponentFile {
  path: string          // File path relative to component root
  type: FileType        // File type classification
  description: string   // Purpose of this file
  size?: number         // File size in bytes
}

export type ComponentCategory = 
  | 'Authentication'    // Auth systems, login forms, session management
  | 'Forms'            // Input fields, form validation, form layouts
  | 'UI'               // Buttons, cards, modals, general UI components
  | 'Layout'           // Containers, grids, navigation, page layouts
  | 'Charts'           // Data visualization components
  | 'Utils'            // Utility functions and hooks
  | 'Hooks'            // React hooks
  | 'API'              // API endpoints and utilities

export type FileType =
  | 'component'         // React component (.tsx)
  | 'hook'             // React hook (.ts)
  | 'utility'          // Utility function (.ts)
  | 'api'              // API endpoint (.ts)
  | 'style'            // CSS/styling (.css, .module.css)
  | 'type'             // TypeScript definitions (.d.ts, types.ts)
  | 'config'           // Configuration files
  | 'test'             // Test files (prohibited in MVP factory)
  | 'documentation'    // README, examples, etc.

/**
 * Component Registry
 * 
 * This registry maintains metadata for all shareable components.
 * Components are registered here with their complete dependency information,
 * compatibility requirements, and file associations.
 * 
 * Why this approach:
 * - Centralized component discovery and management
 * - Automated dependency resolution for exports
 * - Version compatibility checking
 * - Search and filtering capabilities
 * - Systematic component organization
 */
export const COMPONENT_REGISTRY: ComponentMetadata[] = [
  {
    id: 'messmass-auth-system',
    name: 'MessMass Authentication System',
    description: 'Complete password-based authentication system with glass-morphism login form, secure session management, and TypeScript support.',
    category: 'Authentication',
    version: '1.0.0',
    lastUpdated: '2025-08-29T15:16:00.000Z',
    dependencies: [
      { name: 'next', version: '>=15.0.0', type: 'dependency' },
      { name: 'react', version: '^18.3.0', type: 'dependency' },
      { name: 'react-dom', version: '^18.3.0', type: 'dependency' },
      { name: 'typescript', version: '^5.0.0', type: 'devDependency' },
      { name: '@types/react', version: '^18.0.0', type: 'devDependency' },
      { name: '@types/node', version: '^20.0.0', type: 'devDependency' }
    ],
    tags: ['authentication', 'login', 'session', 'password', 'security', 'glassmorphism'],
    compatibility: {
      nextjs: ['15.x', '14.x'],
      react: ['18.x'],
      typescript: true,
      nodejs: ['18.x', '20.x', '22.x']
    },
    files: [
      {
        path: 'components/LoginForm.tsx',
        type: 'component',
        description: 'Main login form component with glass-card styling'
      },
      {
        path: 'auth/passwordAuth.ts',
        type: 'utility',
        description: 'Password validation and authentication utilities'
      },
      {
        path: 'auth/session.ts',
        type: 'utility',
        description: 'Session management with secure cookie handling'
      },
      {
        path: 'auth/AuthProvider.tsx',
        type: 'component',
        description: 'React context provider for authentication state'
      },
      {
        path: 'types/auth.ts',
        type: 'type',
        description: 'TypeScript interfaces for authentication system'
      },
      {
        path: 'api/login/route.ts',
        type: 'api',
        description: 'Next.js API route for login/logout operations'
      }
    ],
    demoUrl: '/shareables/auth',
    exportable: true
  }
  // Additional components will be added as they are extracted and documented
]

/**
 * Get component by ID
 * Returns component metadata for the specified component ID
 */
export function getComponent(id: string): ComponentMetadata | undefined {
  return COMPONENT_REGISTRY.find(component => component.id === id)
}

/**
 * Get components by category
 * Returns all components in the specified category
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentMetadata[] {
  return COMPONENT_REGISTRY.filter(component => component.category === category)
}

/**
 * Search components by tag
 * Returns components that have any of the specified tags
 */
export function searchComponentsByTag(tags: string[]): ComponentMetadata[] {
  return COMPONENT_REGISTRY.filter(component =>
    tags.some(tag => component.tags.includes(tag.toLowerCase()))
  )
}

/**
 * Get all available categories
 * Returns list of all categories that have registered components
 */
export function getAvailableCategories(): ComponentCategory[] {
  const categories = new Set(COMPONENT_REGISTRY.map(component => component.category))
  return Array.from(categories)
}

/**
 * Get total dependency list for component export
 * Resolves all dependencies required for a component package
 */
export function getComponentDependencies(componentId: string): Dependency[] {
  const component = getComponent(componentId)
  if (!component) return []
  
  // Return unique dependencies (in case there are duplicates)
  const dependencyMap = new Map<string, Dependency>()
  component.dependencies.forEach(dep => {
    dependencyMap.set(dep.name, dep)
  })
  
  return Array.from(dependencyMap.values())
}

/**
 * Check Next.js compatibility
 * Verifies if component is compatible with specified Next.js version
 */
export function isNextJSCompatible(componentId: string, nextVersion: string): boolean {
  const component = getComponent(componentId)
  if (!component) return false
  
  return component.compatibility.nextjs.some(version => {
    // Simple version matching (can be enhanced with semver library if needed)
    return nextVersion.startsWith(version.replace('.x', ''))
  })
}
