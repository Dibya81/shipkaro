/**
 * ShipKaro price list
 * ---------------------------------------------------------------
 * Everything the /start project builder shows: what people can pick, the
 * starting price of each item, the optional extras, and delivery speeds.
 * All prices are in Indian rupees, whole numbers (3999 = ₹3,999).
 *
 * Change a number here, save, and the builder and the estimate update.
 * The builder always says "estimate": the final price is confirmed on WhatsApp.
 */

export type Addon = {
  id: string;
  label: string;
  price: number;
  /** Set for things billed every month instead of once */
  recurring?: "month";
};

export type Variant = { id: string; label: string; price: number; note?: string };

export type CatalogItem = {
  /** Same slug as the services list in site.ts, so homepage links preselect it */
  slug: string;
  title: string;
  summary: string;
  /** Typical delivery time shown to the visitor */
  days: string;
  /** Pick-one options with their own base price. When absent, `price` is the base. */
  variants?: Variant[];
  price?: number;
  /** No fixed price, always quoted after a chat */
  quoteOnly?: boolean;
  addons: Addon[];
  /** Also offer the shared software extras (apps, payments, WhatsApp alerts...) */
  softwareExtras?: boolean;
};

export type Category = { id: string; title: string; blurb: string; items: CatalogItem[] };

/** Shared extras for management systems, apps and products */
export const softwareExtras: Addon[] = [
  { id: "android-app", label: "Android app for your customers or staff", price: 19999 },
  { id: "whatsapp-alerts", label: "Automatic WhatsApp / SMS reminders", price: 4999 },
  { id: "online-payments", label: "Online payments (UPI, cards via Razorpay)", price: 4999 },
  { id: "staff-logins", label: "Staff logins with roles and permissions", price: 2999 },
  { id: "data-import", label: "Import your existing Excel / register data", price: 2999 },
  { id: "hosting-year", label: "Hosting, domain and SSL set up for 1 year", price: 3999 },
  { id: "maintenance", label: "Maintenance and support", price: 1999, recurring: "month" },
];

