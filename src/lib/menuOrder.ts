type Section = { title: string; cats: string[]; order: string[] };

// Sections in the exact order/title of the printed menu.
// `cats` = raw DB category keywords. `order` = item-name keywords in printed order.
// An exact name match wins over a partial one (see itemRank), so "vanilla"
// and "french vanilla" can both be listed without clashing.
const SECTIONS: Section[] = [
  {
    title: "Classics",
    cats: [],
    order: [
      "espresso",
      "cortado",
      "cappuccino",
      "flat white",
      "americano",
      "long black",
      "cold brew",
      "creamy",
      "fizz",
      "café latte",
      "cafe latte",
    ],
  },
  {
    title: "Flavored Latte",
    cats: [],
    order: ["vanilla", "hazelnut", "almond", "caramel", "french vanilla"],
  },
  {
    title: "Signature Latte",
    cats: [],
    order: [
      "breve",
      "macchiato",
      "sea-salt",
      "sea salt",
      "rock salt",
      "spanish",
      "mocha",
      "velvet",
      "white choco",
      "biscoff",
    ],
  },
  {
    title: "Matcha Series",
    cats: ["matcha"],
    order: [
      "matcha latte",
      "matcha oat",
      "sea-salt",
      "sea salt",
      "rock salt",
      "strawberry",
    ],
  },
  {
    title: "House Tea",
    cats: ["tea"],
    order: ["lemon", "hibiscus", "peppermint", "green tea"],
  },
  {
    title: "Non Caffeine",
    cats: ["oat milk", "caffeine free", "non caff"],
    order: [
      "choco",
      "strawberry",
      "biscoff",
      "banana",
      "peach",
      "green apple",
      "blueberry",
      "kiwi",
    ],
  },
  {
    title: "Soda",
    cats: ["soda"],
    order: ["blueberry", "honey peach", "green apple", "kiwi", "lemon"],
  },
  {
    title: "House Meals",
    cats: ["house plate", "house meal"],
    order: ["fried chicken", "liempo"],
  },
  {
    title: "Savory Meals",
    cats: ["savory", "savoury"],
    order: [
      "hamonado",
      "garlic",
      "glazed",
      "salpicao",
      "hungarian",
      "tocino",
      "bacon",
      "adobo",
      "karaage",
      "finger",
    ],
  },
  {
    title: "Noodles and Soup",
    cats: ["noodle", "soup"],
    order: ["canton", "ramen"],
  },
  {
    title: "Pasta",
    cats: ["pasta"],
    order: ["sardines", "beef chili", "chicken pops"],
  },
  { title: "Student Meal", cats: ["student"], order: ["cxr", "pxr"] },
  {
    title: "Appetizers and Snacks",
    cats: ["appetizer", "snack"],
    order: [
      "hash brown",
      "grilled egg",
      "nuggets",
      "poppers",
      "fries",
      "mixed",
    ],
  },
  {
    title: "Waffles",
    cats: ["waffle"],
    order: ["honey", "caramel", "biscoff"],
  },
];

// Coffee items are split by name (DB has them as Coffee Hot / Coffee Iced).
const SIGNATURE = [
  "macchiato",
  "spanish",
  "mocha",
  "biscoff",
  "rock salt",
  "sea-salt",
  "sea salt",
  "velvet",
  "white choco",
  "breve",
];
const FLAVORED = ["hazelnut", "almond", "vanilla", "caramel latte"];

export function sectionOf(item: { name: string; category: string }): string {
  const c = item.category.toLowerCase().trim();
  if (c.includes("coffee")) {
    const n = item.name.toLowerCase();
    if (SIGNATURE.some((k) => n.includes(k))) return "Signature Latte";
    if (FLAVORED.some((k) => n.includes(k))) return "Flavored Latte";
    return "Classics";
  }
  const s = SECTIONS.find((s) => s.cats.some((k) => c.includes(k)));
  return s ? s.title : item.category; // Baked Treats, Desserts, etc. stay as-is
}

// Sort section titles: printed order first, everything else after (stable).
export function sortTitles(titles: string[]): string[] {
  const rank = (t: string) => {
    const i = SECTIONS.findIndex((s) => s.title === t);
    return i === -1 ? 999 : i;
  };
  return titles
    .map((t, idx) => ({ t, idx, r: rank(t) }))
    .sort((a, b) => a.r - b.r || a.idx - b.idx)
    .map((x) => x.t);
}

// Position of an item inside its section, per the printed menu.
// Exact name match first, then partial match.
export function itemRank(title: string, name: string): number {
  const s = SECTIONS.find((s) => s.title === title);
  if (!s) return 99;
  const n = name.toLowerCase().trim();
  let i = s.order.findIndex((k) => n === k);
  if (i === -1) i = s.order.findIndex((k) => n.includes(k));
  return i === -1 ? 99 : i;
}

// Kept so earlier patches still compile.
export const sortCategories = sortTitles;
export function displayTitle(cat: string): string {
  return cat;
}
