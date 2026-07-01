import Image from "next/image";

interface ParsuLogoProps {
  size?: number;
  className?: string;
}

export function ParsuLogo({ size = 32, className }: ParsuLogoProps) {
  return (
    <Image
      src="/logo/parsu-logo.png"
      alt="Partido State University logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
