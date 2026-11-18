import Link from "next/link";
import { brand } from "@/config/site";

/** Logo mark + wordmark, linking home. The mark is public/logo.svg painted in the text colour. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2.5 text-fg"
      aria-label={`${brand.name} home`}
    >
      <span
        aria-hidden
        className="logo-mark h-[26px] w-[37px] shrink-0"
        style={{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }}
      />
      <span className="text-[1.2rem] font-semibold leading-none tracking-[-0.03em]">{brand.name}</span>
    </Link>
  );
}
