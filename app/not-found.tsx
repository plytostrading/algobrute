import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div>
        <p className="text-8xl font-bold text-muted-foreground/20 select-none">404</p>
        <h2 className="text-xl font-semibold mt-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Return to Command Center</Link>
      </Button>
    </div>
  );
}
