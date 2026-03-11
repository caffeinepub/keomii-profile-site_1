import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Ban, Pencil, Pin, Plus, Star, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AdminPost } from "../types";
import {
  getAdminPosts,
  getBannedUsers,
  getFeaturedPostIds,
  getFollowers,
  getGlobalPosts,
  getPinnedPostIds,
  saveAdminPosts,
  saveBannedUsers,
  saveFeaturedPostIds,
  saveGlobalPosts,
  savePinnedPostIds,
} from "../utils/storage";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminPage() {
  const [adminPosts, setAdminPosts] = useState(getAdminPosts);
  const [globalPosts, setGlobalPosts] = useState(getGlobalPosts);
  const [pinnedIds, setPinnedIds] = useState(getPinnedPostIds);
  const [featuredIds, setFeaturedIds] = useState(getFeaturedPostIds);
  const [bannedUsers, setBannedUsers] = useState(getBannedUsers);
  const [followers] = useState(getFollowers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [banInput, setBanInput] = useState("");

  const openNew = () => {
    setEditingPost(null);
    setForm({ title: "", content: "" });
    setModalOpen(true);
  };

  const openEdit = (post: AdminPost) => {
    setEditingPost(post);
    setForm({ title: post.title, content: post.content });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    let updated: AdminPost[];
    if (editingPost) {
      updated = adminPosts.map((p) =>
        p.id === editingPost.id
          ? { ...p, title: form.title, content: form.content }
          : p,
      );
    } else {
      const newPost: AdminPost = {
        id: `${Date.now()}`,
        title: form.title,
        content: form.content,
        createdAt: Date.now(),
      };
      updated = [newPost, ...adminPosts];
    }
    saveAdminPosts(updated);
    setAdminPosts(updated);
    setModalOpen(false);
    toast.success(editingPost ? "Post updated." : "Post created.");
  };

  const handleDeleteAdmin = (id: string) => {
    const updated = adminPosts.filter((p) => p.id !== id);
    saveAdminPosts(updated);
    setAdminPosts(updated);
    toast.success("Post deleted.");
  };

  const handleDeleteGlobal = (id: string) => {
    const updated = globalPosts.filter((p) => p.id !== id);
    saveGlobalPosts(updated);
    setGlobalPosts(updated);
    toast.success("Global post removed.");
  };

  const handleClearAll = () => {
    saveGlobalPosts([]);
    setGlobalPosts([]);
    toast.success("All global posts cleared.");
  };

  const togglePin = (id: string) => {
    const updated = pinnedIds.includes(id)
      ? pinnedIds.filter((p) => p !== id)
      : [...pinnedIds, id];
    savePinnedPostIds(updated);
    setPinnedIds(updated);
    toast.success(pinnedIds.includes(id) ? "Post unpinned." : "Post pinned.");
  };

  const toggleFeature = (id: string) => {
    const updated = featuredIds.includes(id)
      ? featuredIds.filter((f) => f !== id)
      : [...featuredIds, id];
    saveFeaturedPostIds(updated);
    setFeaturedIds(updated);
    toast.success(
      featuredIds.includes(id) ? "Post unfeatured." : "Post featured.",
    );
  };

  const handleBanUser = () => {
    const principal = banInput.trim();
    if (!principal) return;
    if (bannedUsers.includes(principal)) {
      toast.error("User is already banned.");
      return;
    }
    const updated = [...bannedUsers, principal];
    saveBannedUsers(updated);
    setBannedUsers(updated);
    setBanInput("");
    toast.success("User banned.");
  };

  const handleUnban = (principal: string) => {
    const updated = bannedUsers.filter((u) => u !== principal);
    saveBannedUsers(updated);
    setBannedUsers(updated);
    toast.success("User unbanned.");
  };

  const sortedAdmin = [...adminPosts].sort((a, b) => b.createdAt - a.createdAt);
  const sortedGlobal = [...globalPosts].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
    const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;
    return b.createdAt - a.createdAt;
  });

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Dashboard
        </p>
        <h1 className="font-display text-4xl font-light mb-2 text-foreground">
          Admin
        </h1>
        <div className="w-10 h-px bg-primary/50 mb-10" />

        <Tabs defaultValue="posts" data-ocid="admin.tab">
          <TabsList className="mb-8 bg-secondary">
            <TabsTrigger value="posts" data-ocid="admin.posts.tab">
              Posts
            </TabsTrigger>
            <TabsTrigger value="global" data-ocid="admin.global.tab">
              Global
            </TabsTrigger>
            <TabsTrigger value="users" data-ocid="admin.users.tab">
              Users
            </TabsTrigger>
            <TabsTrigger value="followers" data-ocid="admin.followers.tab">
              Followers
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Keomii's Posts */}
          <TabsContent value="posts">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-medium">
                Keomii&apos;s Posts
              </h2>
              <Button
                size="sm"
                onClick={openNew}
                data-ocid="admin.new_post.button"
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Post
              </Button>
            </div>

            {sortedAdmin.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="admin.post.empty_state"
              >
                No posts yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedAdmin.map((post, i) => (
                  <div
                    key={post.id}
                    data-ocid={`admin.post.item.${i + 1}`}
                    className="flex items-start justify-between gap-4 border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDate(post.createdAt)}
                      </p>
                      <p className="font-medium text-sm truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(post)}
                        data-ocid={`admin.post.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`admin.post.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="admin.post.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.post.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAdmin(post.id)}
                              data-ocid="admin.post.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Global Posts Moderation */}
          <TabsContent value="global">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-medium">
                Global Posts Moderation
              </h2>
              {sortedGlobal.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-ocid="admin.global.delete_button"
                      className="gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="admin.global.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Clear all global posts?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove all global posts. This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="admin.global.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAll}
                        data-ocid="admin.global.confirm_button"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {sortedGlobal.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="admin.global.empty_state"
              >
                No global posts to moderate.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedGlobal.map((post, i) => (
                  <div
                    key={post.id}
                    data-ocid={`admin.global.item.${i + 1}`}
                    className="flex items-start justify-between gap-4 border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-foreground">
                          {post.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          · {post.postType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(post.createdAt)}
                        </span>
                        {pinnedIds.includes(post.id) && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-4 px-1"
                          >
                            📌 Pinned
                          </Badge>
                        )}
                        {featuredIds.includes(post.id) && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-4 px-1"
                          >
                            ⭐ Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.caption}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          pinnedIds.includes(post.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => togglePin(post.id)}
                        title={pinnedIds.includes(post.id) ? "Unpin" : "Pin"}
                        data-ocid={`admin.global.toggle.${i + 1}`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          featuredIds.includes(post.id)
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => toggleFeature(post.id)}
                        title={
                          featuredIds.includes(post.id)
                            ? "Unfeature"
                            : "Feature"
                        }
                        data-ocid={`admin.global.toggle.${i + 1}`}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`admin.global.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="admin.global.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove this post?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the post from the
                              feed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.global.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGlobal(post.id)}
                              data-ocid="admin.global.confirm_button"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Ban Management */}
          <TabsContent value="users">
            <div className="mb-6">
              <h2 className="font-display text-xl font-medium mb-4">
                Ban Management
              </h2>
              <div className="flex gap-2">
                <Input
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  placeholder="Principal ID to ban..."
                  className="font-mono text-xs"
                  data-ocid="admin.users.input"
                  onKeyDown={(e) => e.key === "Enter" && handleBanUser()}
                />
                <Button
                  onClick={handleBanUser}
                  size="sm"
                  variant="destructive"
                  className="gap-1.5 shrink-0"
                  data-ocid="admin.users.primary_button"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Ban User
                </Button>
              </div>
            </div>

            {bannedUsers.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="admin.users.empty_state"
              >
                No banned users.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {bannedUsers.length} banned user
                  {bannedUsers.length !== 1 ? "s" : ""}
                </p>
                {bannedUsers.map((principal, i) => (
                  <div
                    key={principal}
                    data-ocid={`admin.users.item.${i + 1}`}
                    className="flex items-center justify-between gap-3 border border-border rounded-lg p-3 bg-card"
                  >
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {principal}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnban(principal)}
                      className="shrink-0 text-xs h-7"
                      data-ocid={`admin.users.secondary_button.${i + 1}`}
                    >
                      Unban
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Followers */}
          <TabsContent value="followers">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-xl font-medium">Followers</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {followers.length}
              </div>
            </div>

            {followers.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="admin.followers.empty_state"
              >
                No followers yet.
              </p>
            ) : (
              <div className="space-y-2">
                {followers.map((follower, i) => (
                  <div
                    key={follower.principal}
                    data-ocid={`admin.followers.item.${i + 1}`}
                    className="border border-border rounded-lg p-3 bg-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {follower.displayName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {follower.principal}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatDate(follower.followedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create/Edit Post Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="admin.post.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">
              {editingPost ? "Edit Post" : "New Post"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Post title"
                data-ocid="admin.post.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                placeholder="Write your post content here..."
                rows={6}
                className="resize-none"
                data-ocid="admin.post.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="admin.post.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="admin.post.save_button">
              {editingPost ? "Save changes" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
