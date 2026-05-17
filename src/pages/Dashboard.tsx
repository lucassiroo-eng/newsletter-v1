import { useState, useMemo, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Newspaper,
  Users,
  Clock,
  Globe,
  Lock,
  Loader2,
  Inbox,
  CalendarDays,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useMyNewsletters, type Newsletter } from "@/hooks/useNewsletters";
import { useMySubscriptions } from "@/hooks/useSubscriptions";
import { useLatestIssues, type Issue } from "@/hooks/useIssues";
import { CreateNewsletterDialog } from "@/components/newsletter/CreateNewsletterDialog";

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        active ? "bg-green-500" : "bg-gray-400"
      )}
    />
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      {frequency}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    generating:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        colors[status] || "bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
      )}
    >
      {status}
    </span>
  );
}

function NewsletterCard({
  newsletter,
  lastIssueDate,
  onClick,
}: {
  newsletter: Newsletter;
  lastIssueDate?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <StatusDot active={newsletter.is_active} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {newsletter.title}
          </h3>
        </div>
        {newsletter.is_public ? (
          <Globe className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <Lock className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
        {newsletter.topic}
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        <FrequencyBadge frequency={newsletter.frequency} />
        {newsletter.is_public && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {newsletter.subscriber_count}
          </span>
        )}
        {lastIssueDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(new Date(lastIssueDate), "MMM d")}
          </span>
        )}
      </div>
    </button>
  );
}

function SubscriptionCard({
  newsletter,
  onClick,
}: {
  newsletter: Newsletter;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
        {newsletter.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
        {newsletter.topic}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
        <FrequencyBadge frequency={newsletter.frequency} />
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" />
          {newsletter.subscriber_count}
        </span>
      </div>
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: myNewsletters, isLoading: loadingMine } = useMyNewsletters();
  const { data: subscriptions, isLoading: loadingSubs } = useMySubscriptions();

  const allNewsletterIds = useMemo(() => {
    const mine = (myNewsletters || []).map((n) => n.id);
    const subbed = (subscriptions || [])
      .map((s) => s.newsletter_id);
    return [...new Set([...mine, ...subbed])];
  }, [myNewsletters, subscriptions]);

  const { data: latestIssues, isLoading: loadingIssues } =
    useLatestIssues(allNewsletterIds);

  // Map newsletter id -> latest issue date
  const latestIssueDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const issue of latestIssues || []) {
      if (!map[issue.newsletter_id]) {
        map[issue.newsletter_id] = issue.date;
      }
    }
    return map;
  }, [latestIssues]);

  // Map newsletter id -> title (for latest issues display)
  const newsletterNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of myNewsletters || []) {
      map[n.id] = n.title;
    }
    for (const s of subscriptions || []) {
      if (s.newsletter) {
        map[s.newsletter_id] = s.newsletter.title;
      }
    }
    return map;
  }, [myNewsletters, subscriptions]);

  const isLoading = loadingMine || loadingSubs;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("dashboard.title", "Dashboard")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t(
                "dashboard.subtitle",
                "Manage your newsletters and subscriptions"
              )}
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.createNewsletter", "Create Newsletter")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Newsletters */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("dashboard.myNewsletters", "My Newsletters")}
                </h2>
                {myNewsletters && (
                  <span className="ml-1 text-sm text-gray-400">
                    ({myNewsletters.length})
                  </span>
                )}
              </div>
              {myNewsletters && myNewsletters.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myNewsletters.map((newsletter) => (
                    <NewsletterCard
                      key={newsletter.id}
                      newsletter={newsletter}
                      lastIssueDate={latestIssueDateMap[newsletter.id]}
                      onClick={() =>
                        navigate(`/newsletter/${newsletter.id}`)
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Newspaper}
                  title={t(
                    "dashboard.noNewsletters",
                    "No newsletters yet"
                  )}
                  description={t(
                    "dashboard.noNewslettersHint",
                    "Create your first newsletter to get started"
                  )}
                />
              )}
            </section>

            {/* Subscriptions */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("dashboard.subscribed", "Subscribed")}
                </h2>
                {subscriptions && (
                  <span className="ml-1 text-sm text-gray-400">
                    ({subscriptions.length})
                  </span>
                )}
              </div>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {subscriptions.map(
                    (sub) =>
                      sub.newsletter && (
                        <SubscriptionCard
                          key={sub.id}
                          newsletter={sub.newsletter}
                          onClick={() =>
                            navigate(`/newsletter/${sub.newsletter_id}`)
                          }
                        />
                      )
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  title={t(
                    "dashboard.noSubscriptions",
                    "No subscriptions yet"
                  )}
                  description={t(
                    "dashboard.noSubscriptionsHint",
                    "Explore public newsletters to find something interesting"
                  )}
                />
              )}
            </section>

            {/* Latest Issues */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("dashboard.latestIssues", "Latest Issues")}
                </h2>
              </div>
              {loadingIssues ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : latestIssues && latestIssues.length > 0 ? (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950">
                  {latestIssues.map((issue: Issue) => (
                    <button
                      key={issue.id}
                      onClick={() =>
                        navigate(
                          `/newsletter/${issue.newsletter_id}/issue/${issue.id}`
                        )
                      }
                      className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {newsletterNameMap[issue.newsletter_id] ||
                              "Newsletter"}
                          </span>
                          <StatusBadge status={issue.status} />
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {issue.email_subject}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {format(new Date(issue.date), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {issue.stories?.length || 0}{" "}
                          {t("dashboard.stories", "stories")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title={t("dashboard.noIssues", "No issues yet")}
                  description={t(
                    "dashboard.noIssuesHint",
                    "Issues will appear here once your newsletters generate content"
                  )}
                />
              )}
            </section>
          </div>
        )}

        <CreateNewsletterDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </AppShell>
  );
}
