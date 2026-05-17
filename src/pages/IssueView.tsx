import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, ExternalLink, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useIssue, type Story } from "@/hooks/useIssues";
import { useNewsletter } from "@/hooks/useNewsletters";
import { getCategoryColor } from "@/lib/categories";

function CategoryBadge({ category }: { category: string }) {
  const colors = getCategoryColor(category);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.darkBg,
        colors.darkText
      )}
    >
      {category}
    </span>
  );
}

function StoryCard({ story, index }: { story: Story; index: number }) {
  const { t } = useTranslation();

  return (
    <article className="group relative flex gap-5 py-6">
      {/* Rank */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        {/* Category + source */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <CategoryBadge category={story.category} />
          {story.source && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {story.source}
            </span>
          )}
          {story.date && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {story.date}
            </span>
          )}
        </div>

        {/* Title */}
        {story.url ? (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1.5 group/link"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors leading-snug">
              {story.title}
            </h3>
            <ExternalLink className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        ) : (
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {story.title}
          </h3>
        )}

        {/* Summary */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {story.summary}
        </p>

        {/* Why it matters */}
        {story.why_it_matters && (
          <div className="mt-3 rounded-lg border-l-2 border-blue-400 bg-blue-50/50 py-2 pl-3 pr-3 dark:border-blue-500 dark:bg-blue-950/30">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">
              {t("issue.whyItMatters", "Why it matters")}
            </p>
            <p className="text-sm text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
              {story.why_it_matters}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function IssueView() {
  const { t } = useTranslation();
  const { id, issueId } = useParams<{ id: string; issueId: string }>();
  const navigate = useNavigate();

  const { data: issue, isLoading: loadingIssue } = useIssue(issueId);
  const { data: newsletter } = useNewsletter(id);

  if (loadingIssue) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (!issue) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            {t("issue.notFound", "Issue not found")}
          </p>
        </div>
      </AppShell>
    );
  }

  const stories: Story[] = issue.stories || [];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(`/newsletter/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {newsletter
            ? newsletter.title
            : t("common.back", "Back")}
        </button>

        {/* Issue header */}
        <header className="mb-10">
          {newsletter && (
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              {newsletter.title}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {issue.email_subject}
          </h1>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(issue.date), "MMMM d, yyyy")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-4 w-4" />
              {stories.length} {t("issue.stories", "stories")}
            </span>
          </div>
        </header>

        {/* Stories */}
        {stories.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stories.map((story, i) => (
              <StoryCard key={i} story={story} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("issue.noStories", "No stories in this issue")}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
