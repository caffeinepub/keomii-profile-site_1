import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useLocation } from "@tanstack/react-router";
import { Check, Copy, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Nav() {
  const location = useLocation();
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated
    ? identity.getPrincipal().toText()
    : undefined;
  const truncatedPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : undefined;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (principal) {
      navigator.clipboard.writeText(principal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { to: "/", label: "Home", ocid: "nav.home.link" },
    { to: "/profile", label: "Profile", ocid: "nav.profile.link" },
    { to: "/posts", label: "Posts", ocid: "nav.posts.link" },
    { to: "/contact", label: "Contact", ocid: "nav.contact.link" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={link.ocid}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated && truncatedPrincipal && principal && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCopy}
                    data-ocid="nav.copy_principal.button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors"
                  >
                    {truncatedPrincipal}
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs break-all max-w-xs">
                    {principal}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {copied ? "Copied!" : "Click to copy full principal"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              data-ocid="nav.logout.button"
              className="gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              data-ocid="nav.login.button"
              className="gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
