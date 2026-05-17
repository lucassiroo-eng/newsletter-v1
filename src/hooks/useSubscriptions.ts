import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Newsletter } from "@/hooks/useNewsletters";

export interface Subscription {
  id: string;
  user_id: string;
  newsletter_id: string;
  receive_email: boolean;
  newsletter?: Newsletter;
}

const SUBSCRIPTIONS_KEY = "subscriptions";
const MY_SUBSCRIPTIONS_KEY = [SUBSCRIPTIONS_KEY, "mine"];

export function useMySubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MY_SUBSCRIPTIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, newsletter:newsletters(*)")
        .eq("user_id", user!.id);

      if (error) throw error;

      return (data as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        user_id: row.user_id as string,
        newsletter_id: row.newsletter_id as string,
        receive_email: row.receive_email as boolean,
        newsletter: row.newsletter as Newsletter,
      })) as Subscription[];
    },
    enabled: !!user,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newsletterId: string) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({ user_id: user!.id, newsletter_id: newsletterId })
        .select()
        .single();

      if (error) throw error;

      // Subscriber count is updated automatically by the database trigger

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
    },
  });
}

export function useUnsubscribe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newsletterId: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("user_id", user!.id)
        .eq("newsletter_id", newsletterId);

      if (error) throw error;

      // Subscriber count is updated automatically by the database trigger
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SUBSCRIPTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
    },
  });
}
