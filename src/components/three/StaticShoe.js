import Image from "next/image";
import { MODELS } from "./models";

export default function StaticShoe({ model, priority = false }) {
  const config = MODELS[model];
  if (!config) return null;
  return (
    <Image
      src={config.still}
      alt=""
      fill
      priority={priority}
      sizes="(min-width: 768px) 50vw, 100vw"
      className="object-contain"
    />
  );
}
