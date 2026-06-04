import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Захиалга хянах" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="container-page py-14">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Захиалга хянах
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Захиалгын дугаараа оруулан төлөвөө шалгана уу.
        </p>
      </div>
      <TrackForm initialOrder={order} />
    </div>
  );
}
