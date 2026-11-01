import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { site } from "@/config/site";
import { getMarketingImage } from "@/lib/marketing-images";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const authImage = getMarketingImage("auth");

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_.95fr]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-sidebar lg:block">
        <Image
          src={authImage}
          alt=""
          fill
          sizes="(max-width: 1024px) 0px, 52vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B2545]/95 via-[#0B2545]/55 to-[#0B2545]/15" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-16">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Building2 className="size-8" />
            <span className="text-xl font-bold tracking-tight">{site.name}</span>
          </Link>
          <div className="max-w-lg pb-8 text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-sky-100">
              Welcome home
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              A better way to find and manage your place.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
              {site.tagline}
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-white/85 hover:text-white">
            Back to {site.name}
          </Link>
        </div>
      </aside>
      <section className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:justify-center lg:px-12 xl:px-20">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-bold text-navy lg:hidden"
        >
          <Building2 className="size-6 text-primary" />
          {site.name}
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center lg:flex-none">
          {children}
        </div>
      </section>
    </main>
  );
}
