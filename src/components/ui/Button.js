import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-[0.12em] " +
  "transition-[transform,background-color,color,border-color] duration-200 ease-out " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants = {
  solid: "bg-bone text-ink hover:bg-mute",
  outline: "border border-bone text-bone hover:bg-bone hover:text-ink",
  link: "text-bone underline decoration-1 underline-offset-[0.35em] hover:decoration-2",
};

const sizes = {
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-14 px-9 text-base",
};

export default function Button({ href, variant = "solid", size = "md", className = "", ...props }) {
  const classes = `${base} ${variants[variant]} ${variant === "link" ? "min-h-11" : sizes[size]} ${className}`;
  if (href) return <Link href={href} className={classes} {...props} />;
  return <button type="button" className={classes} {...props} />;
}
