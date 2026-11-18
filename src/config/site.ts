/**
 * ShipKaro site configuration
 * ---------------------------------------------------------------
 * Every piece of editable text, link and number on the website lives
 * in this file. Change a value, save, and the site updates.
 *
 * Lines marked TODO are placeholders you should replace before launch.
 */

/* ------------------------------------------------------------------ */
/* Brand & contact                                                     */
/* ------------------------------------------------------------------ */

export const brand = {
  name: "ShipKaro",
  tagline: "You need it. We ship it.",
  // TODO: your real production domain (used for SEO, sitemap and social cards)
  url: "https://shipkaro.vercel.app",
  // Logo inside /public. Favicon, app icons and social images are generated from it.
  logo: "/logo.svg",
};

export const contact = {
  // TODO: WhatsApp number with country code, digits only (no +, spaces or dashes)
  whatsappNumber: "910000000000",
  // Message pre-filled when someone taps a "Chat on WhatsApp" button
  whatsappDefaultMessage: "Hi ShipKaro, I'd like to discuss a project.",
  // TODO: Instagram handle without the @
  instagram: "shipkaro",
  // TODO: your email address
  email: "hello@shipkaro.com",
};

/* ------------------------------------------------------------------ */
/* Policies (used in FAQ, process and the /start form)                */
/* ------------------------------------------------------------------ */

export const policies = {
  // TODO: number of revisions included in each package
  revisions: 2,
  advancePercent: 50,
  // TODO: how international clients pay you
  internationalPayment: "International clients can pay by bank transfer or PayPal.",
};

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export const nav = {
  links: [
    { label: "What we build", href: "/#build" },
    { label: "Process", href: "/#process" },
    { label: "FAQ", href: "/#faq" },
  ],
  whatsappLabel: "Chat on WhatsApp",
};

/* ------------------------------------------------------------------ */
/* Home: hero                                                          */
/* ------------------------------------------------------------------ */

export const hero = {
  eyebrow: "Custom software studio",
  headlineLine1: "You need it.",
  headlineLine2: "We ship it.", // set in italic
  subtext: "Apps, management systems and websites for your business or idea. Fixed quote, built on time.",
  primaryCta: { label: "Start a project", href: "/start" },
  // The sentences that drift along the curved lines around the hero
  driftLines: [
    "We need a gym app before the first of the month, members, renewals, the whole thing. ",
    "Can you build billing for our cafe so the kitchen gets tickets straight away? ",
    "My final year project is due in May and I want to actually understand the code. ",
  ],
};

/* Big statement under the hero: the photo card that shrinks as you scroll */
export const statement = {
  headingStart: "One chat.",
  headingItalic: "Software in your hands.",
  subtext: "No discovery decks or retainers. Tell us what you need on WhatsApp, get a fixed quote, and we start the same day.",
  // The card on the left that fades away as you scroll
  agencyLabel: "The usual way",
  agencySteps: ["Discovery calls", "Proposal deck", "Monthly retainer", "Kick-off in weeks"],
  // The photo card: this label stays, the lines below play one after another as you scroll
  shipLabel: "With ShipKaro",
  shipLines: ["Quote in a day", "Work starts the same day", "Your code, handed over"],
  image: "/images/statement.jpg",
  imageAlt: "Laptop glowing on a dark desk",
}

/* ------------------------------------------------------------------ */
/* Capability strip                                                    */
/* ------------------------------------------------------------------ */

export const capabilitiesLabel = "If it runs on software, we build it";

export const capabilities = [
  "Web apps",
  "Mobile apps",
  "SaaS",
  "Dashboards",
  "AI & automation",
  "Websites",
  "Integrations",
  "Hardware",
];

/* ------------------------------------------------------------------ */
/* What we build: service cards (also the pills on /start)            */
/* ------------------------------------------------------------------ */

export type Service = {
  /** Used in the link: /start?service=<slug>. Keep it lowercase-with-dashes. */
  slug: string;
  title: string;
  /** One line shown on the card and in the /start estimate */
  description: string;
  /** Tag text, e.g. "Custom quote" or "From ₹3,999" */
  price: string;
  /** true = orange price tag, false = neutral tag */
  highlight: boolean;
};

const CUSTOM = "Custom quote";

