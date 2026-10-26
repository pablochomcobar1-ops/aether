import Button from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70dvh] max-w-screen-md flex-col justify-center px-4 pb-24 pt-32">
      <p className="font-mono text-sm text-mute">404</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight md:text-8xl">
        Wrong turn
      </h1>
      <p className="mt-6 max-w-md text-mute">
        This page doesn&apos;t exist, or the shoe on it is no longer in the collection.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button href="/shop">Shop all shoes</Button>
        <Button href="/" variant="outline">
          Back to home
        </Button>
      </div>
    </section>
  );
}
