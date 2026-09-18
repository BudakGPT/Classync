import { redirect } from "next/navigation";
import { EyeOff, Hand, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { signInAction } from "@/actions/auth";
import { Button, Card, DiscordGlyph, IconTile, Logo } from "@/components/ui";

const POINTS = [
  { icon: EyeOff, text: "A student's private status is visible only to that student." },
  { icon: ShieldCheck, text: "Counts appear only once five or more students report the same concept." },
  { icon: Hand, text: "A name reaches you only when a student explicitly requests TA help." },
];

/** W1: Sign in with Discord. Signed-in users go straight to their server list. */
export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/guilds");

  return (
    <main className="hero-gradient flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <Logo />
        <h1 className="mt-6 text-[24px] font-extrabold leading-tight tracking-tight text-ink">TA dashboard</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">
          See what your class is stuck on, answer once, and let the bot deliver it to everyone who asked.
        </p>
        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-3 text-[13px] leading-snug text-ink-2">
              <IconTile icon={p.icon} tone="emerald" size="sm" />
              <span className="pt-1">{p.text}</span>
            </li>
          ))}
        </ul>
        <form action={signInAction} className="mt-8">
          <Button type="submit" variant="discord" size="lg" className="w-full">
            <DiscordGlyph className="size-5" />
            Sign in with Discord
          </Button>
        </form>
        <p className="mt-3 text-center text-xs text-ink-3">Only servers where you are a registered TA will appear.</p>
      </Card>
    </main>
  );
}
