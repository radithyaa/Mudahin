import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/materi")({
  component: MateriLayout,
});

/** Layout untuk semua halaman turunan materi (reader, ringkasan, kuis, hasil). */
function MateriLayout() {
  return <Outlet />;
}
