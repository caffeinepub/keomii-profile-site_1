import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { Nav } from "./components/Nav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AdminPage } from "./pages/AdminPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { PostsPage } from "./pages/PostsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RulesPage } from "./pages/RulesPage";
import { getUserId } from "./utils/userId";

function ProfileRedirect() {
  const { identity, isInitializing, login, isLoggingIn } =
    useInternetIdentity();
  const navigate = useNavigate();
  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();
  const principal = isAuthenticated
    ? identity.getPrincipal().toText()
    : undefined;

  useEffect(() => {
    if (!isInitializing && isAuthenticated && principal) {
      navigate({
        to: "/profile/$userId",
        params: { userId: getUserId(principal) },
      });
    }
  }, [isInitializing, isAuthenticated, principal, navigate]);

  if (isInitializing) return null;

  if (!isAuthenticated) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-muted-foreground mb-4">
          Sign in to view your profile.
        </p>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="gap-1.5"
          data-ocid="profile.primary_button"
        >
          <LogIn className="w-3.5 h-3.5" />
          {isLoggingIn ? "Signing in..." : "Sign in"}
        </Button>
      </main>
    );
  }

  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </div>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const profileRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfileRedirect,
});

const profileUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: ProfilePage,
});

const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts",
  component: PostsPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: RulesPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  profileRedirectRoute,
  profileUserRoute,
  postsRoute,
  contactRoute,
  adminRoute,
  rulesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
