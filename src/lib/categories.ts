export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  "European Startup": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    darkBg: "dark:bg-emerald-950",
    darkText: "dark:text-emerald-300",
  },
  "VC & Funding": {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    darkBg: "dark:bg-indigo-950",
    darkText: "dark:text-indigo-300",
  },
  "AI & Technology": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-950",
    darkText: "dark:text-blue-300",
  },
  "Product Launch": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    darkBg: "dark:bg-orange-950",
    darkText: "dark:text-orange-300",
  },
  "Market Trends": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    darkBg: "dark:bg-purple-950",
    darkText: "dark:text-purple-300",
  },
  "Regulation & Policy": {
    bg: "bg-pink-50",
    text: "text-pink-700",
    darkBg: "dark:bg-pink-950",
    darkText: "dark:text-pink-300",
  },
};

export function getCategoryColor(category: string) {
  return (
    CATEGORY_COLORS[category] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      darkBg: "dark:bg-gray-900",
      darkText: "dark:text-gray-300",
    }
  );
}
