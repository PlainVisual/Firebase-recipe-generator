import { Leaf } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity" aria-label="FridgeFeast Home">
      <Leaf size={36} strokeWidth={2} className="text-accent" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        FridgeFeast
      </h1>
    </Link>
  );
}
