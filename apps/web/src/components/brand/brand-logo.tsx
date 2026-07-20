type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  textClassName?: string;
};

export function BrandLogo({
  className = "",
  markClassName = "h-9 w-9",
  subtitle,
  subtitleClassName = "text-slate-500",
  textClassName = "text-slate-950",
}: BrandLogoProps) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <img
        alt=""
        aria-hidden="true"
        className={`${markClassName} flex-shrink-0 rounded-xl`}
        src="/brand/marketo-favicon.svg"
      />
      <span className="min-w-0 leading-none">
        <span className={`block truncate text-lg font-black tracking-tight ${textClassName}`}>
          Marketo
        </span>
        {subtitle ? (
          <span className={`mt-1 block truncate text-[10px] font-bold uppercase tracking-wider ${subtitleClassName}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}