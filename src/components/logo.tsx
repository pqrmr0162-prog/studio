import { cn } from "@/lib/utils"

export function CrowLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
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
        <path d="M16.5 3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" fill="hsl(var(--primary))"/>
        <path d="M8.5 7.5a1.5 1.5 0 1 0-3-1 1.5 1.5 0 0 0 3 1Z" fill="hsl(var(--primary-foreground))" stroke="hsl(var(--primary-foreground))"/>
        <path d="M14.5 9c0 3.5 2 7 5.5 7.5" />
        <path d="M5 21c0-4 2-6.5 4-8" />
        <path d="M11 8c0 5.5-3 12-8 12" />
    </svg>
  );
}
