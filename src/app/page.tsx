import { Hero } from "@/components/home/Hero";
import { BuildGrid, CapabilityStrip, CtaBand, Faq, Process } from "@/components/home/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CapabilityStrip />
      <BuildGrid />
      <Process />
      <Faq />
      <CtaBand />
    </>
  );
}
