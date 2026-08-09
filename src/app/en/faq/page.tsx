import type { Metadata } from "next";
import { FaqBody } from "../../faq/page";
import { SITE_URL, hreflangDe } from "@/lib/site";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en/` },
    { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/en/faq/` },
  ],
};

/* Debe coincidir palabra por palabra con las preguntas EN visibles en
   `FAQ.tsx` — copiadas de ahí, no traducidas de nuevo. */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the purchase status?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The demo is public and requires no sign-up or card. Core is planned at $149 and Pro at $249 until commercial delivery opens.",
      },
    },
    {
      "@type": "Question",
      name: "Are my data safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your data lives in a single .sqlite file on your machine. It never gets uploaded to any server: there is no server. You can encrypt the folder with BitLocker/VeraCrypt for an extra layer of security.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export your entire journal to CSV (for Excel or Google Sheets), PDF (ready-to-share reports), and JSON (full, re-importable backup). Your data is yours: take it with you whenever you want — no API to shut down, no server to turn off.",
      },
    },
    {
      "@type": "Question",
      name: "Does it work on Mac or Linux?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CountPips is a native Windows app (WinUI 3). On Mac or Linux you can run it through a Windows virtual machine or Parallels. We're actively exploring a local-first version for Mac and Linux — if you'd like early access, drop us a line.",
      },
    },
    {
      "@type": "Question",
      name: "Can I import from another journal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We support CSV import (flexible format with column mapping) and a dedicated importer for popular journals. If your current journal exports to CSV, you'll have it in your CountPips in less than 5 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "How is early access selected?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We review applications by profile and product phase, not by order of arrival. If it fits the private pilot, we will write with invitation steps.",
      },
    },
    {
      "@type": "Question",
      name: "What is ready and what is being validated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The demo, journal, metrics and risk journeys are ready to explore. The private pilot validates installation and workflow with real users; the product status page explains what is not promised yet.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Credit/debit card and PayPal. We issue VAT invoices where applicable.",
      },
    },
    {
      "@type": "Question",
      name: "Can I see the product before requesting access?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Explore the live demo with deterministic data, no signup and nothing to download. The desktop installer is delivered only to invited private-pilot participants.",
      },
    },
    {
      "@type": "Question",
      name: "What's the difference between Core and Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Core includes the full journal, 40+ metrics, 2 trading accounts, risk management, discipline, and basic PDF reports. Pro additionally unlocks unlimited accounts, prop firm mode, the Monte Carlo simulator, track record report, risk of ruin, advanced PDF reports, and the rival importer that migrates your old journal in 5 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "How will my data stay private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The app is designed local-first: trades live on your machine and the website never asks for credentials, capital, statements or financial data. The private pilot validates the workflow without exposing those data.",
      },
    },
    {
      "@type": "Question",
      name: "Will I be able to use it on multiple computers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The device policy will be defined before sales open. During the private pilot, invited participants receive installation instructions.",
      },
    },
    {
      "@type": "Question",
      name: "What if I change computers during the pilot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The CountPips team will provide the procedure to move your environment. We will not ask for credentials or financial data to do it.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "FAQ — questions before you install",
  description:
    "Frequently asked questions about CountPips: price, privacy, compatibility, import, updates and more.",
  alternates: {
    canonical: `${SITE_URL}/en/faq/`,
    languages: hreflangDe("/faq"),
  },
  openGraph: {
    title: "FAQ — CountPips",
    description: "Frequently asked questions about CountPips: price, privacy, compatibility and more.",
    url: `${SITE_URL}/en/faq/`,
    type: "website",
    siteName: "CountPips",
    locale: "en_US",
    alternateLocale: ["es_ES"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CountPips",
    description: "Frequently asked questions about CountPips: price, privacy, compatibility, import, updates and more.",
  },
};

export default function FaqEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqBody />
    </>
  );
}
