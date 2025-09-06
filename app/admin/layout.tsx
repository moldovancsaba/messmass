import React from 'react';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminStyle = await getAdminStyle();

  // Build CSS overrides for admin area if a style is set
  const css = adminStyle ? `
    .admin-container { background: linear-gradient(${adminStyle.backgroundGradient}); }
    .admin-header { background: linear-gradient(${adminStyle.headerBackgroundGradient}); }
  ` : '';

  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {children}
    </>
  );
}