export const categories: Category[] = [
  {
    id: "students",
    title: "Students",
    blurb: "Projects, portfolios and resumes",
    items: [
      {
        slug: "major-minor-projects",
        title: "College project",
        summary: "Working project with source code and a walkthrough you can explain in the viva.",
        days: "5 to 15 days",
        variants: [
          { id: "minor", label: "Minor project", price: 3999 },
          { id: "major", label: "Major / final-year project", price: 7999 },
        ],
        addons: [
          { id: "report", label: "Project report and PPT", price: 999 },
          { id: "viva", label: "One-on-one viva prep call", price: 499 },
          { id: "paper", label: "Research paper in IEEE format", price: 1499 },
          { id: "deploy", label: "Live online deployment", price: 799 },
        ],
      },
      {
        slug: "portfolio-websites",
        title: "Portfolio website",
        summary: "A fast personal site that shows your work, skills and resume.",
        days: "3 to 5 days",
        price: 1999,
        addons: [
          { id: "domain", label: "Custom domain set up (yourname.com)", price: 499 },
          { id: "blog", label: "Blog section", price: 999 },
          { id: "contact", label: "Contact form to your email", price: 299 },
          { id: "page", label: "Each extra page", price: 399 },
        ],
      },
      {
        slug: "resumes",
        title: "Resume",
        summary: "ATS-friendly resume written from your details, in an editable file.",
        days: "1 to 2 days",
        price: 499,
        addons: [
          { id: "cover", label: "Cover letter", price: 299 },
          { id: "linkedin", label: "LinkedIn profile rewrite", price: 599 },
          { id: "version", label: "Extra version for another role", price: 199 },
        ],
      },
    ],
  },
  {
    id: "professionals",
    title: "Professionals",
    blurb: "Doctors, lawyers, CAs, coaches, creators",
    items: [
      {
        slug: "business-websites",
        title: "Business website",
        summary: "A professional site that brings in enquiries, with up to 5 pages.",
        days: "7 to 10 days",
        price: 7999,
        addons: [
          { id: "booking", label: "Online booking form", price: 2999 },
          { id: "seo", label: "Google search and Maps set up", price: 1999 },
          { id: "blog", label: "Blog with admin panel", price: 1499 },
          { id: "multilingual", label: "Hindi or regional language version", price: 2499 },
          { id: "page", label: "Each extra page", price: 999 },
        ],
      },
      {
        slug: "booking-appointments",
        title: "Booking & appointments",
        summary: "Clients pick a slot, pay if needed, and get reminders automatically.",
        days: "2 to 3 weeks",
        price: 14999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "clinic-hospital-software",
        title: "Clinic software",
        summary: "Appointments, patient records, prescriptions and billing in one place.",
        days: "3 to 5 weeks",
        price: 29999,
        addons: [],
        softwareExtras: true,
      },
    ],
  },
  {
    id: "businesses",
    title: "Local businesses",
    blurb: "Gyms, PGs, cafes, shops, coaching centres",
    items: [
      {
        slug: "gym-fitness-management",
        title: "Gym management",
        summary: "Members, plans, attendance, renewals and fee reminders.",
        days: "2 to 4 weeks",
        price: 19999,
        addons: [{ id: "biometric", label: "Biometric attendance device link-up", price: 4999 }],
        softwareExtras: true,
      },
      {
        slug: "pg-hostel-management",
        title: "PG & hostel management",
        summary: "Rooms, beds, tenants, rent collection and dues.",
        days: "2 to 4 weeks",
        price: 19999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "restaurant-cafe-pos",
        title: "Restaurant & cafe POS",
        summary: "Orders, tables, kitchen tickets, billing and daily sales.",
        days: "3 to 4 weeks",
        price: 24999,
        addons: [{ id: "qr-menu", label: "QR code menu with ordering", price: 3999 }],
        softwareExtras: true,
      },
      {
        slug: "inventory-billing",
        title: "Inventory & GST billing",
        summary: "Stock, suppliers, GST invoices and low-stock alerts.",
        days: "2 to 4 weeks",
        price: 19999,
        addons: [{ id: "barcode", label: "Barcode scanner and label printing", price: 2999 }],
        softwareExtras: true,
      },
      {
        slug: "school-coaching-erp",
        title: "School & coaching ERP",
        summary: "Students, batches, fees, attendance and results.",
        days: "4 to 6 weeks",
        price: 29999,
        addons: [{ id: "parent-app", label: "Parent login to see fees and results", price: 4999 }],
        softwareExtras: true,
      },
    ],
  },
  {
    id: "companies",
    title: "Companies",
    blurb: "Internal tools, automation, integrations",
    items: [
      {
        slug: "crm-sales",
        title: "CRM & sales pipeline",
        summary: "Leads, follow-ups, deal stages and team targets.",
        days: "3 to 5 weeks",
        price: 29999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "hr-payroll",
        title: "HR & payroll",
        summary: "Staff records, attendance, leave and salary slips.",
        days: "4 to 6 weeks",
        price: 34999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "dashboards-analytics",
        title: "Dashboard & reports",
        summary: "All your business numbers in one live view, from the tools you already use.",
        days: "2 to 4 weeks",
        price: 24999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "ai-chatbots-automation",
        title: "AI chatbot & automation",
        summary: "WhatsApp or website bots and automated workflows that save hours.",
        days: "2 to 3 weeks",
        price: 14999,
        addons: [{ id: "training", label: "Trained on your documents and FAQs", price: 4999 }],
      },
      {
        slug: "hardware-system-integration",
        title: "Hardware & system integration",
        summary: "Connect biometric, POS, IoT or legacy systems to your software.",
        days: "Depends on the hardware",
        quoteOnly: true,
        addons: [],
      },
    ],
  },
  {
    id: "founders",
    title: "Founders",
    blurb: "Products ready for paying users",
    items: [
      {
        slug: "ecommerce-store",
        title: "E-commerce store",
        summary: "Catalogue, cart, payments, orders and delivery tracking.",
        days: "3 to 5 weeks",
        price: 24999,
        addons: [],
        softwareExtras: true,
      },
      {
        slug: "mobile-apps",
        title: "Mobile app",
        summary: "Android and iOS app with an admin panel to manage it.",
        days: "5 to 8 weeks",
        price: 49999,
        addons: [{ id: "ios", label: "iOS App Store publishing", price: 9999 }],
        softwareExtras: true,
      },
      {
        slug: "saas-products",
        title: "SaaS product",
        summary: "Sign-ups, subscriptions, a dashboard and an admin panel. Your MVP, live.",
        days: "6 to 10 weeks",
        price: 74999,
        addons: [{ id: "landing", label: "Marketing landing page", price: 7999 }],
        softwareExtras: true,
      },
    ],
  },
  {
    id: "makers",
    title: "Hardware, 3D & games",
    blurb: "IoT, electronics, 3D models and games",
    items: [
      {
        slug: "iot-projects",
        title: "IoT project",
        summary: "Sensors and ESP32, Arduino or Raspberry Pi, with a live app or dashboard to watch and control it.",
        days: "1 to 4 weeks",
        variants: [
          { id: "basic", label: "Basic IoT project (first and second year)", price: 999 },
          { id: "student", label: "Final-year IoT project", price: 2999 },
          { id: "product", label: "Smart device or prototype for a business", price: 7999 },
        ],
        addons: [
          { id: "app", label: "Mobile app to control the device", price: 2999 },
          { id: "cloud", label: "Cloud dashboard with live data and alerts", price: 1499 },
          { id: "enclosure", label: "Custom 3D-printed enclosure", price: 999 },
          { id: "report", label: "Project report and PPT", price: 499 },
        ],
      },
      {
        slug: "hardware-projects",
        title: "Hardware & electronics",
        summary: "Circuits, embedded firmware, robotics and automation, built and tested on real hardware.",
        days: "2 to 6 weeks",
        variants: [
          { id: "basic", label: "Basic circuit or mini project", price: 999 },
          { id: "student", label: "Final-year hardware or robotics project", price: 3499 },
          { id: "custom", label: "Custom device or machine automation", price: 9999 },
        ],
        addons: [
          { id: "pcb", label: "Custom PCB design", price: 1499 },
          { id: "ota", label: "Remote firmware updates over Wi-Fi", price: 999 },
          { id: "report", label: "Project report and PPT", price: 499 },
        ],
      },
      {
        slug: "3d-modelling",
        title: "3D models",
        summary: "Product, character and architecture models, ready for 3D printing, renders, AR or games.",
        days: "3 to 10 days",
        variants: [
          { id: "object", label: "Simple object or part", price: 499 },
          { id: "detailed", label: "Detailed product or character", price: 1999 },
          { id: "architecture", label: "Building or interior with walkthrough", price: 3999 },
        ],
        addons: [
          { id: "render", label: "Textures and photoreal renders", price: 499 },
          { id: "rig", label: "Rigging and animation", price: 1499 },
          { id: "ar", label: "View it in AR on a phone", price: 999 },
        ],
      },
      {
        slug: "3d-web-experiences",
        title: "3D website & product viewer",
        summary: "Interactive 3D on the web: product configurators, 360° viewers and immersive landing pages.",
        days: "2 to 4 weeks",
        price: 4999,
        addons: [
          { id: "models", label: "We create the 3D models too", price: 1999 },
          { id: "ar", label: "View in AR on a phone", price: 1499 },
          { id: "configurator", label: "Colour and option configurator", price: 1499 },
        ],
      },
      {
        slug: "game-development",
        title: "Game",
        summary: "2D and 3D games for Android, PC and the web, built in Unity, Unreal or Godot.",
        days: "2 to 10 weeks",
        variants: [
          { id: "basic", label: "Simple game (first and second year)", price: 999 },
          { id: "student", label: "Final-year game project", price: 2999 },
          { id: "2d", label: "2D game", price: 5999 },
          { id: "3d", label: "3D game", price: 14999 },
        ],
        addons: [
          { id: "multiplayer", label: "Online multiplayer", price: 4999 },
          { id: "monetise", label: "Ads and in-app purchases", price: 1499 },
          { id: "publish", label: "Play Store publishing", price: 999 },
          { id: "level", label: "Each extra level", price: 799 },
        ],
      },
    ],
  },
];

