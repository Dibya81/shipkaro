import { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { AudienceSheet, ClosingSheet, IntroSheet, ProcessSheet } from "@/components/home/Sections";

// Each section sits in its own Suspense boundary. Nothing suspends (the HTML is
// identical), but React can hydrate the sections as separate small tasks instead
// of one long one, so the page answers taps sooner on slow phones.
export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense>
        <IntroSheet />
      </Suspense>
      <Suspense>
        <ProcessSheet />
      </Suspense>
      <Suspense>
        <AudienceSheet />
      </Suspense>
      <Suspense>
        <ClosingSheet />
      </Suspense>
    </>
  );
}
