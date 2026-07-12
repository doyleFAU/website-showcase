#!/usr/bin/env node

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const b = (text) => `${c.bold}${c.cyan}${text}${c.reset}`;
const h = (text) => `${c.bold}${c.yellow}${text}${c.reset}`;
const ok = (text) => `${c.green}${text}${c.reset}`;
const note = (text) => `${c.gray}${text}${c.reset}`;
const path = (text) => `${c.magenta}${text}${c.reset}`;

console.log(`
${b("╔══════════════════════════════════════════════════════════════════════╗")}
${b("║")}  ${h("VERVIO")} — website architecture & workflow                          ${b("║")}
${b("║")}  ${note("https://website-showcase-lemon.vercel.app")}                         ${b("║")}
${b("╚══════════════════════════════════════════════════════════════════════╝")}
`);

console.log(h("\n▸ VISITOR JOURNEY\n"));
console.log(`
  ${ok("┌─────────────┐")}
  ${ok("│")}  Homepage   ${ok("│")}  ${path("index.html")}
  ${ok("└──────┬──────┘")}
         │
         ├──────────────► ${path("tutorial.html")}     Start Here (3-min tour)
         ├──────────────► ${path("style.html")}        Pick colors & fonts
         ├──────────────► ${path("presets.html")}      16 homepage layouts
         ├──────────────► ${path("industry.html")}     Quick start by business
         ├──────────────► ${path("features.html")}     Add-ons wish list
         └──────────────► ${path("my-list.html")}       Saved picks summary

  ${note("SEO pages:")} ${path("faq.html")} · ${path("local.html")} · ${path("planning-guide.html")} · ${path("homepage-ideas.html")}
`);

console.log(h("▸ AUTH FLOW (logged-in users)\n"));
console.log(`
  ${ok("┌──────────────┐")}         ${ok("┌──────────────────┐")}
  ${ok("│")} ${path("login.html")}   ${ok("│")} ──────► ${ok("│")}  Supabase Auth    ${ok("│")}
  ${ok("└──────┬───────┘")}         ${ok("└────────┬─────────┘")}
         │                            │
         │ sign up / log in             │ JWT session
         ▼                            ▼
  ${ok("┌──────────────┐")}         ${ok("┌──────────────────┐")}
  ${ok("│")} Browse Vervio ${ok("│")} ◄────── ${ok("│")}  user_plans table ${ok("│")}
  ${ok("└──────┬───────┘")}         ${ok("└────────┬─────────┘")}
         │                            │
         │ change colors, fonts,      │ auto-save (choices + features)
         │ check add-ons              │
         ▼                            ▼
  ${ok("┌──────────────┐")}         ${ok("┌──────────────────┐")}
  ${ok("│")} localStorage  ${ok("│")}         ${ok("│")}  Cloud sync       ${ok("│")}
  ${ok("│")} (offline too) ${ok("│")}         ${ok("│")}  cross-device     ${ok("│")}
  ${ok("└──────────────┘")}         ${ok("└──────────────────┘")}

  ${note("Forgot password:")} ${path("login.html")} → email link → ${path("reset-password.html")}
`);

console.log(h("▸ DATA STORED PER USER\n"));
console.log(`
  ${path("user_plans")} (Supabase)
  ├── user_id      → links to auth.users
  ├── choices      → theme, font, mode, shadows…
  ├── features     → add-on checklist IDs
  └── updated_at   → last save time

  ${path("localStorage")} (browser, no login required)
  ├── vervio-choices   → style picks
  └── vervio-features  → wish list
`);

console.log(h("▸ BUILD & DEPLOY PIPELINE\n"));
console.log(`
  ${c.blue}YOUR MAC${c.reset}                              ${c.blue}VERCEL (production)${c.reset}
  ─────────                              ─────────────────────

  ${path(".env")}                               Vercel env vars
      │                                   (SUPABASE_URL, ANON_KEY)
      ▼                                           │
  ${ok("npm run build")}                               ▼
      │                                   ${ok("npm run build")} (on deploy)
      ├─► generate ${path("supabase.js")}              ├─► generate ${path("supabase.js")}
      └─► generate HTML pages                   └─► generate HTML pages
              │                                           │
              ▼                                           ▼
      ${path("vercel --prod")}  ──────────────►   ${ok("website-showcase-lemon.vercel.app")}
              or
      ${path("git push")} ──► GitHub ──► auto-deploy
`);

console.log(h("▸ PROJECT FILE MAP\n"));
console.log(`
  website-showcase/
  │
  ├── ${path(".env")}                 ${note("← your keys (local only)")}
  ├── ${path("package.json")}         ${note("← npm run build")}
  │
  ├── ${path("partials/")}            ${note("← reusable HTML chunks")}
  │   ├── header.html, footer.html, hero.html
  │   ├── login.html, presets.html, faq.html …
  │
  ├── ${path("js/")}
  │   ├── main.js                   ${note("← app entry")}
  │   ├── config/supabase.js        ${note("← generated at build")}
  │   └── modules/
  │       ├── auth.js               ${note("← login / save / sync")}
  │       ├── sandbox.js            ${note("← colors & fonts")}
  │       ├── presets.js            ${note("← 16 homepages")}
  │       └── checklist.js          ${note("← wish list")}
  │
  ├── ${path("scripts/")}
  │   ├── build-pages.mjs           ${note("← builds HTML + SEO")}
  │   ├── generate-supabase-config.mjs
  │   └── show-workflow.mjs         ${note("← this diagram")}
  │
  └── ${path("*.html")}              ${note("← built pages (generated)")}
`);

console.log(h("▸ SECURITY LAYERS\n"));
console.log(`
  Browser  ──►  ${ok("anon key only")}  ──►  Supabase  ──►  ${ok("RLS policies")}
                                                    │
                                                    └── users only see their own row

  ${note("Never in frontend or GitHub:")} service_role key · Stripe secret · .env
`);

console.log(h("▸ QUICK COMMANDS\n"));
console.log(`
  ${ok("npm run workflow")}   show this diagram
  ${ok("npm run build")}      generate config + HTML pages
  ${ok("npm run config")}     regenerate supabase.js only
  ${ok("vercel --prod")}      deploy to production
`);

console.log(note("\nRun anytime: npm run workflow\n"));
