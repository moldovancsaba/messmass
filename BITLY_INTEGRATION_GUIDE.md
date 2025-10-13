# Bitly Integration User Guide

**Last Updated:** 2025-10-13T09:30:00.000Z  
**Version:** 5.51.1

## 🎯 What This Does

Connects your Bitly shortened links to your MessMass events to track:
- **Click statistics** (how many people clicked your links)
- **Geographic data** (which countries your clicks come from)
- **Traffic sources** (where people found your links - social media, email, etc.)
- **Campaign performance** (UTM tracking for marketing campaigns)

## 🚀 How to Use It

### Step 1: Access the Admin Panel

1. Go to your MessMass admin panel
2. Log in with your admin credentials
3. Navigate to **Admin → Bitly** in the menu

### Step 2: Add a Bitly Link

1. Click the **"+ Add Link"** button
2. Fill in the form:
   - **Bitly Link or URL** (required): 
     - You can paste either:
       - A Bitly short link: `bit.ly/abc123`
       - A full Bitly URL: `https://bit.ly/abc123`
       - The original long URL
   - **Assign to Project** (optional):
     - Select an event from the dropdown
     - Or leave it unassigned to add it later
   - **Custom Title** (optional):
     - Add a friendly name
     - If empty, uses Bitly's title
3. Click **"Add Link"**

### Step 3: Manage Links

**View All Links:**
- The table shows all your Bitly links
- See click counts, sync status, and assignments

**Reassign a Link:**
- Use the dropdown in the "Project" column
- Select a different event to move the link
- Or select "-- Unassigned --" to unassign it

**Remove a Link:**
- Click the 🗑️ (trash) icon
- Confirms before archiving
- Data is preserved but link becomes hidden

### Step 4: Refresh Analytics

**Automatic Sync:**
- Happens every night at 3:00 AM UTC
- No action needed - runs automatically

**Manual Sync:**
- Click the **"🔄 Sync Now"** button
- Updates all links immediately
- Takes about 1 minute

## 📊 View Analytics

Once links are synced, analytics will show:
- **Total Clicks**: In the "Clicks" column
- **Last Synced**: When data was last updated
- **Detailed Analytics**: *(Coming soon in project stats pages)*

## ❓ Common Questions

### Q: What happens when I add a link?
**A:** The system fetches the link's information from Bitly and stores it. The first sync happens automatically at night, or you can click "Sync Now" for immediate data.

### Q: Can I connect multiple Bitly links to one event?
**A:** Yes! One event can have many Bitly links associated with it.

### Q: Can I move a link between events?
**A:** Yes! Just use the dropdown in the "Project" column to reassign it.

### Q: What if I enter the wrong link?
**A:** You can archive it (🗑️ button) and add the correct one. Archived links don't sync but data is kept.

### Q: How often does data update?
**A:** Automatically every night at 3:00 AM UTC, or click "Sync Now" anytime for immediate refresh.

### Q: Do I need to do anything after adding a link?
**A:** No! After you add it, the system automatically:
- Syncs data every night
- Tracks all clicks
- Updates analytics
- Stores geographic and referrer information

## 🔧 Technical Details (For Developers)

### Environment Variables Required:
- `BITLY_ACCESS_TOKEN` - Your Bitly API token
- `BITLY_ORGANIZATION_GUID` - Your Bitly organization ID

### API Endpoints:
- `POST /api/bitly/links` - Add link
- `GET /api/bitly/links` - List links
- `PUT /api/bitly/links/[id]` - Update link
- `DELETE /api/bitly/links/[id]` - Archive link
- `GET /api/bitly/analytics/[id]` - Get analytics
- `POST /api/bitly/sync` - Trigger sync

### Database Collections:
- `bitly_links` - Link metadata and analytics
- `bitly_sync_logs` - Sync operation logs

### Cron Schedule:
- Runs daily at 3:00 AM UTC via Vercel Cron

## 🆘 Troubleshooting

**"Failed to fetch link from Bitly"**
- Check that the Bitly link exists and is accessible
- Verify your Bitly access token is correct in Vercel

**"Network error"**
- Check your internet connection
- Try refreshing the page

**Links not syncing**
- Check Vercel deployment logs
- Verify `BITLY_ACCESS_TOKEN` is set in Vercel environment variables
- Check `bitly_sync_logs` collection in MongoDB for error details

**Clicks showing as 0**
- Newly added links need time to sync
- Click "Sync Now" to force immediate update
- If still 0, the link may not have received any clicks yet

## 📞 Support

For technical issues or questions:
1. Check the MongoDB `bitly_sync_logs` collection for error details
2. Review Vercel function logs for the sync endpoint
3. Ensure environment variables are properly set

---

**Remember:** You only need to add links once. Everything else happens automatically!
