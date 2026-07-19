import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  escapeAttr,
  GOOGLE_SITE_VERIFICATION,
  organizationSchema,
  webAppSchema,
  faqSchema,
  localServiceSchema,
  articleSchema,
} from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const GOOGLE_FONTS_PRIMARY =
  "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bebas+Neue&family=Cormorant+Garamond:wght@500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600&family=Manrope:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Mulish:wght@400;600&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600&family=Oswald:wght@500;700&family=Playfair+Display:wght@500;700&family=Poppins:wght@400;600;700&family=Raleway:wght@500;700&family=Roboto:wght@400;500&family=Rubik:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Space+Grotesk:wght@400;500;700&family=Work+Sans:wght@400;600&display=swap";

const GOOGLE_FONTS_SECONDARY =
  "https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;600;700&family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&family=Bitter:wght@400;700&family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700&family=Caveat:wght@500;700&family=Courier+Prime:wght@400;700&family=Crimson+Pro:wght@400;600&family=Exo+2:wght@400;600;700&family=Great+Vibes&family=Jost:wght@400;600&family=Karla:wght@400;600&family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Nunito+Sans:wght@400;600&family=Outfit:wght@400;600;700&family=Pacifico&family=Quicksand:wght@400;600&family=Roboto+Condensed:wght@400;700&family=Roboto+Slab:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=Special+Elite&family=Spectral:wght@400;600;700&display=swap";

const FAQ_ITEMS = [
  {
    question: "What is Vervio?",
    answer:
      "Vervio is a free website planning app. You can try fonts, colors, homepage layouts, and feature ideas in a live preview before you hire a designer or use a website builder. No login, no install, and no coding required.",
  },
  {
    question: "Is Vervio a website builder like Wix or Squarespace?",
    answer:
      "No. Vervio is for planning, not publishing. It helps you decide what your site should look like and what it should include. Many people plan on Vervio first, then hand their picks to a developer, agency, or DIY platform.",
  },
  {
    question: "Is there a free website planning tool for Boca Raton?",
    answer:
      "Yes. Vervio is a free website planning app that works in any browser for Boca Raton and South Florida businesses. Preview homepage layouts, try colors and fonts, and save a feature wish list — then share your plan with whoever will build your site.",
  },
  {
    question: "Is Vervio free?",
    answer:
      "Yes. Browsing presets, trying colors and fonts, saving your wish list, and walking through the Start Here tutorial are all free. There is nothing to install and no account required.",
  },
  {
    question: "Do I need coding skills?",
    answer:
      "No. Everything is visual. Tap a style, scroll through homepage ideas, and check the features you want. The site updates instantly so you can see what you are choosing.",
  },
  {
    question: "What is the best way to plan a small business website?",
    answer:
      "Start with your business type, pick a homepage layout that fits, choose colors and fonts, then list must-have features like contact forms, galleries, or online booking. Vervio's Start Here tutorial walks through those steps in about three minutes.",
  },
  {
    question: "Can I use Vervio for website planning in South Florida?",
    answer:
      "Yes. Vervio is especially useful for South Florida small businesses that want to plan their website before hiring help. Businesses in Boca Raton, Delray Beach, Fort Lauderdale, and nearby areas use it to compare homepage ideas and create a clear brief for their designer.",
  },
  {
    question: "How many homepage layouts does Vervio include?",
    answer:
      "Sixteen ready-made homepage ideas, including layouts for tech startups, local businesses, creative studios, restaurants, fitness gyms, travel, online learning, photography, music events, medical practices, nonprofits, and more.",
  },
  {
    question: "How is Vervio different from hiring a web agency?",
    answer:
      "Vervio helps you arrive prepared. Instead of guessing what you want, you can show a developer or agency exact colors, fonts, layouts, and a feature checklist. That saves time and often reduces back-and-forth on the first draft.",
  },
];

function readPartial(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").trim();
}

function inlinePartialSlot(partialPath) {
  const content = readPartial(partialPath);
  return `    <div data-partial="${partialPath}">${content}</div>`;
}

function sectionPage(partial) {
  return `    <div class="container showcase-content">
${inlinePartialSlot(partial)}
    </div>`;
}

function canonicalUrl(file) {
  if (file === "index.html") return `${SITE_URL}/`;
  return `${SITE_URL}/${file}`;
}