/** Delivery speed. The multiplier applies to one-time costs only. */
export const speeds = [
  { id: "standard", label: "Standard", note: "Usual timeline", multiplier: 1 },
  { id: "priority", label: "Priority", note: "About 30% faster", multiplier: 1.2 },
  { id: "rush", label: "Rush", note: "Our fastest, we clear the queue", multiplier: 1.4 },
] as const;

export type SpeedId = (typeof speeds)[number]["id"];

/** Budget ranges offered when someone wants something that is not on the list */
export const budgetRanges = [
  "Under ₹5,000",
  "₹5,000 to ₹20,000",
  "₹20,000 to ₹50,000",
  "₹50,000 to ₹1,00,000",
  "Above ₹1,00,000",
  "Not sure yet",
];

export const catalog: CatalogItem[] = categories.flatMap((c) => c.items);

export function findItem(slug: string | null | undefined) {
  return catalog.find((i) => i.slug === slug);
}

export function categoryOf(slug: string) {
  return categories.find((c) => c.items.some((i) => i.slug === slug));
}

export function addonsFor(item: CatalogItem): Addon[] {
  return item.softwareExtras ? [...item.addons, ...softwareExtras] : item.addons;
}

/** Lowest base price of an item, for "From ₹..." labels */
export function startingPrice(item: CatalogItem): number | null {
  if (item.quoteOnly) return null;
  if (item.variants?.length) return Math.min(...item.variants.map((v) => v.price));
  return item.price ?? null;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function formatINR(n: number) {
  return inr.format(Math.round(n));
}
