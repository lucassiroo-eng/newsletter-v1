import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, ExternalLink, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { useIssue, type Story } from "@/hooks/useIssues";
import { useNewsletter } from "@/hooks/useNewsletters";

function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <div className="flex gap-3 py-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        {story.url ? (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1"
          >
            <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {story.title}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" />
          </a>
        ) : (
          <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {story.title}
          </span>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          {story.source && <span>{story.source}</span>}
          {story.category && (
            <>
              <span>&middot;</span>
              <span className="text-indigo-500 dark:text-indigo-400 font-medium">{story.category}</span>
            </>
          )}
        </div>
        {(story.whyItMatters || story.why_it_matters) && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-snug">
            {story.whyItMatters || story.why_it_matters}
          </p>
        )}
      </div>
    </div>
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
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AppShell>
    );
  }

  if (!issue) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-8">
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
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <button
          onClick={() => navigate(`/newsletter/${id}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {newsletter?.title || t("common.back", "Back")}
        </button>

        <header className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {issue.email_subject}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(issue.date), "MMM d, yyyy")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {stories.length} stories
            </span>
          </div>
        </header>

        {stories.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stories.map((story, i) => (
              <StoryCard key={i} story={story} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-12">
            {t("issue.noStories", "No stories in this issue")}
          </p>
        )}
      </div>
    </AppShell>
  );
}
