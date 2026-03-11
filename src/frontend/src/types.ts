export interface AdminPost {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface GlobalPost {
  id: string;
  authorPrincipal: string;
  authorName: string;
  postType: "image" | "playlist" | "ad";
  caption: string;
  imageDataUrl?: string;
  playlistUrl?: string;
  createdAt: number;
}

export interface ProfileData {
  profileImage: string;
  coverImage: string;
  thumbnails: string[];
  bio: string;
}

export interface Follower {
  principal: string;
  displayName: string;
  followedAt: number;
}
