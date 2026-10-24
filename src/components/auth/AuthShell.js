export default function AuthShell({ title, intro, children }) {
  return (
    <section className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 pb-16 pt-28">
      <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-6xl">{title}</h1>
      {intro && <p className="mt-4 text-mute">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}
