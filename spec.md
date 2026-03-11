# Keomii Profile Site

## Current State
- Public site with Home, Posts, Contact, and Admin (/admin) pages.
- Admin page lets Keomii create/edit/delete own posts and delete global posts.
- Global Posts: logged-in users post images, playlists, or ads. Bad word filter on feed.
- Authentication via Internet Identity. Admin principal hardcoded as constant.
- All data stored in localStorage.

## Requested Changes (Diff)

### Add
- **Extended Admin Panel** on /admin:
  - Pin/unpin global posts (pinned posts shown at top of feed)
  - Ban a user by principal (banned users cannot create new posts)
  - Unban a user
  - View list of banned users with unban button
  - Clear all global posts (with confirm dialog)
  - Feature/highlight a global post (adds a visual badge)
- **Profile Page** (/profile):
  - Public view: displays Keomii's profile image, cover image, bio text, and a thumbnails gallery
  - Admin-only edit mode: upload/change profile image, cover image, and up to 6 thumbnails
  - Followers section (admin-only): shows a list of users who have "followed" Keomii
- **Follow button** on the public site (e.g., on Home page): logged-in users can follow/unfollow Keomii. Stored in localStorage.
- Nav link to /profile added.

### Modify
- AdminPage: add new moderation controls (pin, ban, clear all, feature post)
- PostsPage: respect pinned posts order, show featured badge, block banned users from posting
- Nav: add Profile link

### Remove
- Nothing removed.

## Implementation Plan
1. Add types: Follower, BannedUser, ProfileData to types.ts
2. Add storage helpers for profile data, followers, banned users, pinned/featured posts
3. Update AdminPage with new moderation controls tabs
4. Create ProfilePage (/profile) with cover/avatar/thumbnails display and admin edit mode
5. Add Follow/Unfollow button on HomePage for logged-in users
6. Update PostsPage to check ban, show pinned/featured posts
7. Update Nav with Profile link and App.tsx with new route
