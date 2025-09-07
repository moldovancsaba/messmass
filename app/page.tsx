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
    // User is authenticated, redirect to admin dashboard
    redirect('/admin');
  } else {
    // User is not authenticated, redirect to login page
    redirect('/admin/login');
  }
  
  // This should never render due to redirects above
  // But included as a fallback for edge cases
  return null;
}
