import { CardModal } from "@/components/cards/card-modal";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppBootstrap } from "@/components/providers/app-bootstrap";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:flex">
      <AppBootstrap />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 p-5 md:p-6">{children}</main>
      </div>
      <CardModal />
    </div>
  );
}
