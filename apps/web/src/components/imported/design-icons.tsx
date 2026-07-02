import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function IconBase({ children, className, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function ShoppingCart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6h15l-2 9H8L6 3H3" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </IconBase>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function Shield(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </IconBase>
  );
}

export function Truck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </IconBase>
  );
}

export function RefreshCw(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M6 9a7 7 0 0 1 11.5-2.5L20 11" />
      <path d="M18 15a7 7 0 0 1-11.5 2.5L4 13" />
    </IconBase>
  );
}

export function BadgeCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </IconBase>
  );
}

export function Menu(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

export function X(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function Heart(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.8 7.8c0 5.2-8.8 10.2-8.8 10.2S3.2 13 3.2 7.8A4.4 4.4 0 0 1 11 5a4.4 4.4 0 0 1 9.8 2.8Z" />
    </IconBase>
  );
}

export function Package(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5" />
      <path d="M12 12v9" />
    </IconBase>
  );
}

export function Star(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9L12 3Z" />
    </IconBase>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 18 6-6-6-6" />
    </IconBase>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function LayoutDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v4h-7z" />
      <path d="M13 10h7v10h-7z" />
      <path d="M4 13h7v7H4z" />
    </IconBase>
  );
}

export function Users(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c1-4 11-4 12 0" />
      <path d="M16 11a3 3 0 0 0 0-6" />
      <path d="M18 20c.8-2.5-.2-4.2-2-5" />
    </IconBase>
  );
}

export function ShoppingBag(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </IconBase>
  );
}

export function Tag(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12V5h7l9 9-7 7-9-9Z" />
      <circle cx="8" cy="8" r="1" />
    </IconBase>
  );
}

export function FileText(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M15 3v4h4" />
    </IconBase>
  );
}

export function MessageSquare(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 5h14v10H8l-3 4V5Z" />
    </IconBase>
  );
}

export function Settings(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.9 4.9 2.8 2.8" />
      <path d="m16.3 16.3 2.8 2.8" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </IconBase>
  );
}

export function Bell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function TrendingUp(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </IconBase>
  );
}

export function AlertTriangle(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export function CheckCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </IconBase>
  );
}

export function XCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6" />
      <path d="m15 9-6 6" />
    </IconBase>
  );
}

export function Eye(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function Trash2(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </IconBase>
  );
}

export function Filter(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
    </IconBase>
  );
}

export function MoreHorizontal(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </IconBase>
  );
}

export function Clock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function CircleDollarSign(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5" />
    </IconBase>
  );
}

export function BarChart2(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 20V10" />
      <path d="M12 20V4" />
      <path d="M18 20v-7" />
    </IconBase>
  );
}

export function AlertCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </IconBase>
  );
}

export function LogOut(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M13 4h6v16h-6" />
    </IconBase>
  );
}
