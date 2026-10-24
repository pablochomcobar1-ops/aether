export const metadata = {
  title: "Size guide",
  description: "Find your AETHER size: UK, EU and US sizes with foot length in centimetres.",
};

const ROWS = [
  [6, "39.5", 7, "24.5"],
  [7, "40.5", 8, "25.4"],
  [8, "42", 9, "26.2"],
  [9, "43", 10, "27.1"],
  [10, "44.5", 11, "27.9"],
  [11, "45.5", 12, "28.8"],
  [12, "47", 13, "29.6"],
];

const STEPS = [
  "Stand on a sheet of paper with your heel against a wall.",
  "Mark the tip of your longest toe, then measure from the wall to the mark in centimetres.",
  "Measure both feet in the evening, when they're at their largest, and use the longer one.",
  "Find the row whose foot length is closest to yours. Between two sizes? Go up for Sport, true to size for Atelier leather, which softens with wear.",
];

export default function SizeGuidePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:pt-36">
      <h1 className="font-display text-6xl font-bold uppercase tracking-tight md:text-7xl">Size guide</h1>
      <p className="mt-4 text-mute">AETHER shoes use UK sizes. Fit can vary slightly between styles.</p>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left tabular-nums">
          <caption className="sr-only">AETHER size conversion chart</caption>
          <thead>
            <tr className="border-b border-bone font-display text-sm uppercase tracking-[0.12em]">
              {["UK", "EU", "US", "Foot length (cm)"].map((h) => (
                <th key={h} scope="col" className="py-3 pr-6 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([uk, eu, us, cm]) => (
              <tr key={uk} className="border-b border-line">
                <th scope="row" className="py-4 pr-6 font-display text-lg font-normal">
                  {uk}
                </th>
                <td className="py-4 pr-6">{eu}</td>
                <td className="py-4 pr-6">{us}</td>
                <td className="py-4 pr-6">{cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-16 font-display text-3xl uppercase tracking-tight">How to measure</h2>
      <ol className="mt-6 space-y-4">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="font-display text-mute tabular-nums">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
