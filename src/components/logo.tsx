import { cn } from "@/lib/utils"

export function AeonLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("text-primary", className)}
      aria-label="AeonAI Logo"
      {...props}
    >
      <title>AeonAI Logo</title>
      <path d="M14.46 23.32L4.68 13.54a1.2 1.2 0 0 1 0-1.7l9.78-9.78a1.2 1.2 0 0 1 1.7 0l3.47 3.47a1.2 1.2 0 0 1 0 1.7L9.83 12l9.8 9.8a1.2 1.2 0 0 1 0 1.7l-3.47 3.47a1.2 1.2 0 0 1-1.7 0Z"/>
      <path d="M9.54 23.32L.68 14.46a1.2 1.2 0 0 1 0-1.7L13.54.68a1.2 1.2 0 0 1 1.7 0l3.47 3.47a1.2 1.2 0 0 1 0 1.7L8.83 15.73l9.88 9.88a1.2 1.2 0 0 1 0 1.7l-3.47 3.47a1.2 1.2 0 0 1-1.7 0Z"/>
    </svg>
  );
}

export function CrowLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("text-primary", className)}
      aria-label="AeonAI Assistant Logo"
      {...props}
    >
        <title>AeonAI Assistant Logo</title>
        <path d="M18.73,3.48a1,1,0,0,0-1,.12L12,8.44,6.27,3.6A1,1,0,0,0,5.12,3.4L4.88,3.48a1,1,0,0,0-.73.79l-.16,1a1,1,0,0,0,.3.92L9,10.15,6.58,13.2a1,1,0,0,0-.3.73L6,15.2a1,1,0,0,0,1.14.93l1.19-.36a1,1,0,0,0,.69-.66l2.16-5.18,5.43,4.15a1,1,0,0,0,1.17.09l.2-.09a1,1,0,0,0,.58-.82l.06-1.27a1,1,0,0,0-.3-.73L15.08,9.3l3.52-3.66a1,1,0,0,0,.3-.92l-.16-1A1,1,0,0,0,18.73,3.48Z"/>
    </svg>
  );
}
