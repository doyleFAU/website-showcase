export const SITE_URL =
  process.env.SITE_URL || "https://website-showcase-lemon.vercel.app";

export const SITE_NAME = "Vervio";

export const SITE_TAGLINE =
  "A free website planning app to explore fonts, colors, homepage layouts, and features before you hire a builder.";

export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || "";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-share.svg`;

export const ORGANIZATION = {
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
  areaServed: [
    "South Florida",
    "Palm Beach County",
    "Broward County",
    "Boca Raton",
    "Delray Beach",
    "Fort Lauderdale",
    "West Palm Beach",
  ],
};

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    url: ORGANIZATION.url,
    description: ORGANIZATION.description,
    areaServed: ORGANIZATION.areaServed,
  };
}

export function webAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: SITE_TAGLINE,
    featureList: [
      "Live color and font preview",
      "16 homepage layout ideas",
      "Business-type quick start",
      "Website feature wish list",
      "Step-by-step planning tutorial",
    ],
  };
}

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export function localServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} website planning`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    serviceType: "Website planning and design preview",
    areaServed: ORGANIZATION.areaServed.map((name) => ({
      "@type": "Place",
      name,
    })),
    description:
      "Free website planning tool for South Florida small businesses. Plan homepage layouts, colors, fonts, and features in Boca Raton, Delray Beach, Fort Lauderdale, and nearby areas before hiring a developer.",
  };
}

export function articleSchema({ title, description, path }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/${path}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}
