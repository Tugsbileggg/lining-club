import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";

// Static editable content. TODO(backend): source from Firestore `content/{slug}`
// so admin/staff can edit these without a deploy.
const PAGES: Record<string, { title: string; body: string[] }> = {
  shipping: {
    title: "Хүргэлт",
    body: [
      "Улаанбаатар хотод захиалгыг 1-2 хоногийн дотор хүргэнэ.",
      "Орон нутагт унаанд тавьж илгээх ба хүргэлтийн нөхцөлийг захиалга баталгаажсаны дараа холбогдон тохирно.",
      "Хүргэлттэй холбоотой асуудлыг " + siteConfig.contact.phone + " дугаараар лавлана уу.",
    ],
  },
  contact: {
    title: "Холбоо барих",
    body: [
      "Утас: " + siteConfig.contact.phone,
      "Хаяг: " + siteConfig.contact.address,
      "Facebook болон Instagram хуудсаар бидэнтэй холбогдоорой.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? "Хуудас" };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <div className="container-page max-w-2xl py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {page.title}
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {page.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
