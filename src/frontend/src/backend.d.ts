import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Review {
    id: string;
    song: string;
    user: Principal;
    comment: string;
    timestamp: bigint;
    rating: bigint;
}
export interface ListeningHistory {
    song: string;
    user: Principal;
    timestamp: bigint;
}
export interface Song {
    id: string;
    title: string;
    album: string;
    lyrics: string;
    file?: ExternalBlob;
    genres: Array<Genre>;
    artist: string;
    coverArt?: ExternalBlob;
}
export interface Playlist {
    id: string;
    title: string;
    owner: Principal;
    sharedWith: Array<Principal>;
    songIds: Array<string>;
}
export interface ChatMessage {
    id: string;
    content: string;
    sender: Principal;
    timestamp: bigint;
}
export interface UserProfile {
    id: string;
    bio: string;
    name: string;
    favoriteGenres: Array<Genre>;
}
export interface SharedFile {
    id: string;
    file: ExternalBlob;
    sender: Principal;
    message: string;
    timestamp: bigint;
    receiver?: Principal;
}
export enum Genre {
    pop = "pop",
    rnb = "rnb",
    reggae = "reggae",
    metal = "metal",
    country = "country",
    folk = "folk",
    jazz = "jazz",
    punk = "punk",
    rock = "rock",
    soul = "soul",
    hipHop = "hipHop",
    latin = "latin",
    blues = "blues",
    electronic = "electronic",
    dance = "dance",
    classical = "classical"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addChatMessage(message: ChatMessage): Promise<void>;
    addListeningHistory(history: ListeningHistory): Promise<void>;
    addReview(review: Review): Promise<void>;
    addSong(song: Song): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlaylist(playlist: Playlist): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(): Promise<Array<ChatMessage>>;
    getListeningHistory(user: Principal): Promise<Array<ListeningHistory>>;
    getPlaylist(id: string): Promise<Playlist | null>;
    getPlaylistsContainingSong(songId: string): Promise<Array<Playlist>>;
    getReviews(): Promise<Array<Review>>;
    getSharedFiles(): Promise<Array<SharedFile>>;
    getSong(id: string): Promise<Song | null>;
    getSongsByGenre(genre: Genre): Promise<Array<Song>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    shareFile(sharedFile: SharedFile): Promise<void>;
}
