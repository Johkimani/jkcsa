# TODO - Add Popup Notifications for No Archived Officials

## Task
On the archived officials modal, if there are no archived officials, the download and delete buttons should show a popup to notify users they can't perform that action since there are no archived (past) officials.

## Changes Required

### 1. Modify `handleDownloadTerm()` function
- Location: `frontend/src/pages/Admin.tsx`
- Current: Shows toast "No data to download" when `historyOfficials.length === 0`
- Change: Show a more descriptive popup message like "No archived officials to download. You cannot download because there are no past officials."

### 2. Modify `handleDeleteTerm()` function  
- Location: `frontend/src/pages/Admin.tsx`
- Current: Needs check for when no archived officials exist
- Change: Add popup notification when trying to delete but there are no archived officials

### 3. Check individual delete function (`handleDeleteArchivedOfficial`)
- Already handles the case properly with existing toast notifications

## Status
- [ ] Modify `handleDownloadTerm()` to show descriptive popup
- [ ] Modify `handleDeleteTerm()` to show descriptive popup when no archived officials
- [ ] Test the changes
