import V3Entity from '@/lib/models/v3/Entity';

/**
 * validateNoCircularHierarchy
 * 
 * Ensures that an entity cannot be assigned a parent that is already 
 * a descendant of itself, preventing infinite loops in the hierarchy.
 * 
 * @param entityId The ID of the entity being updated or created
 * @param newParentId The target parent ID
 * @returns boolean True if the assignment is safe, False if a circularity is detected.
 */
export async function validateNoCircularHierarchy(entityId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) return true;
  if (entityId === newParentId) return false;

  let currentId = newParentId;
  
  // Maximum depth safety to prevent infinite loops if data is already corrupt
  const MAX_DEPTH = 50;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    if (currentId.toString() === entityId.toString()) {
      return false; // Circularity detected
    }

    const parent = await V3Entity.findById(currentId).select('parentEntityId').lean();
    if (!parent) break;
    
    currentId = parent.parentEntityId;
    depth++;
  }

  return true;
}
