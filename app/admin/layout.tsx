import React from 'react';
import { ObjectId } from 'mongodb';
import AdminLayout from '@/components/AdminLayout';
import { getAdminUser } from '@/lib/auth';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

type SettingsDoc = { _id: string; styleId: string | null; updatedAt?: string };

async function getAdminStyle() {
  try {
    const db = await (await import('@/lib/db')).getDb();
    const settings = db.collection<SettingsDoc>('settings');
    const pageStyles = db.collection('pageStyles');

    const adminSetting = await settings.findOne({ _id: 'adminStyle' });
    if (adminSetting?.styleId) {
      const style = await pageStyles.findOne({ _id: new ObjectId(adminSetting.styleId) });
      if (style) {
        return {
          backgroundGradient: (style as any).backgroundGradient as string,
          headerBackgroundGradient: (style as any).headerBackgroundGradient as string,
          contentBackgroundColor: (style as any).contentBackgroundColor as string,
          titleBubbleBg: (style as any).titleBubble?.backgroundColor as string,
          titleBubbleText: (style as any).titleBubble?.textColor as string,
        };
      }
    }
  } catch (e) {
    console.log('Admin layout style load failed, falling back to default');
  }
  return null;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  /* What: Fetch admin user for TopHeader display
     Why: Show current user name, email, and role in header */
  const user = await getAdminUser();
  
  /* What: Fetch admin style for page background customization
     Why: Maintain existing design manager functionality */
  const adminStyle = await getAdminStyle();

  /* What: Build CSS overrides for admin area if a style is set
     Why: Allow design manager to customize admin appearance */
  const css = adminStyle ? `
    :root {
      --page-bg: linear-gradient(${adminStyle.backgroundGradient});
      --header-bg: linear-gradient(${adminStyle.headerBackgroundGradient});
      ${adminStyle.contentBackgroundColor ? `--content-bg: ${adminStyle.contentBackgroundColor};` : ''}
    }
    /* Strong guarantee header uses theme even if other classes set background */
    .admin-header { background: var(--header-bg) !important; }
  ` : '';

  /* What: Render new AdminLayout with sidebar, header, and content
     Why: Consistent TailAdmin V2 layout across all admin pages */
  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <AdminLayout user={user ? {
        name: user.name,
        email: user.email,
        role: user.role,
      } : undefined}>
        {children}
      </AdminLayout>
    </>
  );
}

