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
import {
  Ban,
  BookOpen,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Mail,
  Pencil,
  Pin,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ADMIN_PASSWORD } from "../constants";
import type { AdminPost, ContactMessage, Rule } from "../types";
import {
  getAdminPosts,
  getBannedUsers,
  getContactMessages,
  getFeaturedPostIds,
  getFollowers,
  getGlobalPosts,
  getPinnedPostIds,
  getRules,
  saveAdminPosts,
  saveBannedUsers,
  saveContactMessages,
  saveFeaturedPostIds,
  saveGlobalPosts,
  savePinnedPostIds,
  saveRules,
} from "../utils/storage";

const BASE_FOLLOWER_COUNT = 1500;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFollowerCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return count.toLocaleString();
}

// ─── Password gate ───────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setPw("");
    }
  };

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-6">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
          Admin Area
        </p>
        <h1 className="font-display text-3xl font-light mb-8">
          Enter Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              data-ocid="admin.password.input"
              className={error ? "border-destructive" : ""}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {error && (
            <p
              className="text-xs text-destructive"
              data-ocid="admin.password.error_state"
            >
              Incorrect password. Try again.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            data-ocid="admin.password.submit_button"
          >
            Unlock Dashboard
          </Button>
        </form>
      </motion.div>
    </main>
  );
}