function buildHead({ title, description, file, schemas = [] }) {
  const canonical = canonicalUrl(file);
  const safeTitle = escapeAttr(title);
  const safeDescription = escapeAttr(description);
  const jsonLd = schemas
    .map(
      (schema) =>
        `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`
    )
    .join("\n");
  const googleVerification = GOOGLE_SITE_VERIFICATION
    ? `  <meta name="google-site-verification" content="${escapeAttr(GOOGLE_SITE_VERIFICATION)}">\n`
    : "";

  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${googleVerification}  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${GOOGLE_FONTS_PRIMARY}" rel="stylesheet">
  <link href="${GOOGLE_FONTS_SECONDARY}" rel="stylesheet">
  <link rel="stylesheet" href="css/main.css">
${jsonLd}
</head>`;
}

const baseSchemas = [organizationSchema(), webAppSchema()];

const pages = [
  {
    file: "index.html",
    title: "Vervio — Free Website Planning App",
    description:
      "Free website planning app — explore fonts, colors, 16 homepage layouts, and features. Plan your site before you hire a builder. No coding required.",
    main: `${inlinePartialSlot("partials/contact-form.html")}
${inlinePartialSlot("partials/hero.html")}
${inlinePartialSlot("partials/home-seo.html")}`,
    schemas: baseSchemas,
  },
  {
    file: "tutorial.html",
    title: "Build Your Website — Vervio",
    description: "A step-by-step walkthrough to design your first website.",
    main: `    <div class="container tutorial-page" id="tutorial-app" aria-live="polite"></div>`,
    schemas: baseSchemas,
  },
  {
    file: "style.html",
    title: "Pick a Style — Vervio",
    description: "Choose colors and fonts for your first website.",
    main: `    <div class="container sandbox-wrap">
${inlinePartialSlot("partials/sandbox.html")}
    </div>`,
    schemas: baseSchemas,
  },
  {
    file: "presets.html",
    title: "Home Pages — Vervio",
    description: "Browse 16 ready-made homepage layouts for your business.",
    partial: "partials/presets.html",
    schemas: baseSchemas,
  },
  {
    file: "industry.html",
    title: "Quick Start — Vervio",
    description: "Pick your business type and get a tailored website starting point.",
    partial: "partials/industry.html",
    schemas: baseSchemas,
  },
  {
    file: "typography.html",
    title: "Fonts — Vervio",
    description: "Compare font pairings for your website.",
    partial: "partials/typography.html",
    schemas: baseSchemas,
  },
  {
    file: "colors.html",
    title: "Colors — Vervio",
    description: "Explore color palettes and themes for your website.",
    partial: "partials/colors.html",
    schemas: baseSchemas,
  },
  {
    file: "layouts.html",
    title: "Page Ideas — Vervio",
    description: "See layout patterns for common website pages.",
    partial: "partials/layouts.html",
    schemas: baseSchemas,
  },
  {
    file: "effects.html",
    title: "Effects — Vervio",
    description: "Preview special visual effects for your website.",
    partial: "partials/reactbits.html",
    schemas: baseSchemas,
  },
  {
    file: "extras.html",
    title: "Popular Blocks — Vervio",
    description: "Popular sections and blocks customers ask for on their websites.",
    partial: "partials/extras.html",
    schemas: baseSchemas,
  },
  {
    file: "features.html",
    title: "Add-ons — Vervio",
    description: "Build your wish list of website features and add-ons.",
    partial: "partials/features-contact.html",
    schemas: baseSchemas,
  },
  {
    file: "my-list.html",
    title: "My List — Vervio",
    description: "Review everything you have picked for your website.",
    partial: "partials/my-list.html",
    schemas: baseSchemas,
  },
  {
    file: "login.html",
    title: "Log In — Vervio",
    description: "Save your Vervio website plan to your account — colors, fonts, and wish list.",
    partial: "partials/login.html",
    schemas: baseSchemas,
  },
  {
    file: "reset-password.html",
    title: "Reset Password — Vervio",
    description: "Choose a new password for your Vervio account.",
    partial: "partials/reset-password.html",
    schemas: baseSchemas,
  },
  {
    file: "faq.html",
    title: "FAQ — Vervio",
    description:
      "FAQ about Vervio — free website planning app. Includes answers about website planning in Boca Raton and South Florida.",
    partial: "partials/faq.html",
    schemas: [...baseSchemas, faqSchema(FAQ_ITEMS)],
  },
  {
    file: "local.html",
    title: "Website Planning in Boca Raton & South Florida — Vervio",
    description:
      "Free website planning in Boca Raton and South Florida. Preview homepage layouts, colors, fonts, and features before you hire a designer or agency.",
    partial: "partials/local.html",
    schemas: [...baseSchemas, localServiceSchema()],
  },
  {
    file: "planning-guide.html",
    title: "How to Plan a Small Business Website — Vervio",
    description:
      "Step-by-step website planning guide — layouts, colors, fonts, and features. Includes tips for Boca Raton and South Florida businesses.",
    partial: "partials/planning-guide.html",
    schemas: [
      ...baseSchemas,
      articleSchema({
        title: "How to plan a small business website (step by step)",
        description:
          "A practical guide from Vervio — free website planning for business owners.",
        path: "planning-guide.html",
      }),
    ],
  },
  {
    file: "homepage-ideas.html",
    title: "16 Homepage Layout Ideas — Vervio",
    description:
      "Browse 16 homepage layout ideas for small businesses — tech, local shops, restaurants, fitness, medical, and more.",
    partial: "partials/homepage-ideas.html",
    schemas: [
      ...baseSchemas,
      articleSchema({
        title: "16 homepage layouts for small businesses",
        description:
          "Every layout is a full first-page design you can preview live in Vervio.",
        path: "homepage-ideas.html",
      }),
    ],
  },
];

function renderPage({ file, title, description, main, partial, schemas = baseSchemas }) {
  const pageHead = buildHead({ title, description, file, schemas });
  const mainContent = main || sectionPage(partial);
  const header = inlinePartialSlot("partials/header.html");
  const footer = inlinePartialSlot("partials/footer.html");

  return `<!DOCTYPE html>
<html lang="en" data-theme="ocean" data-font="modern" data-radius="soft" data-mode="light" data-shadows="on" data-animations="on" data-gradients="on">
${pageHead}
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <button type="button" class="back-to-top btn btn-secondary btn-sm" id="back-to-top" aria-label="Back to top" hidden>
    ↑ Back to top
  </button>

${header}

  <main id="main">
${mainContent}
  </main>

${footer}

  <script type="module" src="js/main.js"></script>
</body>
</html>
`;
}

for (const page of pages) {
  fs.writeFileSync(path.join(root, page.file), renderPage(page));
}

const sitemapEntries = pages
  .map((page) => {
    const loc = canonicalUrl(page.file);
    const priority = page.file === "index.html" ? "1.0" : page.file === "faq.html" || page.file === "local.html" ? "0.9" : "0.8";
    const changefreq = page.file === "index.html" ? "weekly" : "monthly";
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n");

fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`
);

