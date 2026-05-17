import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Newsletter {
  id: string;
  owner_id: string;
  title: string;
  topic: string;
  frequency: string;
  is_active: boolean;
  is_public: boolean;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

export type CreateNewsletterInput = Pick<
  Newsletter,
  "title" | "topic" | "frequency" | "is_public"
>;

export type UpdateNewsletterInput = Partial<
  Pick<Newsletter, "title" | "topic" | "frequency" | "is_active" | "is_public">
> & { id: string };

const NEWSLETTERS_KEY = "newsletters";
const MY_NEWSLETTERS_KEY = [NEWSLETTERS_KEY, "mine"];
const PUBLIC_NEWSLETTERS_KEY = [NEWSLETTERS_KEY, "public"];

export function useMyNewsletters() {
  const { user } = useAuth();

  return useQuery({
    queryKey: MY_NEWSLETTERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("owner_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Newsletter[];
    },
    enabled: !!user,
  });
}

export function usePublicNewsletters() {
  return useQuery({
    queryKey: PUBLIC_NEWSLETTERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("is_public", true)
        .order("subscriber_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Newsletter[];
    },
  });
}

export function useNewsletter(id: string | undefined) {
  return useQuery({
    queryKey: [NEWSLETTERS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as Newsletter;
    },
    enabled: !!id,
  });
}

export function useCreateNewsletter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateNewsletterInput) => {
      const { data, error } = await supabase
        .from("newsletters")
        .insert({ ...input, owner_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as Newsletter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_NEWSLETTERS_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_NEWSLETTERS_KEY });
    },
  });
}

export function useUpdateNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateNewsletterInput) => {
      const { data, error } = await supabase
        .from("newsletters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Newsletter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MY_NEWSLETTERS_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_NEWSLETTERS_KEY });
      queryClient.invalidateQueries({
        queryKey: [NEWSLETTERS_KEY, data.id],
      });
    },
  });
}

export function useDeleteNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletters")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_NEWSLETTERS_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_NEWSLETTERS_KEY });
    },
  });
}
