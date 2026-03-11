import type {
  AdminPost,
  ContactMessage,
  Follower,
  GlobalPost,
  ProfileData,
  Rule,
} from "../types";

const ADMIN_POSTS_KEY = "keomii_admin_posts";
const GLOBAL_POSTS_KEY = "keomii_global_posts";
const FOLLOWERS_KEY = "keomii_followers";
const BANNED_KEY = "keomii_banned";
const PINNED_KEY = "keomii_pinned";
const FEATURED_KEY = "keomii_featured";
const CONTACT_MESSAGES_KEY = "keomii_contact_messages";
const RULES_KEY = "keomii_rules";

function profileKey(userId: string) {
  return `keomii_profile_${userId}`;
}

export function getAdminPosts(): AdminPost[] {
  try {
    const raw = localStorage.getItem(ADMIN_POSTS_KEY);
    return raw ? JSON.parse(raw) : getDefaultAdminPosts();
  } catch {
    return getDefaultAdminPosts();
  }
}

export function saveAdminPosts(posts: AdminPost[]): void {
  localStorage.setItem(ADMIN_POSTS_KEY, JSON.stringify(posts));
}

export function getGlobalPosts(): GlobalPost[] {
  try {
    const raw = localStorage.getItem(GLOBAL_POSTS_KEY);
    return raw ? JSON.parse(raw) : getDefaultGlobalPosts();
  } catch {
    return getDefaultGlobalPosts();
  }
}

export function saveGlobalPosts(posts: GlobalPost[]): void {
  localStorage.setItem(GLOBAL_POSTS_KEY, JSON.stringify(posts));
}

export function getProfileData(userId?: string): ProfileData {
  const key = userId ? profileKey(userId) : "keomii_profile";
  try {
    const raw = localStorage.getItem(key);
    return raw
      ? JSON.parse(raw)
      : {
          profileImage: "",
          coverImage: "",
          thumbnails: [],
          bio: "",
          displayName: "",
        };
  } catch {
    return {
      profileImage: "",
      coverImage: "",
      thumbnails: [],
      bio: "",
      displayName: "",
    };
  }
}

export function saveProfileData(data: ProfileData, userId?: string): void {
  const key = userId ? profileKey(userId) : "keomii_profile";
  localStorage.setItem(key, JSON.stringify(data));
}

export function getFollowers(): Follower[] {
  try {
    const raw = localStorage.getItem(FOLLOWERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFollowers(followers: Follower[]): void {
  localStorage.setItem(FOLLOWERS_KEY, JSON.stringify(followers));
}

export function getBannedUsers(): string[] {
  try {
    const raw = localStorage.getItem(BANNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBannedUsers(users: string[]): void {
  localStorage.setItem(BANNED_KEY, JSON.stringify(users));
}

export function getPinnedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePinnedPostIds(ids: string[]): void {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

export function getFeaturedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(FEATURED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFeaturedPostIds(ids: string[]): void {
  localStorage.setItem(FEATURED_KEY, JSON.stringify(ids));
}

export function getIsFollowing(principal: string): boolean {
  return localStorage.getItem(`keomii_following_${principal}`) === "true";
}

export function setIsFollowing(principal: string, following: boolean): void {
  if (following) {
    localStorage.setItem(`keomii_following_${principal}`, "true");
  } else {
    localStorage.removeItem(`keomii_following_${principal}`);
  }
}

export function getContactMessages(): ContactMessage[] {
  try {
    const raw = localStorage.getItem(CONTACT_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveContactMessages(messages: ContactMessage[]): void {
  localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(messages));
}

export function addContactMessage(
  msg: Omit<ContactMessage, "id" | "sentAt" | "read">,
): void {
  const messages = getContactMessages();
  const newMsg: ContactMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sentAt: Date.now(),
    read: false,
  };
  saveContactMessages([newMsg, ...messages]);
}

export function getRules(): Rule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRules(rules: Rule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function getDefaultAdminPosts(): AdminPost[] {
  const defaults: AdminPost[] = [
    {
      id: "1",
      title: "New Tracks Dropping Soon",
      content:
        "Been in the studio for weeks crafting something that feels completely new. The blend of ambient textures and raw vocals has me excited — this might be my best work yet. Stay tuned.",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "2",
      title: "Art as a Language",
      content:
        "There's something powerful about creating without an audience in mind. Pure expression, no filters, no second-guessing. That's where my best work comes from — the moments when I forget anyone is watching.",
      createdAt: Date.now() - 86400000 * 7,
    },
    {
      id: "3",
      title: "Playlist: Mood Board Vol. 3",
      content:
        "Curated a new playlist for late nights and early mornings. Think: soft synths, rain sounds, melancholic R&B. The kind of music that makes you feel things you can't name.",
      createdAt: Date.now() - 86400000 * 14,
    },
  ];
  saveAdminPosts(defaults);
  return defaults;
}

function getDefaultGlobalPosts(): GlobalPost[] {
  const defaults: GlobalPost[] = [
    {
      id: "g1",
      authorPrincipal: "demo-user-1",
      authorName: "Soleil",
      postType: "image",
      caption: "Morning light and music",
      imageDataUrl: undefined,
      createdAt: Date.now() - 86400000 * 1,
    },
    {
      id: "g2",
      authorPrincipal: "demo-user-2",
      authorName: "Marek",
      postType: "playlist",
      caption: "My late night studying playlist — hypnotic and minimal",
      playlistUrl: "https://open.spotify.com/",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "g3",
      authorPrincipal: "demo-user-3",
      authorName: "Nova",
      postType: "ad",
      caption: "Check out my new EP 'Dusk Signals' — out everywhere now!",
      createdAt: Date.now() - 86400000 * 4,
    },
  ];
  saveGlobalPosts(defaults);
  return defaults;
}