fs.writeFileSync(
  path.join(root, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
);

fs.writeFileSync(
  path.join(root, "llms.txt"),
  `# Vervio

> Free website planning app — explore fonts, colors, homepage layouts, and features before you hire a builder.

Vervio (${SITE_URL}) helps small businesses plan their first website. It is not a website builder; it is a free website planning tool with live previews.

## Website planning — South Florida

Vervio is used for website planning in Boca Raton, Delray Beach, Fort Lauderdale, West Palm Beach, and across South Florida. Local business owners plan homepage layouts, colors, fonts, and features before hiring a developer or agency.

## Key pages

- Home: ${SITE_URL}/
- FAQ (includes Boca Raton website planning): ${SITE_URL}/faq.html
- Website planning in Boca Raton & South Florida: ${SITE_URL}/local.html
- Planning guide: ${SITE_URL}/planning-guide.html
- 16 homepage ideas: ${SITE_URL}/homepage-ideas.html
- Homepage layouts: ${SITE_URL}/presets.html
- Quick start by business type: ${SITE_URL}/industry.html
- Colors and fonts: ${SITE_URL}/style.html
- Feature wish list: ${SITE_URL}/features.html
- Tutorial: ${SITE_URL}/tutorial.html

## What Vervio does

- Website planning with live color and font preview
- 16 homepage layout presets (tech, local business, restaurant, fitness, medical, nonprofit, travel, photography, and more)
- Business-type quick start
- Website feature checklist saved to My List
- Step-by-step planning tutorial

## Common searches Vervio answers

- Free website planning tool
- Website planning app
- Website planning in Boca Raton
- Website planning South Florida
- Plan my website before hiring a designer
- Preview homepage layouts free

## Who it is for

Small business owners, startups, and local shops who want to plan a website before hiring a developer or using Wix, Squarespace, or WordPress.

## Pricing

Free. No login required.

## Sitemap

${SITE_URL}/sitemap.xml
`
);

console.log(`Generated ${pages.length} pages, sitemap.xml, robots.txt, and llms.txt.`);
