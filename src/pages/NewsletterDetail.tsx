import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as Select from "@radix-ui/react-select";
import {
  ArrowLeft,
  Globe,
  Lock,
  Rss,
  Plus,
  Trash2,
  FileText,
  Loader2,
  ChevronDown,
  Check,
  ExternalLink,
  Bell,
  BellOff,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useNewsletter, useUpdateNewsletter } from "@/hooks/useNewsletters";
import { useSources, useAddSource, useDeleteSource, type AddSourceInput } from "@/hooks/useSources";
import { useIssues, type Issue } from "@/hooks/useIssues";
import { useQueryClient } from "@tanstack/react-query";
import { useMySubscriptions, useSubscribe, useUnsubscribe } from "@/hooks/useSubscriptions";
import { useAuth } from "@/hooks/useAuth";

const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;
const SOURCE_TYPES = ["blog", "news", "rss", "podcast", "other"] as const;

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    draft: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    generating: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
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

function SourceTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
      {type}
    </span>
  );
}

export default function NewsletterDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: newsletter, isLoading } = useNewsletter(id);
  const updateNewsletter = useUpdateNewsletter();
  const { data: sources } = useSources(id);
  const addSource = useAddSource();
  const deleteSource = useDeleteSource();
  const { data: issues } = useIssues(id);
  const { data: subscriptions } = useMySubscriptions();
  const subscribe = useSubscribe();
  const unsubscribe = useUnsubscribe();

  // Add source form
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceType, setNewSourceType] = useState<string>("blog");

  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isOwner = newsletter && user && newsletter.owner_id === user.id;
  const isAdmin = user?.email === "lucassiroo@gmail.com";
  const isSubscribed = subscriptions?.some(
    (s) => s.newsletter_id === id
  );

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { error } = await supabase.rpc("request_generation", {
        p_newsletter_id: id,
      });
      if (error) throw error;
      toast.success(
        t("newsletter.generateQueued", "Generation triggered — will be ready in a few minutes")
      );
      // Poll for the new issue every 15s for up to 5 minutes
      let elapsed = 0;
      pollRef.current = setInterval(() => {
        elapsed += 15;
        queryClient.invalidateQueries({ queryKey: ["issues"] });
        if (elapsed >= 300) {
          clearInterval(pollRef.current);
          setGenerating(false);
        }
      }, 15_000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
      setGenerating(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !id) return;

    const input: AddSourceInput = {
      newsletter_id: id,
      name: newSourceName.trim(),
      url: newSourceUrl.trim() || null,
      source_type: newSourceType,
    };

    await addSource.mutateAsync(input);
    setNewSourceName("");
    setNewSourceUrl("");
    setNewSourceType("blog");
  };

  const handleToggleActive = () => {
    if (!newsletter) return;
    updateNewsletter.mutate({
      id: newsletter.id,
      is_active: !newsletter.is_active,
    });
  };

  const handleTogglePublic = () => {
    if (!newsletter) return;
    updateNewsletter.mutate({
      id: newsletter.id,
      is_public: !newsletter.is_public,
    });
  };

  const handleFrequencyChange = (value: string) => {
    if (!newsletter) return;
    updateNewsletter.mutate({ id: newsletter.id, frequency: value });
  };

  const handleSubscribeToggle = () => {
    if (!id) return;
    if (isSubscribed) {
      unsubscribe.mutate(id);
    } else {
      subscribe.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (!newsletter) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            {t("newsletter.notFound", "Newsletter not found")}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back", "Back")}
        </button>

        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {newsletter.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {newsletter.topic}
              </p>
            </div>
            {isAdmin && isOwner && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {t("newsletter.generateNow", "Generate Now")}
              </button>
            )}
            {!isOwner && user && (
              <button
                onClick={handleSubscribeToggle}
                disabled={subscribe.isPending || unsubscribe.isPending}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isSubscribed
                    ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isSubscribed ? (
                  <>
                    <BellOff className="h-4 w-4" />
                    {t("newsletter.unsubscribe", "Unsubscribe")}
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    {t("newsletter.subscribe", "Subscribe")}
                  </>
                )}
              </button>
            )}
          </div>

          {isOwner && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              {/* Frequency */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("newsletter.frequency", "Frequency")}
                </span>
                <Select.Root
                  value={newsletter.frequency}
                  onValueChange={handleFrequencyChange}
                >
                  <Select.Trigger className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="h-3 w-3" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <Select.Viewport className="p-1">
                        {FREQUENCIES.map((freq) => (
                          <Select.Item
                            key={freq}
                            value={freq}
                            className="relative flex cursor-pointer select-none items-center rounded-md px-8 py-1.5 text-xs text-gray-900 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 dark:data-[highlighted]:bg-gray-800"
                          >
                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                              <Check className="h-3 w-3" />
                            </Select.ItemIndicator>
                            <Select.ItemText>
                              {t(`newsletter.freq.${freq}`, freq.charAt(0).toUpperCase() + freq.slice(1))}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("newsletter.active", "Active")}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newsletter.is_active}
                  onClick={handleToggleActive}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    newsletter.is_active
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      newsletter.is_active ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {newsletter.is_public
                    ? t("newsletter.public", "Public")
                    : t("newsletter.private", "Private")}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newsletter.is_public}
                  onClick={handleTogglePublic}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    newsletter.is_public
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      newsletter.is_public ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                {newsletter.is_public ? (
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Rss className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("newsletter.sources", "Sources")}
            </h2>
            {sources && (
              <span className="text-sm text-gray-400">({sources.length})</span>
            )}
          </div>

          {/* Source list */}
          {sources && sources.length > 0 ? (
            <div className="space-y-2 mb-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SourceTypeBadge type={source.source_type} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {source.name}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-600 inline-flex items-center gap-0.5 shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("common.link", "link")}
                    </a>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() =>
                        deleteSource.mutate({
                          id: source.id,
                          newsletterId: source.newsletter_id,
                        })
                      }
                      className="ml-2 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              {t("newsletter.noSources", "No sources added yet")}
            </p>
          )}

          {/* Add source form */}
          {isOwner && (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("newsletter.addSourceHint", "Add a content source — URL is optional")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder={t("newsletter.sourceName", "e.g. TechCrunch, Hacker News")}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder={t("newsletter.sourceUrl", "https://... (optional)")}
                  className="flex-[2] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <Select.Root value={newSourceType} onValueChange={setNewSourceType}>
                  <Select.Trigger className="inline-flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 min-w-[100px] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <Select.Viewport className="p-1">
                        {SOURCE_TYPES.map((st) => (
                          <Select.Item
                            key={st}
                            value={st}
                            className="relative flex cursor-pointer select-none items-center rounded-md px-8 py-1.5 text-sm text-gray-900 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 dark:data-[highlighted]:bg-gray-800"
                          >
                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                              <Check className="h-3 w-3" />
                            </Select.ItemIndicator>
                            <Select.ItemText>
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                <button
                  onClick={handleAddSource}
                  disabled={
                    !newSourceName.trim() ||
                    addSource.isPending
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addSource.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("common.add", "Add")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Issues */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("newsletter.issues", "Issues")}
            </h2>
            {issues && (
              <span className="text-sm text-gray-400">({issues.length})</span>
            )}
          </div>

          {issues && issues.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {issues.map((issue: Issue) => (
                <button
                  key={issue.id}
                  onClick={() =>
                    navigate(`/newsletter/${id}/issue/${issue.id}`)
                  }
                  className="flex w-full items-center gap-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg px-3 -mx-3 transition-colors"
                >
                  <CalendarDays className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {issue.email_subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {format(new Date(issue.date), "MMM d, yyyy")}
                      </span>
                      <StatusBadge status={issue.status} />
                      <span className="text-xs text-gray-400">
                        {issue.stories?.length || 0} {t("newsletter.stories", "stories")}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t("newsletter.noIssues", "No issues generated yet")}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
