import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import TrialBanner from "@/components/TrialBanner";
import PedirAvisos from "@/components/PedirAvisos";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <TrialBanner />
      <main key="page" className="flex-1 md:pb-0 pb-24 animate-page-enter">{children}</main>
      <Footer />
      <BottomNav />
      <PedirAvisos />
    </div>
  );
}
