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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FilteredText } from "../components/FilteredText";
import { ADMIN_PRINCIPAL } from "../constants";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { GlobalPost } from "../types";
import {
  getAdminPosts,
  getBannedUsers,
  getFeaturedPostIds,
  getGlobalPosts,
  getPinnedPostIds,
  saveGlobalPosts,
} from "../utils/storage";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PostTypeBadge({ type }: { type: GlobalPost["postType"] }) {
  const variants: Record<GlobalPost["postType"], string> = {
    image: "bg-blue-100 text-blue-700",
    playlist: "bg-green-100 text-green-700",
    ad: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${variants[type]}`}
    >
      {type}
    </span>
  );
}

interface GlobalPostFormData {
  postType: GlobalPost["postType"];
  authorName: string;
  caption: string;
  imageDataUrl: string;
  playlistUrl: string;
}

export function PostsPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated
    ? identity.getPrincipal().toText()
    : undefined;
  const isAdmin = principal === ADMIN_PRINCIPAL;

  const [adminPosts] = useState(getAdminPosts);
  const [globalPosts, setGlobalPosts] = useState(getGlobalPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GlobalPost | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinnedIds = getPinnedPostIds();
  const featuredIds = getFeaturedPostIds();

  const emptyForm: GlobalPostFormData = {
    postType: "image",
    authorName: "",
    caption: "",
    imageDataUrl: "",
    playlistUrl: "",
  };
  const [form, setForm] = useState<GlobalPostFormData>(emptyForm);

  const openNew = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (post: GlobalPost) => {
    setEditingPost(post);
    setForm({
      postType: post.postType,
      authorName: post.authorName,
      caption: post.caption,
      imageDataUrl: post.imageDataUrl ?? "",
      playlistUrl: post.playlistUrl ?? "",
    });
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, imageDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Ban check
    if (principal) {
      const banned = getBannedUsers();
      if (banned.includes(principal)) {
        toast.error("You have been banned from posting.");
        return;
      }
    }

    if (!form.authorName.trim() || !form.caption.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    let updated: GlobalPost[];
    if (editingPost) {
      updated = globalPosts.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              postType: form.postType,
              authorName: form.authorName,
              caption: form.caption,
              imageDataUrl:
                form.postType === "image"
                  ? form.imageDataUrl || undefined
                  : undefined,
              playlistUrl:
                form.postType === "playlist"
                  ? form.playlistUrl || undefined
                  : undefined,
            }
          : p,
      );
    } else {
      const newPost: GlobalPost = {
        id: `g${Date.now()}`,
        authorPrincipal: principal ?? "anonymous",
        authorName: form.authorName,
        postType: form.postType,
        caption: form.caption,
        imageDataUrl:
          form.postType === "image"
            ? form.imageDataUrl || undefined
            : undefined,
        playlistUrl:
          form.postType === "playlist"
            ? form.playlistUrl || undefined
            : undefined,
        createdAt: Date.now(),
      };
      updated = [newPost, ...globalPosts];
    }
    saveGlobalPosts(updated);
    setGlobalPosts(updated);
    setModalOpen(false);
    toast.success(editingPost ? "Post updated!" : "Post published!");
  };

  const handleDelete = (id: string) => {
    const updated = globalPosts.filter((p) => p.id !== id);
    saveGlobalPosts(updated);
    setGlobalPosts(updated);
    toast.success("Post deleted.");
  };

  const sortedAdminPosts = [...adminPosts].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  const sortedGlobalPosts = [...globalPosts].sort((a, b) => {
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
          Community
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-light mb-2 text-foreground">
          Posts
        </h1>
        <div className="w-10 h-px bg-primary/50 mb-10" />

        <Tabs defaultValue="keoji">
          <TabsList className="mb-8 bg-secondary">
            <TabsTrigger
              value="keoji"
              data-ocid="posts.keoji_tab.tab"
              className="font-body"
            >
              Keoji&apos;s Posts
            </TabsTrigger>
            <TabsTrigger
              value="global"
              data-ocid="posts.global_tab.tab"
              className="font-body"
            >
              Global Posts
            </TabsTrigger>
          </TabsList>

          {/* Keoji's Posts */}
          <TabsContent value="keoji">
            {sortedAdminPosts.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="posts.empty_state"
              >
                No posts yet.
              </p>
            ) : (
              <div className="space-y-6">
                {sortedAdminPosts.map((post, i) => (
                  <article
                    key={post.id}
                    data-ocid={`posts.item.${i + 1}`}
                    className="border border-border rounded-lg p-6 bg-card shadow-card"
                  >
                    <p className="text-xs text-muted-foreground mb-3">
                      {formatDate(post.createdAt)}
                    </p>
                    <h2 className="font-display text-xl font-medium mb-3 text-foreground">
                      {post.title}
                    </h2>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      <FilteredText text={post.content} />
                    </p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Global Posts */}
          <TabsContent value="global">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {sortedGlobalPosts.length} post
                {sortedGlobalPosts.length !== 1 ? "s" : ""}
              </p>
              {isAuthenticated && (
                <Button
                  size="sm"
                  onClick={openNew}
                  data-ocid="posts.new_post.button"
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Post
                </Button>
              )}
            </div>

            {sortedGlobalPosts.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="posts.empty_state"
              >
                No posts yet. Sign in to be the first!
              </p>
            ) : (
              <div className="space-y-5">
                {sortedGlobalPosts.map((post, i) => {
                  const canEdit = isAdmin || post.authorPrincipal === principal;
                  const isPinned = pinnedIds.includes(post.id);
                  const isFeatured = featuredIds.includes(post.id);
                  return (
                    <article
                      key={post.id}
                      data-ocid={`posts.item.${i + 1}`}
                      className="border border-border rounded-lg p-5 bg-card shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {post.authorName}
                          </span>
                          <PostTypeBadge type={post.postType} />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </span>
                          {isPinned && (
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 px-1.5"
                            >
                              📌 Pinned
                            </Badge>
                          )}
                          {isFeatured && (
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 px-1.5"
                            >
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(post)}
                              data-ocid={`posts.item.edit_button.${i + 1}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(post.id)}
                              data-ocid={`posts.item.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                        <FilteredText text={post.caption} />
                      </p>

                      {post.postType === "image" && post.imageDataUrl && (
                        <img
                          src={post.imageDataUrl}
                          alt="User upload"
                          className="rounded-md max-h-64 object-cover w-full mt-2"
                        />
                      )}

                      {post.postType === "playlist" && post.playlistUrl && (
                        <a
                          href={post.playlistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open playlist
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* New/Edit Post Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="posts.dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">
              {editingPost ? "Edit Post" : "New Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Post type</Label>
              <Select
                value={form.postType}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    postType: v as GlobalPost["postType"],
                  }))
                }
              >
                <SelectTrigger data-ocid="posts.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="playlist">Playlist</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Your name</Label>
              <Input
                value={form.authorName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, authorName: e.target.value }))
                }
                placeholder="Display name"
                data-ocid="posts.input"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Caption</Label>
              <Textarea
                value={form.caption}
                onChange={(e) =>
                  setForm((p) => ({ ...p, caption: e.target.value }))
                }
                placeholder="What's on your mind?"
                rows={3}
                className="resize-none"
                data-ocid="posts.textarea"
              />
            </div>

            {form.postType === "image" && (
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Photo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-sm file:bg-secondary cursor-pointer"
                  data-ocid="posts.upload_button"
                />
                {form.imageDataUrl && (
                  <img
                    src={form.imageDataUrl}
                    alt="Upload preview"
                    className="mt-2 rounded-md max-h-40 object-cover w-full"
                  />
                )}
              </div>
            )}

            {form.postType === "playlist" && (
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Playlist URL
                </Label>
                <Input
                  value={form.playlistUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, playlistUrl: e.target.value }))
                  }
                  placeholder="https://open.spotify.com/playlist/..."
                  data-ocid="posts.input"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="posts.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="posts.submit_button">
              {editingPost ? "Save changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
