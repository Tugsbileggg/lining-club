import Link from "next/link";
import { Facebook, Instagram, Phone } from "lucide-react";
import { footerNav, siteConfig } from "@/config/site";
import { getSettings } from "@/services/settings";

export async function Footer() {
  const settings = await getSettings();
  const phone = settings.contact.phone || siteConfig.contact.phone;
  const address = settings.contact.address || siteConfig.contact.address;
  const facebook = settings.contact.facebook || siteConfig.contact.facebook;
  const instagram = settings.contact.instagram || siteConfig.contact.instagram;

  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-base font-semibold uppercase tracking-tight">
            {siteConfig.name}
          </h3>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {address}. Чанартай пүүз, гутал, нэмэлт хэрэгслүүд.
          </p>
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-semibold">Холбоо барих</h4>
          <a
            href={`tel:${phone}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="size-4" />
            {phone}
          </a>
          <div className="mt-4 flex gap-3">
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Facebook className="size-5" />
              </a>
            )}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="size-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>
          <p>Улаанбаатар, Монгол</p>
        </div>
      </div>
    </footer>
  );
}
