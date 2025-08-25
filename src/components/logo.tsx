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
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="hsl(var(--primary))" />
      <path d="M22 12a10 10 0 0 0-10-10v10h10z" fill="hsl(var(--primary) / 0.5)" />
      <path d="M11.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="hsl(var(--primary-foreground))" />
      <path d="M16.5 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="hsl(var(--primary-foreground))" />
      <path d="M14 14a2 2 0 1 0-4 0" />
      <path d="M4.5 15.5s1.5-2 3-2 3.5 2 3.5 2" />
      <path d="M16.5 15.5s-1.5-2-3-2-3.5 2-3.5 2" />
    </svg>
  );
}