export const services: Service[] = [
  { slug: "pg-hostel-management", title: "PG & Hostel Management", description: "Rooms, tenants, rent collection and dues.", price: CUSTOM, highlight: false },
  { slug: "gym-fitness-management", title: "Gym & Fitness Management", description: "Members, plans, attendance and renewals.", price: CUSTOM, highlight: false },
  { slug: "clinic-hospital-software", title: "Clinic & Hospital Software", description: "Appointments, patient records and billing.", price: CUSTOM, highlight: false },
  { slug: "school-coaching-erp", title: "School & Coaching ERP", description: "Students, fees, attendance and results.", price: CUSTOM, highlight: false },
  { slug: "restaurant-cafe-pos", title: "Restaurant & Café POS", description: "Orders, tables, kitchen tickets and billing.", price: CUSTOM, highlight: false },
  { slug: "inventory-billing", title: "Inventory & Billing", description: "Stock, GST invoices and suppliers.", price: CUSTOM, highlight: false },
  { slug: "crm-sales", title: "CRM & Sales", description: "Leads, follow-ups and deal pipeline.", price: CUSTOM, highlight: false },
  { slug: "ecommerce-store", title: "E-commerce Store", description: "Catalogue, cart, payments and orders.", price: CUSTOM, highlight: false },
  { slug: "booking-appointments", title: "Booking & Appointments", description: "Salons, turfs, studios and service businesses.", price: CUSTOM, highlight: false },
  { slug: "hr-payroll", title: "HR & Payroll", description: "Staff records, attendance and salary slips.", price: CUSTOM, highlight: false },
  { slug: "dashboards-analytics", title: "Dashboards & Analytics", description: "All your business numbers in one live view.", price: CUSTOM, highlight: false },
  { slug: "mobile-apps", title: "Mobile Apps", description: "Android and iOS apps for customers or staff.", price: CUSTOM, highlight: false },
  { slug: "ai-chatbots-automation", title: "AI Chatbots & Automation", description: "WhatsApp bots, AI tools and automated workflows.", price: CUSTOM, highlight: false },
  { slug: "hardware-system-integration", title: "Hardware & System Integration", description: "Connect biometric, POS and IoT devices to your software.", price: CUSTOM, highlight: false },
  { slug: "saas-products", title: "SaaS Products", description: "Your startup idea built as a subscription product.", price: CUSTOM, highlight: false },
  { slug: "business-websites", title: "Business Websites", description: "Fast, modern sites that bring in customers.", price: CUSTOM, highlight: false },
  { slug: "major-minor-projects", title: "Major & Minor Projects", description: "Final-year projects with report and walkthrough.", price: "From ₹3,999", highlight: true },
  { slug: "portfolio-websites", title: "Portfolio Websites", description: "Personal sites for students and professionals.", price: "From ₹1,999", highlight: true },
  { slug: "resumes", title: "Resumes", description: "ATS-friendly resumes written from your details.", price: "From ₹499", highlight: true },
];

/* The solid orange card at the end of the grid (also the last pill on /start) */
export const somethingElse: Service = {
  slug: "other",
  title: "Something else?",
  description: "Tell us your idea. If it runs on software, we can build it.",
  price: CUSTOM,
  highlight: false,
};

export const buildSection = {
  eyebrow: "What we build",
  heading: "If it runs on software, we build it.",
  subtext: `Pick a category or bring your own idea. Fixed quote, ${policies.advancePercent}% to start, ${100 - policies.advancePercent}% on delivery.`,
  somethingElseCta: "Start a project",
};

/* ------------------------------------------------------------------ */
/* Process                                                             */
/* ------------------------------------------------------------------ */

