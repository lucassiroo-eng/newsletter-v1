import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Story {
  rank: number;
  title: string;
  url: string;
  summary: string;
  why_it_matters?: string;
  whyItMatters?: string;
  category: string;
  source: string;
  date?: string;
  publishedAt?: string;
}

export interface Issue {
  id: string;
  newsletter_id: string;
  date: string;
  stories: Story[];
  html_content: string | null;
  email_subject: string;
  status: string;
  created_at: string;
}

const ISSUES_KEY = "issues";

export function useIssues(newsletterId: string | undefined) {
  return useQuery({
    queryKey: [ISSUES_KEY, "list", newsletterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("newsletter_id", newsletterId!)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Issue[];
    },
    enabled: !!newsletterId,
  });
}

export function useIssue(issueId: string | undefined) {
  return useQuery({
    queryKey: [ISSUES_KEY, "detail", issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("id", issueId!)
        .single();

      if (error) throw error;
      return data as Issue;
    },
    enabled: !!issueId,
  });
}

export function useLatestIssues(newsletterIds: string[]) {
  return useQuery({
    queryKey: [ISSUES_KEY, "latest", newsletterIds],
    queryFn: async () => {
      if (newsletterIds.length === 0) return [];

      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .in("newsletter_id", newsletterIds)
        .order("date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Issue[];
    },
    enabled: newsletterIds.length > 0,
  });
}
