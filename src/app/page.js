import Button from "@/components/ui/Button";
import MagneticButton from "@/components/ui/MagneticButton";

export default function Home() {
  return (
    <>
      <section className="grid min-h-dvh place-items-center px-6">
        <div className="text-center">
          <h1 className="font-display text-6xl font-bold uppercase tracking-tight md:text-8xl">Aether</h1>
          <p className="mt-6 text-mute">Sport and Atelier open soon.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton>
              <Button href="/sport" size="lg">Shop Sport</Button>
            </MagneticButton>
            <MagneticButton>
              <Button href="/atelier" variant="outline" size="lg">Shop Atelier</Button>
            </MagneticButton>
          </div>
        </div>
      </section>
      <section className="grid min-h-dvh place-items-center border-t border-line px-6">
        <p className="font-display text-4xl font-light uppercase tracking-wide text-mute">Scroll test</p>
      </section>
    </>
  );
}
