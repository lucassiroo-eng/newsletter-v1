import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Globe, Save, Loader2, Check, ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  locale: string;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "es", label: "Espanol", flag: "ES" },
  { code: "fr", label: "Francais", flag: "FR" },
] as const;

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (!error && data) {
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name || "");
        setLocale(p.locale || "en");
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), locale })
      .eq("id", user.id);

    if (!error) {
      // Update i18n language
      await i18n.changeLanguage(locale);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  };

  const hasChanges =
    profile &&
    (displayName.trim() !== (profile.display_name || "") ||
      locale !== (profile.locale || "en"));

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {t("settings.title", "Settings")}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile Section */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-5">
                <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("settings.profile", "Profile")}
                </h2>
              </div>

              <div className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      {displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t(
                        "settings.avatarHint",
                        "Avatar synced from your Google account"
                      )}
                    </p>
                  </div>
                </div>

                {/* Display name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("settings.displayName", "Display name")}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t(
                      "settings.displayNamePlaceholder",
                      "Your name"
                    )}
                    className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </section>

            {/* Language Section */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t("settings.language", "Language")}
                </h2>
              </div>

              <Select.Root value={locale} onValueChange={setLocale}>
                <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 min-w-[200px] hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <Select.Viewport className="p-1">
                      {LANGUAGES.map((lang) => (
                        <Select.Item
                          key={lang.code}
                          value={lang.code}
                          className="relative flex cursor-pointer select-none items-center rounded-md px-8 py-2 text-sm text-gray-900 outline-none hover:bg-gray-100 data-[highlighted]:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 dark:data-[highlighted]:bg-gray-800"
                        >
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                          <Select.ItemText>
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                {lang.flag}
                              </span>
                              {lang.label}
                            </span>
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </section>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
                  hasChanges
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                )}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saved
                  ? t("settings.saved", "Saved")
                  : t("settings.save", "Save changes")}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