export const processSection = {
  eyebrow: "How it works",
  headingStart: "From WhatsApp to",
  headingItalic: "delivered.",
  steps: [
    {
      title: "Chat with us",
      description: "Message on WhatsApp or Instagram. Tell us the idea in your own words, voice notes welcome.",
      image: "/images/step-chat.jpg",
      imageAlt: "Phone resting on a desk",
      bubble: "Hi, I run two PGs in Pune. Can you build something for rent and dues?",
    },
    {
      title: "Share details",
      description: "One short form with your requirements and deadline. We reply with a fixed quote.",
      image: "/images/step-details.jpg",
      imageAlt: "Overhead view of a desk with laptops and notes",
      bubble: "Quote: rooms, tenants, rent reminders on WhatsApp, monthly reports.",
    },
    {
      title: `Pay ${policies.advancePercent}%`,
      description: "Advance by UPI. Work starts the same day, not next sprint.",
      image: "/images/step-pay.jpg",
      imageAlt: "Card payment on a counter terminal",
      bubble: `${policies.advancePercent}% advance received. Kick-off today.`,
    },
    {
      title: "We build",
      description: "You get progress on WhatsApp at every milestone, with screens to try as we go.",
      image: "/images/step-build.jpg",
      imageAlt: "Code on a laptop screen",
      bubble: "Dashboard is ready to try. Sending you the link now.",
    },
    {
      title: "Delivered",
      description: "Walkthrough call and full source code handover. Then the balance.",
      image: "/images/step-delivered.jpg",
      imageAlt: "Two colleagues high-fiving at a desk",
      bubble: "Live and handed over. The code is yours.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Who we build for: the boxes that drift across the dark section     */
/* ------------------------------------------------------------------ */

export const audienceSection = {
  eyebrow: "What we build",
  headingStart: "Software for",
  headingItalic: "whoever you are.",
  linkLabel: "Start this",
};

export type Audience = {
  title: string;
  description: string;
  /** Service slugs from the list above; each becomes a link to /start */
  slugs: string[];
  image: string;
  imageAlt: string;
  /** Card colour */
  tone: "accent" | "cream" | "sand" | "ink" | "wash";
};

export const audiences: Audience[] = [
  {
    title: "Students",
    description: "Projects you can explain in the viva, and a profile that gets replies.",
    slugs: ["major-minor-projects", "portfolio-websites", "resumes"],
    image: "/images/build-students.jpg",
    imageAlt: "Students laughing around a laptop in a library",
    tone: "accent",
  },
  {
    title: "Professionals",
    description: "Doctors, lawyers, CAs, coaches and creators who want clients to find and book them.",
    slugs: ["clinic-hospital-software", "booking-appointments", "business-websites", "portfolio-websites"],
    image: "/images/audience-professionals.jpg",
    imageAlt: "Client checking in for an appointment on a tablet",
    tone: "cream",
  },
  {
    title: "Local businesses",
    description: "Gyms, PGs, cafes, shops and coaching centres that run on registers today.",
    slugs: ["gym-fitness-management", "pg-hostel-management", "restaurant-cafe-pos", "inventory-billing", "school-coaching-erp"],
    image: "/images/build-business.jpg",
    imageAlt: "A busy cafe counter",
    tone: "sand",
  },
  {
    title: "Companies",
    description: "Internal tools, automation and integrations that save your team hours every week.",
    slugs: ["crm-sales", "hr-payroll", "dashboards-analytics", "ai-chatbots-automation", "hardware-system-integration"],
    image: "/images/build-hardware.jpg",
    imageAlt: "Engineer working beside lab hardware",
    tone: "ink",
  },
  {
    title: "Founders",
    description: "Your idea built as a real product, ready for its first paying users.",
    slugs: ["saas-products", "mobile-apps", "ecommerce-store"],
    image: "/images/build-apps.jpg",
    imageAlt: "Phone home screen full of apps",
    tone: "wash",
  },
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export const faqSection = {
  headingStart: "Questions,",
  headingItalic: "answered.",
  answerLabel: "ShipKaro",
  items: [
    {
      q: "Will I understand my project for the viva?",
      a: "Yes. Every project includes a code walkthrough call, and major projects include viva prep.",
    },
    {
      q: "How do I pay?",
      a: `UPI. ${policies.advancePercent}% to start and ${100 - policies.advancePercent}% after delivery.`,
    },
    {
      q: "Can you work with our existing software or hardware?",
      a: "Yes. We integrate with the tools, databases and devices you already use.",
    },
    {
      q: "Do you work with clients outside India?",
      a: `Yes, everything runs online. ${policies.internationalPayment}`,
    },
    {
      q: "What if I need changes?",
      a: `Each package includes ${policies.revisions} revisions. Bigger changes are quoted separately.`,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* CTA band & footer                                                   */
/* ------------------------------------------------------------------ */

export const ctaBand = {
  headingStart: "Deadline coming up?",
  headingItalic: "Let’s ship it.",
  subtext: "Send one message. You’ll have a fixed quote and a start date the same day.",
  buttonLabel: "Chat on WhatsApp",
  image: "/images/cta.jpg",
  imageAlt: "A team working together around laptops",
};

export const footer = {
  privacyLabel: "Privacy",
  blurb: "Custom software for businesses, founders and students. Built in India, shipped everywhere.",
  columns: {
    explore: "Explore",
    contact: "Contact",
  },
};

/* ------------------------------------------------------------------ */
/* /start page                                                         */
/* ------------------------------------------------------------------ */

export const startPage = {
  eyebrow: "Start a project",
  heading: "Build your project and see the price.",
  subtext: "Pick what you need, add extras, choose how fast. You see the estimate live, then send it to us on WhatsApp.",
  estimateLabel: "Your estimate",
  estimateEmptyPrice: "Pick what you need",
  estimateEmptyNote: "Choose what you need and the price shows up here.",
  builder: {
    headingStart: "Build your project,",
    headingItalic: "see the price.",
    step1: "What do you need?",
    step1Hint: "Pick who it is for, then the closest match.",
    step2: "Package and extras",
    step2Hint: "Add only what you need. You can change this later.",
    step3: "How fast?",
    step3Hint: "Standard is included. Faster delivery moves you up the queue.",
    step4: "Your details",
    step4Hint: "We reply on WhatsApp with the timeline and payment details.",
    otherTab: "Something else",
    otherTitle: "Something else",
    otherBody: "Not on the list? Describe your idea below and pick a rough budget. We will reply with a fixed quote.",
    packageLabel: "Package",
    extrasLabel: "Extras",
    fromLabel: "From",
    quoteLabel: "Custom quote",
    quoteNote: "Tell us about it and we reply with a fixed price, usually within a day.",
    speedIncluded: "Included",
    totalLabel: "Estimated total",
    perMonth: "per month",
    toStart: "to start",
    onDelivery: "On delivery",
    estimateNote: "This is an estimate. We confirm the final price on WhatsApp before you pay anything.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    budgetLabel: "Rough budget",
    budgetPlaceholder: "Choose a range",
    notesLabelCustom: "Describe your idea",
    notesPlaceholderCustom: "What should it do, who will use it, any app or site it should feel like",
    sendShort: "Send",
  },
  fields: {
    service: "What do you need?",
    name: "Your name",
    namePlaceholder: "Full name",
    phone: "WhatsApp number",
    phonePlaceholder: "+91",
    org: "College / company",
    orgPlaceholder: "Where you study or work",
    deadline: "Deadline",
    description: "Tell us about it",
    descriptionPlaceholder: "Topic, tech stack, features, anything your guide or client asked for",
    files: "Reference files",
    filesNote: "Got screenshots, documents or a sample? You can send files on WhatsApp after this.",
  },
  footnote: `${policies.advancePercent}% advance by UPI to start · balance on delivery`,
  submitLabel: "Send on WhatsApp",
  sendingLabel: "Opening WhatsApp...",
  errors: {
    service: "Pick what you need.",
    name: "Enter your name.",
    phone: "Enter a valid WhatsApp number (10 to 15 digits).",
    description: "Tell us a little about it (at least 10 characters).",
  },
  success: {
    heading: "Almost done. Hit send in WhatsApp.",
    body: "Your details are ready in the chat. If WhatsApp didn't open, use the button below.",
    retry: "Open WhatsApp",
    reset: "Edit details",
  },
  // First line of the WhatsApp message
  messageTitle: "New project request",
};

/* ------------------------------------------------------------------ */
/* Privacy page                                                        */
/* ------------------------------------------------------------------ */

export const privacyPage = {
  title: "Privacy policy",
  updated: "18 November 2026", // TODO: change when you edit the policy
  intro: "Short version: we only use your details to reply to you.",
  sections: [
    {
      heading: "What we collect",
      body: "When you fill in the project form or message us, we get your name, phone number, college or company, and the project details you share. Nothing else.",
    },
    {
      heading: "Why",
      body: "Only to reply to you, prepare your quote and deliver your project.",
    },
    {
      heading: "Sharing",
      body: "We never sell, rent or share your details with anyone.",
    },
    {
      heading: "Analytics",
      body: "We use Vercel Analytics to count page visits. It doesn't use cookies and doesn't identify you.",
    },
    {
      heading: "Deleting your data",
      body: "Message us on WhatsApp or email us and we'll delete your details.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 404 page                                                            */
/* ------------------------------------------------------------------ */

export const notFoundPage = {
  heading: "This page didn’t ship.",
  body: "The link may be broken, or the page has moved.",
  homeLabel: "Back to home",
};

/* ------------------------------------------------------------------ */
/* SEO                                                                 */
/* ------------------------------------------------------------------ */

export const seo = {
  title: "ShipKaro | You need it. We ship it.",
  description:
    "Custom software for any business or idea: management systems, apps, websites, automation and college projects. Fixed quotes, full source code handover, pay via UPI.",
  keywords: [
    "custom software development India",
    "gym management system",
    "PG hostel management software",
    "school ERP",
    "restaurant POS",
    "final year project",
    "portfolio website",
    "mobile app development",
  ],
};
