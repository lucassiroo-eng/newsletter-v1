import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Users,
  Loader2,
  Globe,
  Bell,
  BellOff,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { usePublicNewsletters, type Newsletter } from "@/hooks/useNewsletters";
import {
  useMySubscriptions,
  useSubscribe,
  useUnsubscribe,
} from "@/hooks/useSubscriptions";
import { useAuth } from "@/hooks/useAuth";

function FrequencyBadge({ frequency }: { frequency: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      {frequency}
    </span>
  );
}

function ExploreCard({
  newsletter,
  isSubscribed,
  onSubscribeToggle,
  isPending,
  onClick,
}: {
  newsletter: Newsletter & { owner_display_name?: string };
  isSubscribed: boolean;
  onSubscribeToggle: () => void;
  isPending: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700">
      <button onClick={onClick} className="flex-1 p-5 text-left">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {newsletter.title}
          </h3>
          <Globe className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {newsletter.topic}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <FrequencyBadge frequency={newsletter.frequency} />
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {newsletter.subscriber_count}{" "}
            {t("explore.subscribers", "subscribers")}
          </span>
        </div>
      </button>
      <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSubscribeToggle();
          }}
          disabled={isPending}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isSubscribed
              ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              : "bg-blue-600 text-white hover:bg-blue-700",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {isSubscribed
            ? t("explore.unsubscribe", "Unsubscribe")
            : t("explore.subscribe", "Subscribe")}
        </button>
      </div>
    </div>
  );
}

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState("");

  const { data: newsletters, isLoading } = usePublicNewsletters();
  const { data: subscriptions } = useMySubscriptions();
  const subscribe = useSubscribe();
  const unsubscribe = useUnsubscribe();

  const subscribedIds = useMemo(() => {
    const set = new Set<string>();
    for (const sub of subscriptions || []) {
      set.add(sub.newsletter_id);
    }
    return set;
  }, [subscriptions]);

  const filtered = useMemo(() => {
    if (!newsletters) return [];
    if (!search.trim()) return newsletters;

    const q = search.toLowerCase();
    return newsletters.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q)
    );
  }, [newsletters, search]);

  const handleToggle = (newsletterId: string, currentlySubscribed: boolean) => {
    if (!user) return;
    if (currentlySubscribed) {
      unsubscribe.mutate(newsletterId);
    } else {
      subscribe.mutate(newsletterId);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("explore.title", "Explore")}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t(
              "explore.subtitle",
              "Discover and subscribe to public newsletters"
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              "explore.searchPlaceholder",
              "Search newsletters by title or topic..."
            )}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((newsletter) => {
              const isSub = subscribedIds.has(newsletter.id);
              return (
                <ExploreCard
                  key={newsletter.id}
                  newsletter={newsletter}
                  isSubscribed={isSub}
                  isPending={
                    (subscribe.isPending &&
                      subscribe.variables === newsletter.id) ||
                    (unsubscribe.isPending &&
                      unsubscribe.variables === newsletter.id)
                  }
                  onSubscribeToggle={() => handleToggle(newsletter.id, isSub)}
                  onClick={() => navigate(`/newsletter/${newsletter.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Compass className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {search.trim()
                ? t("explore.noResults", "No newsletters match your search")
                : t("explore.empty", "No public newsletters yet")}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
