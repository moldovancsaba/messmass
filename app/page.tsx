import { getAdminUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Main page now serves as authentication redirect handler
 * 
 * This page acts as the entry point for the MessMass application:
 * - If user is authenticated → redirects to admin dashboard (/admin)
 * - If user is not authenticated → redirects to login page (/admin/login)
 * 
 * The old statistics dashboard has been moved to the admin section.
 * All authentication and project management is now centralized in the admin area.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Check if user is authenticated using server-side authentication
  const user = await getAdminUser();
  
  if (user) {
    // WHAT: Smart redirect based on user role
    // WHY: Prevent redirect loops to /admin/help for users without dashboard access
    // HOW: Send users to first accessible page (partners for user/admin, help for guest)
    
    if (user.role === 'guest') {
      // Guests can only access help page
      redirect('/admin/help');
    } else if (user.role === 'user' || user.role === 'admin') {
      // Users and admins can access partners page
      redirect('/admin/partners');
    } else if (user.role === 'superadmin') {
      // Superadmins get full dashboard
      redirect('/admin');
    } else {
      // Fallback for unknown roles
      redirect('/admin/help');
    }
  } else {
    // User is not authenticated, redirect to login page
    redirect('/admin/login');
  }
  
  // This should never render due to redirects above
  // But included as a fallback for edge cases
  return null;
}