// ─── Main admin dashboard ─────────────────────────────────────────────────────
export function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [adminPosts, setAdminPosts] = useState(getAdminPosts);
  const [globalPosts, setGlobalPosts] = useState(getGlobalPosts);
  const [pinnedIds, setPinnedIds] = useState(getPinnedPostIds);
  const [featuredIds, setFeaturedIds] = useState(getFeaturedPostIds);
  const [bannedUsers, setBannedUsers] = useState(getBannedUsers);
  const [followers] = useState(getFollowers);
  const [messages, setMessages] = useState(getContactMessages);
  const [rules, setRules] = useState(getRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [banInput, setBanInput] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );

  // Rules modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    title: "",
    description: "",
    imageDataUrl: "",
  });

  const unreadCount = messages.filter((m) => !m.read).length;
  const totalFollowers = BASE_FOLLOWER_COUNT + followers.length;

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

  const markRead = (id: string) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, read: true } : m,
    );
    saveContactMessages(updated);
    setMessages(updated);
  };

  const deleteMessage = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    saveContactMessages(updated);
    setMessages(updated);
    if (selectedMessage?.id === id) setSelectedMessage(null);
    toast.success("Message deleted.");
  };

  const openMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) markRead(msg.id);
  };

  // Rules handlers
  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({ title: "", description: "", imageDataUrl: "" });
    setRuleModalOpen(true);
  };

  const openEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setRuleForm({
      title: rule.title,
      description: rule.description,
      imageDataUrl: rule.imageDataUrl ?? "",
    });
    setRuleModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleForm.title.trim() && !ruleForm.imageDataUrl) {
      toast.error("Please provide a title or an image.");
      return;
    }
    let updated: Rule[];
    if (editingRule) {
      updated = rules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              title: ruleForm.title,
              description: ruleForm.description,
              imageDataUrl: ruleForm.imageDataUrl || undefined,
            }
          : r,
      );
    } else {
      const newRule: Rule = {
        id: `${Date.now()}`,
        title: ruleForm.title,
        description: ruleForm.description,
        imageDataUrl: ruleForm.imageDataUrl || undefined,
        createdAt: Date.now(),
      };
      updated = [...rules, newRule];
    }
    saveRules(updated);
    setRules(updated);
    setRuleModalOpen(false);
    toast.success(editingRule ? "Rule updated." : "Rule added.");
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    saveRules(updated);
    setRules(updated);
    toast.success("Rule deleted.");
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
          <TabsList className="mb-8 bg-secondary flex-wrap h-auto gap-1">
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
            <TabsTrigger value="rules" data-ocid="admin.rules.tab">
              Rules
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              data-ocid="admin.messages.tab"
              className="relative"
            >
              Messages
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Keoji's Posts */}
          <TabsContent value="posts">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-medium">
                Keoji&apos;s Posts
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
                            Pinned
                          </Badge>
                        )}
                        {featuredIds.includes(post.id) && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-4 px-1"
                          >
                            Featured
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="border border-border rounded-xl bg-card p-5 mb-6"
              data-ocid="admin.followers.card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">
                    Total Followers
                  </p>
                  <p className="font-display text-4xl font-light text-foreground leading-none">
                    {formatFollowerCount(totalFollowers)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Includes imported followers
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <TrendingUp className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">
                      {formatFollowerCount(BASE_FOLLOWER_COUNT)}
                    </span>{" "}
                    base
                  </span>
                </div>
                <span className="text-muted-foreground/40 text-xs">+</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">
                      {followers.length}
                    </span>{" "}
                    new
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-base font-medium text-foreground">
                New Followers
              </h2>
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
                No new followers yet.
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

          {/* Tab 5: Rules */}
          <TabsContent value="rules">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-display text-xl font-medium">Rules</h2>
              </div>
              <Button
                size="sm"
                onClick={openNewRule}
                data-ocid="admin.rules.primary_button"
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rule
              </Button>
            </div>

            {rules.length === 0 ? (
              <div
                className="text-center py-12 border border-dashed border-border rounded-lg"
                data-ocid="admin.rules.empty_state"
              >
                <BookOpen className="w-6 h-6 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No rules yet. Add your first community rule.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, i) => (
                  <motion.div
                    key={rule.id}
                    data-ocid={`admin.rules.item.${i + 1}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="flex items-start justify-between gap-4 border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {rule.imageDataUrl && (
                          <img
                            src={rule.imageDataUrl}
                            alt="Rule"
                            className="w-12 h-12 rounded object-cover mb-1"
                          />
                        )}
                        {rule.title && (
                          <p className="font-medium text-sm text-foreground">
                            {rule.title}
                          </p>
                        )}
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditRule(rule)}
                        data-ocid={`admin.rules.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`admin.rules.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="admin.rules.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this rule.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="admin.rules.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRule(rule.id)}
                              data-ocid="admin.rules.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 6: Messages */}
          <TabsContent value="messages">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-xl font-medium">Messages</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                {messages.length}
              </div>
            </div>

            {messages.length === 0 ? (
              <p
                className="text-muted-foreground text-sm"
                data-ocid="admin.messages.empty_state"
              >
                No messages yet.
              </p>
            ) : (
              <div
                className="grid gap-4 sm:grid-cols-2"
                data-ocid="admin.messages.list"
              >
                <div className="space-y-2">
                  {messages.map((msg, i) => (
                    <button
                      key={msg.id}
                      type="button"
                      data-ocid={`admin.messages.item.${i + 1}`}
                      onClick={() => openMessage(msg)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-accent ${
                        selectedMessage?.id === msg.id
                          ? "border-primary bg-accent"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {!msg.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            <p
                              className={`text-sm truncate ${!msg.read ? "font-semibold" : "font-normal"}`}
                            >
                              {msg.name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {msg.email}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {msg.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(msg.sentAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border border-border rounded-lg bg-card p-4 min-h-[160px]">
                  {selectedMessage ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {selectedMessage.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedMessage.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(selectedMessage.sentAt)}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                              data-ocid="admin.messages.delete_button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="admin.messages.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete message?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="admin.messages.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMessage(selectedMessage.id)
                                }
                                data-ocid="admin.messages.confirm_button"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="w-full h-px bg-border" />
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        Select a message to read
                      </p>
                    </div>
                  )}
                </div>
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

      {/* Create/Edit Rule Modal */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="max-w-md" data-ocid="admin.rules.modal">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">
              {editingRule ? "Edit Rule" : "Add Rule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Title{" "}
                <span className="text-muted-foreground/60">
                  (optional if image provided)
                </span>
              </Label>
              <Input
                value={ruleForm.title}
                onChange={(e) =>
                  setRuleForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Be respectful"
                data-ocid="admin.rules.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) =>
                  setRuleForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe this rule in more detail..."
                rows={3}
                className="resize-none"
                data-ocid="admin.rules.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Image{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              {ruleForm.imageDataUrl ? (
                <div className="space-y-2">
                  <img
                    src={ruleForm.imageDataUrl}
                    alt="Rule preview"
                    className="w-full rounded-lg object-cover max-h-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRuleForm((p) => ({ ...p, imageDataUrl: "" }))
                    }
                    data-ocid="admin.rules.delete_button"
                    className="text-destructive hover:text-destructive"
                  >
                    Remove image
                  </Button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center gap-2 border border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  data-ocid="admin.rules.upload_button"
                >
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        setRuleForm((p) => ({
                          ...p,
                          imageDataUrl: reader.result as string,
                        }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRuleModalOpen(false)}
              data-ocid="admin.rules.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRule}
              data-ocid="admin.rules.save_button"
            >
              {editingRule ? "Save changes" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
