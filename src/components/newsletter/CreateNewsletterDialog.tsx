import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { X, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateNewsletter } from "@/hooks/useNewsletters";

interface CreateNewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"] as const;

export function CreateNewsletterDialog({
  open,
  onOpenChange,
}: CreateNewsletterDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createNewsletter = useCreateNewsletter();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [frequency, setFrequency] = useState<string>("weekly");
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = async () => {
    if (!title.trim() || !topic.trim()) return;

    const newsletter = await createNewsletter.mutateAsync({
      title: title.trim(),
      topic: topic.trim(),
      frequency,
      is_public: isPublic,
    });

    onOpenChange(false);
    setTitle("");
    setTopic("");
    setFrequency("weekly");
    setIsPublic(true);
    navigate(`/newsletter/${newsletter.id}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("newsletter.create", "Create Newsletter")}
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("newsletter.title", "Title")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("newsletter.titlePlaceholder", "My Weekly Digest")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("newsletter.topic", "Topic")}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t(
                  "newsletter.topicPlaceholder",
                  "European tech startups & venture capital"
                )}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("newsletter.frequency", "Frequency")}
              </label>
              <Select.Root value={frequency} onValueChange={setFrequency}>
                <Select.Trigger className="inline-flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-[60] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <Select.Viewport className="p-1">
                      {FREQUENCIES.map((freq) => (
                        <Select.Item
                          key={freq}
                          value={freq}
                          className="relative flex cursor-pointer select-none items-center rounded-md px-8 py-2 text-sm text-gray-900 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 dark:data-[highlighted]:bg-gray-800"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <Check className="h-4 w-4" />
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

            {/* Public toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("newsletter.public", "Public")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "newsletter.publicHint",
                    "Others can discover and subscribe to your newsletter"
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  isPublic ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    isPublic ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Dialog.Close className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              {t("common.cancel", "Cancel")}
            </Dialog.Close>
            <button
              onClick={handleCreate}
              disabled={
                !title.trim() || !topic.trim() || createNewsletter.isPending
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createNewsletter.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("common.create", "Create")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
