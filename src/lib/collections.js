export const SIDE_INFO = {
  sport: {
    title: "Built for speed",
    blurb: "Trainers, high-tops and everyday sneakers, built to be worn hard.",
    model: "vapor",
  },
  atelier: {
    title: "Quiet authority",
    blurb: "Loafers, Chelsea boots and leather sneakers, made to last for years.",
    model: "chelsea",
  },
};

export const CHAPTERS = [
  {
    id: "sport",
    label: "Sport",
    title: "Built for speed",
    blurb: "Our signature runner: a chunky white sole, a clean upper and the AETHER mark on the heel.",
    model: "vapor",
    mood: "sport",
    href: "/sport",
    cta: "Shop Sport",
  },
  {
    id: "street",
    label: "Street",
    title: "AE-05 Hi-Top",
    blurb: "A high-top built for the street, with a padded collar and a grippy cupsole.",
    model: "hitop",
    mood: "sport",
    href: "/shop?side=sport&line=street",
    cta: "Shop Street",
  },
  {
    id: "atelier",
    label: "Atelier",
    title: "Quiet authority",
    blurb: "Loafers, Chelsea boots and leather sneakers, made to last for years.",
    model: "chelsea",
    mood: "atelier",
    href: "/atelier",
    cta: "Shop Atelier",
  },
];

export const COLLECTIONS = [
  { side: "sport", line: "run", label: "Run", blurb: "Daily trainers with soft, springy cushioning. Ready for the 10K." },
  { side: "sport", line: "court", label: "Court", blurb: "High-tops and mids that grip hard courts and hard streets." },
  { side: "sport", line: "street", label: "Street", blurb: "Clean low-tops for every day. The pairs you'll wear most." },
  { side: "atelier", line: "old-money", label: "Old Money", blurb: "Suede and polished leather loafers. Socks optional." },
  { side: "atelier", line: "classic", label: "Classic", blurb: "White leather sneakers and Chelsea boots that go with everything." },
  { side: "atelier", line: "formal", label: "Formal", blurb: "Polished Chelsea boots for interviews, weddings and boardrooms." },
];

export const collectionsFor = (side) => COLLECTIONS.filter((c) => c.side === side);
