import { Hero } from "@/components/home/Hero";
import { AudienceSheet, ClosingSheet, IntroSheet, ProcessSheet } from "@/components/home/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSheet />
      <ProcessSheet />
      <AudienceSheet />
      <ClosingSheet />
    </>
  );
}
