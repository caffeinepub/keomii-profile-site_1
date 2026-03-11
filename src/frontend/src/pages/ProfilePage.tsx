import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import { Pencil, User, UserCheck, UserPlus, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { ProfileData } from "../types";
import {
  getFollowers,
  getIsFollowing,
  getProfileData,
  saveFollowers,
  saveProfileData,
  setIsFollowing,
} from "../utils/storage";
import { getUserId, isAdminPrincipal } from "../utils/userId";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Public/read-only profile for another user
function PublicUserProfile({
  userId,
  profileData,
}: { userId: string; profileData: ProfileData }) {
  return (
    <main className="max-w-3xl mx-auto pb-16">
      <div className="relative">
        <div className="h-48 sm:h-64 w-full overflow-hidden">
          {profileData.coverImage ? (
            <img
              src={profileData.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-background" />
          )}
        </div>
        <div className="absolute bottom-0 left-6 translate-y-1/2 z-20">
          <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary shadow-lg flex items-center justify-center">
            {profileData.profileImage ? (
              <img
                src={profileData.profileImage}
                alt={userId}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
      <div className="px-6 mt-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-2xl font-light text-foreground mb-1">
            {profileData.displayName || userId}
          </h1>
          <p className="text-xs font-mono text-muted-foreground mb-3">
            ID: {userId}
          </p>
          {profileData.bio ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {profileData.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This user hasn't added a bio yet.
            </p>
          )}
        </motion.div>
        {profileData.thumbnails.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Gallery
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profileData.thumbnails.map((src, i) => (
                <div
                  key={src.slice(0, 40)}
                  data-ocid={`profile.item.${i + 1}`}
                  className="aspect-square rounded-lg overflow-hidden bg-secondary"
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}

export function ProfilePage() {
  const { userId } = useParams({ strict: false }) as { userId?: string };
  const isKeojiProfile = userId === "Keoji";

  const { identity } = useInternetIdentity();
  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated
    ? identity.getPrincipal().toText()
    : undefined;
  const isAdmin = principal ? isAdminPrincipal(principal) : false;
  const myUserId = principal ? getUserId(principal) : undefined;
  const isOwnProfile = !!myUserId && myUserId === userId;

  const [profile, setProfile] = useState<ProfileData>(() =>
    getProfileData(userId),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(profile);
  const [following, setFollowingState] = useState(() =>
    principal ? getIsFollowing(principal) : false,
  );
  const BASE_FOLLOWER_COUNT = 1500;
  const [followerCount, setFollowerCount] = useState(
    () => getFollowers().length,
  );

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Non-Keoji, not own profile -> show public view
  if (!isKeojiProfile && !isOwnProfile && userId) {
    return (
      <PublicUserProfile userId={userId} profileData={getProfileData(userId)} />
    );
  }

  if (!userId) {
    return (
      <PublicUserProfile
        userId="unknown"
        profileData={{
          profileImage: "",
          coverImage: "",
          thumbnails: [],
          bio: "",
        }}
      />
    );
  }

  const openEdit = () => {
    setEditForm({ ...profile });
    setEditOpen(true);
  };

  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setEditForm((p) => ({ ...p, profileImage: url }));
  };

  const handleCoverImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setEditForm((p) => ({ ...p, coverImage: url }));
  };

  const handleThumbnailsChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 6 - editForm.thumbnails.length;
    const toProcess = files.slice(0, remaining);
    const urls = await Promise.all(toProcess.map(readFileAsDataUrl));
    setEditForm((p) => ({
      ...p,
      thumbnails: [...p.thumbnails, ...urls].slice(0, 6),
    }));
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  };

  const removeThumbnail = (idx: number) => {
    setEditForm((p) => ({
      ...p,
      thumbnails: p.thumbnails.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = () => {
    saveProfileData(editForm, userId);
    setProfile(editForm);
    setEditOpen(false);
    toast.success("Profile saved!");
  };

  const handleFollow = () => {
    if (!principal) return;
    const followers = getFollowers();
    const newFollower = {
      principal,
      displayName: getUserId(principal),
      followedAt: Date.now(),
    };
    const updated = [
      ...followers.filter((f) => f.principal !== principal),
      newFollower,
    ];
    saveFollowers(updated);
    setIsFollowing(principal, true);
    setFollowingState(true);
    setFollowerCount(updated.length);
    toast.success("Following Keoji!");
  };

  const handleUnfollow = () => {
    if (!principal) return;
    const followers = getFollowers().filter((f) => f.principal !== principal);
    saveFollowers(followers);
    setIsFollowing(principal, false);
    setFollowingState(false);
    setFollowerCount(followers.length);
    toast.success("Unfollowed.");
  };

  const displayName = isKeojiProfile ? "Keoji" : profile.displayName || userId;

  return (
    <main className="max-w-3xl mx-auto pb-16">
      {/* Wrapper: cover + overlapping avatar/followers */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-48 sm:h-64 w-full overflow-hidden">
          {profile.coverImage ? (
            <img
              src={profile.coverImage}
              alt="Profile cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-background" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute bottom-0 left-6 translate-y-1/2 z-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary shadow-lg"
          >
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-display font-light text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        </div>

        {/* Followers + follow button */}
        {isKeojiProfile && (
          <div className="absolute bottom-0 right-6 translate-y-1/2 z-20 pb-2">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {(BASE_FOLLOWER_COUNT + followerCount).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">followers</p>
              </div>
              {isAuthenticated && !isAdmin && (
                <Button
                  variant={following ? "outline" : "default"}
                  size="sm"
                  onClick={following ? handleUnfollow : handleFollow}
                  className="gap-1.5"
                  data-ocid="profile.primary_button"
                >
                  {following ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Edit button — shown for own profile OR admin on Keoji profile */}
        {(isOwnProfile || (isAdmin && isKeojiProfile)) && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 shadow-md"
              onClick={openEdit}
              data-ocid="profile.edit_button"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Name, bio, gallery */}
      <div className="px-6 mt-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h1 className="font-display text-3xl font-light text-foreground mb-1">
            {displayName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {profile.bio ||
              (isKeojiProfile
                ? "Creative. Music. Art. Vibes. Making things that feel honest and alive."
                : "No bio yet.")}
          </p>
        </motion.div>

        {profile.thumbnails.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Gallery
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.thumbnails.map((src, i) => (
                <div
                  key={src.slice(0, 40)}
                  data-ocid={`profile.item.${i + 1}`}
                  className="aspect-square rounded-lg overflow-hidden bg-secondary"
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="profile.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Display name */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Display Name
              </Label>
              <Input
                value={editForm.displayName || ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="Your display name"
                data-ocid="profile.input"
              />
            </div>

            {/* Profile image */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Profile Image
              </Label>
              {editForm.profileImage && (
                <img
                  src={editForm.profileImage}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border border-border"
                />
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:bg-secondary cursor-pointer"
                data-ocid="profile.upload_button"
              />
            </div>

            {/* Cover image */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Cover Image
              </Label>
              {editForm.coverImage && (
                <img
                  src={editForm.coverImage}
                  alt="Cover preview"
                  className="w-full h-24 rounded-md object-cover border border-border"
                />
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:bg-secondary cursor-pointer"
                data-ocid="profile.upload_button"
              />
            </div>

            {/* Thumbnails */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Gallery Thumbnails
                <span className="ml-1 text-xs">
                  ({editForm.thumbnails.length}/6)
                </span>
              </Label>
              {editForm.thumbnails.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {editForm.thumbnails.map((src, i) => (
                    <div
                      key={src.slice(0, 40)}
                      className="relative group aspect-square"
                    >
                      <img
                        src={src}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeThumbnail(i)}
                        data-ocid={`profile.delete_button.${i + 1}`}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 border border-border text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {editForm.thumbnails.length < 6 && (
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleThumbnailsChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:bg-secondary cursor-pointer"
                  data-ocid="profile.upload_button"
                />
              )}
              {editForm.thumbnails.length >= 6 && (
                <Badge variant="secondary" className="text-xs">
                  Maximum 6 thumbnails reached
                </Badge>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Bio</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Write something about yourself..."
                rows={4}
                className="resize-none"
                data-ocid="profile.textarea"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="profile.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="profile.save_button">
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
