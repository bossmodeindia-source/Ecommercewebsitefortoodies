import toodiesLogo from 'figma:asset/c561690211cdd59869b2af6c111db0bf09f362da.png';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-14 w-auto", alt = "Toodies" }: LogoProps) {
  return (
    <img
      src={toodiesLogo}
      alt={alt}
      className={className}
    />
  );
}