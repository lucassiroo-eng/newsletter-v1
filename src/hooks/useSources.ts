import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Source {
  id: string;
  newsletter_id: string;
  name: string;
  url: string;
  source_type: string;
  is_active: boolean;
}

export type AddSourceInput = Pick<Source, "newsletter_id" | "name" | "url" | "source_type">;

const SOURCES_KEY = "sources";

export function useSources(newsletterId: string | undefined) {
  return useQuery({
    queryKey: [SOURCES_KEY, newsletterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("newsletter_id", newsletterId!)
        .order("name");

      if (error) throw error;
      return data as Source[];
    },
    enabled: !!newsletterId,
  });
}

export function useAddSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSourceInput) => {
      const { data, error } = await supabase
        .from("sources")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Source;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [SOURCES_KEY, data.newsletter_id],
      });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newsletterId,
    }: {
      id: string;
      newsletterId: string;
    }) => {
      const { error } = await supabase.from("sources").delete().eq("id", id);

      if (error) throw error;
      return { newsletterId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [SOURCES_KEY, data.newsletterId],
      });
    },
  });
}
