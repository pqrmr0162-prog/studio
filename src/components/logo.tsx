import { cn } from "@/lib/utils"

export function TigerLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-foreground", className)}
      aria-label="AeonAI Assistant Logo"
      {...props}
    >
      <title>AeonAI Assistant Logo</title>
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))"/>
      <path d="M2 17l10 5 10-5" stroke="hsl(var(--destructive))"/>
      <path d="M2 12l10 5 10-5" stroke="hsl(var(--foreground))"/>
    </svg>
  );
}
