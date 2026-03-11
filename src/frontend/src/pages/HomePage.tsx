import { Button } from "@/components/ui/button";
import { Music2, UserCheck, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiPinterest, SiSpotify } from "react-icons/si";
import { toast } from "sonner";
import { ADMIN_PRINCIPAL } from "../constants";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  getFollowers,
  getIsFollowing,
  saveFollowers,
  setIsFollowing,
} from "../utils/storage";

const SOCIAL_LINKS = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/user/31jbpf4bquwunj2z3mkz5i7iion4?si=43774a90859d443b",
    icon: SiSpotify,
    ocid: "home.spotify.link",
    color: "text-green-600",
  },
  {
    label: "Suno",
    href: "https://suno.com/@keomii",
    icon: Music2,
    ocid: "home.suno.link",
    color: "text-primary",
  },
  {
    label: "Pinterest",
    href: "https://ph.pinterest.com/Keoji_sparkle/",
    icon: SiPinterest,
    ocid: "home.pinterest.link",
    color: "text-red-500",
  },
];

export function HomePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated
    ? identity.getPrincipal().toText()
    : undefined;
  const isAdmin = principal === ADMIN_PRINCIPAL;

  const [following, setFollowingState] = useState(() =>
    principal ? getIsFollowing(principal) : false,
  );

  const handleFollow = () => {
    if (!principal) return;
    const followers = getFollowers();
    const updated = [
      ...followers.filter((f) => f.principal !== principal),
      { principal, displayName: "Anonymous", followedAt: Date.now() },
    ];
    saveFollowers(updated);
    setIsFollowing(principal, true);
    setFollowingState(true);
    toast.success("Following Keomii!");
  };

  const handleUnfollow = () => {
    if (!principal) return;
    const followers = getFollowers().filter((f) => f.principal !== principal);
    saveFollowers(followers);
    setIsFollowing(principal, false);
    setFollowingState(false);
    toast.success("Unfollowed.");
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
          Artist · Creator
        </p>

        <h1 className="font-display text-7xl sm:text-8xl font-light leading-none tracking-tight text-foreground mb-8">
          Keomii
        </h1>

        <div className="w-12 h-px bg-primary/50 mb-10" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md mb-10 font-body"
        >
          Creative. Music. Art. Vibes. Making things that feel honest and alive
          — from sound to image to everything in between.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-4 flex-wrap mb-6"
        >
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={link.ocid}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded border border-border bg-card hover:bg-secondary transition-colors ${link.color}`}
            >
              <link.icon className="w-4 h-4" />
              <span className="text-foreground">{link.label}</span>
            </a>
          ))}
        </motion.div>

        {isAuthenticated && !isAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.4 }}
          >
            <Button
              variant={following ? "outline" : "default"}
              size="sm"
              onClick={following ? handleUnfollow : handleFollow}
              className="gap-1.5"
              data-ocid="home.primary_button"
            >
              {following ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow Keomii
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-20 pt-8 border-t border-border"
      >
        <p className="text-xs text-muted-foreground">
          Available for collaborations & commissions.
        </p>
      </motion.div>
    </main>
  );
}
