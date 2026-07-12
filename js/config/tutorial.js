export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    label: "Welcome",
    title: "Let's build your website together",
    lead: "Ten quick steps — about 3 minutes. You'll shape your business type, look and feel, homepage, site name, and extras. At the end you'll see a full preview of the site you designed.",
    overview: "See your finished website",
  },
  {
    id: "business",
    label: "Business",
    title: "What kind of business is this for?",
    lead: "Pick the closest match. We'll suggest a homepage style and features you can change later.",
    requires: "industry",
    hint: "Choose a business type to continue.",
  },
  {
    id: "colors",
    label: "Colors",
    title: "Choose your color theme",
    lead: "This sets the mood for your whole site. Tap one to try it live — the page updates instantly.",
  },
  {
    id: "fonts",
    label: "Fonts",
    title: "Choose your fonts",
    lead: "Headlines and body text will use this pairing across your preview.",
  },
  {
    id: "mode",
    label: "Background",
    title: "Light or dark background?",
    lead: "Either works. Dark feels modern; light feels open and airy.",
  },
  {
    id: "homepage",
    label: "Homepage",
    title: "Pick your homepage layout",
    lead: "This is the first page visitors see. Choose the style that fits your business.",
  },
  {
    id: "sitename",
    label: "Site name",
    title: "Name your website",
    lead: "What should we call your business on the homepage? You can change this anytime.",
    requires: "siteName",
    hint: "Enter a business or site name to continue.",
  },
  {
    id: "essentials",
    label: "Must-haves",
    title: "Must-have features",
    lead: "Check the basics most businesses need. You can always add more on the next step.",
  },
  {
    id: "extras",
    label: "Extras",
    title: "Nice extras",
    lead: "Optional add-ons that make your site even more useful. Skip anything you don't need.",
  },
  {
    id: "showcase",
    label: "Your site",
    title: "Here is the website you designed",
    lead: "Full-size preview below — your colors, fonts, homepage, and add-ons all together.",
  },
];

export const TUTORIAL_STORAGE_KEY = "vervio-tutorial";

export const SHOWCASE_STEP = TUTORIAL_STEPS.length - 1;
export const PERSIST_STEP = SHOWCASE_STEP - 1;

export const TUTORIAL_THEMES = [
  "ocean",
  "forest",
  "sunset",
  "slate",
  "berry",
  "navy",
  "gold",
  "lavender",
];

export const TUTORIAL_FONTS = [
  "modern",
  "friendly",
  "professional",
  "playful",
  "luxury",
  "startup",
  "classic",
  "soft",
];

export const PRESET_OPTIONS = [
  { id: "tech", label: "Modern Tech", hint: "Apps, SaaS, and startups" },
  { id: "local", label: "Local Business", hint: "Shops, cafes, and services" },
  { id: "creative", label: "Creative Studio", hint: "Designers and photographers" },
  { id: "luxury", label: "Luxury Real Estate", hint: "Listings and premium brands" },
  { id: "wellness", label: "Wellness & Spa", hint: "Calm booking-focused sites" },
  { id: "professional", label: "Law & Finance", hint: "Trustworthy and polished" },
  { id: "fitness", label: "Fitness Gym", hint: "High-energy class schedules" },
  { id: "restaurant", label: "Fine Dining", hint: "Menus and reservations" },
  { id: "travel", label: "Travel", hint: "Agencies and tour operators" },
  { id: "education", label: "Online Learning", hint: "Courses and coaching" },
  { id: "photography", label: "Photography", hint: "Studios and portfolios" },
  { id: "music", label: "Music & Events", hint: "Artists and venues" },
  { id: "ecommerce", label: "Boutique Shop", hint: "Online stores and makers" },
  { id: "construction", label: "Builders", hint: "Contractors and trades" },
  { id: "medical", label: "Medical", hint: "Clinics and dental practices" },
  { id: "nonprofit", label: "Community", hint: "Nonprofits and charities" },
];

export const PRESET_HERO = {
  tech: {
    kicker: "Ship faster",
    headline: "Build, launch, and scale online.",
    lead: "A sharp homepage for apps, tools, and modern brands.",
  },
  local: {
    kicker: "Welcome neighbors",
    headline: "Your local business, easy to find.",
    lead: "Hours, location, and what makes you special — front and center.",
  },
  creative: {
    kicker: "Portfolio ready",
    headline: "Show the world what you create.",
    lead: "Bold visuals that put your best work in the spotlight.",
  },
  luxury: {
    kicker: "Curated living",
    headline: "Properties worth remembering.",
    lead: "Elegant listings with room to breathe and impress.",
  },
  wellness: {
    kicker: "Restore balance",
    headline: "Calm starts with your first visit.",
    lead: "Soft, soothing layout built for booking and trust.",
  },
  professional: {
    kicker: "Trusted counsel",
    headline: "Clarity and confidence for every client.",
    lead: "A polished site that earns trust from the first click.",
  },
  fitness: {
    kicker: "Train harder",
    headline: "Your goals. Your schedule. Your gym.",
    lead: "High-energy homepage with classes, trainers, and pricing.",
  },
  restaurant: {
    kicker: "Reserve your table",
    headline: "An experience worth savoring.",
    lead: "Menu highlights, ambiance, and easy reservations.",
  },
  travel: {
    kicker: "Explore more",
    headline: "Trips designed around what you love.",
    lead: "Inspiring layout for travel brands and tour operators.",
  },
  education: {
    kicker: "Learn with confidence",
    headline: "Courses that fit your schedule and goals.",
    lead: "Clear, calm homepage for schools, tutors, and coaches.",
  },
  photography: {
    kicker: "Captured beautifully",
    headline: "Your story told through stunning visuals.",
    lead: "Portfolio-first layout for photographers and studios.",
  },
  music: {
    kicker: "On stage tonight",
    headline: "Events, artists, and nights to remember.",
    lead: "High-energy homepage for venues and performers.",
  },
  ecommerce: {
    kicker: "Shop the collection",
    headline: "Products people love — easy to browse and buy.",
    lead: "Retail-ready layout for boutiques and online shops.",
  },
  construction: {
    kicker: "Quality built in",
    headline: "Trusted craftsmanship for every project.",
    lead: "Strong, professional homepage for builders and trades.",
  },
  medical: {
    kicker: "Patient-centered care",
    headline: "Healthcare that feels calm and approachable.",
    lead: "Clean, reassuring layout for clinics and practices.",
  },
  nonprofit: {
    kicker: "Make a difference",
    headline: "Join a community that shows up for others.",
    lead: "Mission-driven homepage for charities and local orgs.",
  },
};

export const INDUSTRY_ICONS = {
  cafe: "☕",
  tech: "💻",
  creative: "🎨",
  realestate: "🏠",
  wellness: "🧘",
  professional: "⚖️",
  fitness: "💪",
  nonprofit: "🤝",
};

export const STEP_ESTIMATES = {
  welcome: 0,
  business: 30,
  colors: 25,
  fonts: 25,
  mode: 15,
  homepage: 30,
  sitename: 20,
  essentials: 35,
  extras: 35,
  showcase: 0,
};

export const INDUSTRY_SITE_NAMES = {
  cafe: "Your Cafe",
  tech: "Your Startup",
  creative: "Your Studio",
  realestate: "Your Properties",
  wellness: "Your Spa",
  professional: "Your Firm",
  fitness: "Your Gym",
  nonprofit: "Your Organization",
};

export function splitFeatureGroups(items) {
  const midpoint = Math.ceil(items.length / 2);
  return {
    essentials: items.slice(0, midpoint),
    extras: items.slice(midpoint),
  };
}
