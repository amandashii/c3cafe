import { cn } from '@/lib/utils';
import goosePng from '@/assets/goose.png';

interface GooseProps {
  className?: string;
  size?: number;
}

export function Goose({ className, size = 32 }: GooseProps) {
  return (
    <img
      src={goosePng}
      alt="C3 Cafe goose mascot"
      width={size}
      height={size}
      className={cn('flex-shrink-0 object-contain', className)}
    />
  );
}

export function GooseLarge({ className }: { className?: string }) {
  return (
    <img
      src={goosePng}
      alt=""
      aria-hidden="true"
      className={cn('object-contain', className)}
      style={{ width: 120, height: 120 }}
    />
  );
}
