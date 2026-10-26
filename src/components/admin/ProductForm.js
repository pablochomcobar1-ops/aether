"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LINES } from "@/lib/constants";
import { saveProduct } from "@/app/admin/products/actions";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ProductImage from "@/components/product/ProductImage";

const SIDE_OPTIONS = [
  { value: "sport", label: "Sport" },
  { value: "atelier", label: "Atelier" },
];
const LINE_LABELS = { run: "Run", court: "Court", street: "Street", "old-money": "Old Money", classic: "Classic", formal: "Formal" };
const IMAGE_PATH = /^\/images\/products\/[a-z0-9-]+\.(webp|jpe?g|png|avif)$/;

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function TextArea({ label, hint, error, rows = 4, ...props }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block font-display text-xs uppercase tracking-[0.18em] text-mute">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-note`}
        className={`mt-2 block w-full resize-y border bg-transparent px-4 py-3 text-base leading-relaxed text-bone outline-none transition-colors duration-200 focus:border-bone ${
          error ? "border-danger" : "border-line hover:border-mute"
        }`}
        {...props}
      />
      <p id={`${id}-note`} className={`mt-2 text-sm ${error ? "text-[#f87171]" : "text-mute"}`}>
        {error || hint}
      </p>
    </div>
  );
}

function Check({ label, hint, ...props }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-1 size-5 accent-[#fafafa]" {...props} />
      <span>
        <span className="block">{label}</span>
        <span className="block text-sm text-mute">{hint}</span>
      </span>
    </label>
  );
}

const fromProduct = (p) => ({
  name: p?.name ?? "",
  slug: p?.slug ?? "",
  side: p?.side ?? "sport",
  line: p?.line ?? "",
  price: p ? String(p.price / 100) : "",
  colorway: p?.colorway ?? "",
  description: p?.description ?? "",
  details: (p?.details ?? []).join("\n"),
  images: (p?.images ?? []).join("\n"),
  featured: p?.featured ?? false,
  active: p?.active ?? false,
});

export default function ProductForm({ product }) {
  const router = useRouter();
  const isNew = !product;
  const [values, setValues] = useState(() => fromProduct(product));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();

  function set(name, value) {
    setValues((v) => {
      const next = { ...v, [name]: value };
      if (name === "name" && !slugTouched) next.slug = slugify(value);
      if (name === "side" && !LINES[value].includes(v.line)) next.line = "";
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    setMessage(null);
  }

  const text = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    disabled: pending,
    onChange: (e) => set(name, e.target.value),
  });

  function submit(event) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveProduct(product ? String(product._id) : null, values);
      if (!result.ok) {
        setErrors(result.fields ?? {});
        setMessage({ tone: "error", text: result.error });
        requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
        return;
      }
      setErrors({});
      if (isNew) {
        router.push(`/admin/products/${result.product.id}?created=1`);
      } else {
        setMessage({ tone: "ok", text: "Saved. The store shows the change now." });
        router.refresh();
      }
    });
  }

  const previews = values.images.split("\n").map((s) => s.trim()).filter((s) => IMAGE_PATH.test(s));

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Name" {...text("name")} />
        <Field
          label="Slug (web address)"
          hint={`/product/${values.slug || "…"}`}
          spellCheck={false}
          {...text("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Select label="Side" options={SIDE_OPTIONS} {...text("side")} />
        <Select
          label="Collection"
          placeholder="Choose a collection"
          options={LINES[values.side].map((value) => ({ value, label: LINE_LABELS[value] }))}
          {...text("line")}
        />
        <Field
          label="Price (₹, GST included)"
          inputMode="numeric"
          placeholder="9499"
          hint={values.side === "sport" ? "Sport: ₹3,000 to ₹12,000" : "Atelier: ₹6,000 to ₹20,000"}
          {...text("price")}
        />
      </div>

      <Field label="Colourway (optional)" placeholder="White / Obsidian / Ember" {...text("colorway")} />
      <TextArea label="Description" rows={4} hint="Two or three sentences for the product page." {...text("description")} />
      <TextArea label="Details" rows={4} hint="One per line. Up to 8." {...text("details")} />
      <div>
        <TextArea
          label="Images"
          rows={4}
          hint="One path per line, first one is the main photo. Put the files in public/images/products/."
          spellCheck={false}
          {...text("images")}
        />
        {previews.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-3" aria-label="Image previews">
            {previews.map((src) => (
              <li key={src} className="relative size-20 overflow-hidden border border-line bg-carbon">
                <ProductImage src={src} alt="" name="" sizes="80px" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-display text-xs uppercase tracking-[0.18em] text-mute">Visibility</legend>
        <Check
          label="Live in the store"
          hint={isNew ? "Leave this off until stock is set." : "Off hides it from the shop and its page."}
          checked={values.active}
          disabled={pending}
          onChange={(e) => set("active", e.target.checked)}
        />
        <Check
          label="Featured"
          hint="Shown first on its side's landing page."
          checked={values.featured}
          disabled={pending}
          onChange={(e) => set("featured", e.target.checked)}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-6 border-t border-line pt-8">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </Button>
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-[#f87171]" : "text-success"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
