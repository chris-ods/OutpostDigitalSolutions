import { Nav } from "@/app/components/Nav";
import { Footer } from "@/app/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pt-14">{children}</main>
      <Footer />
    </div>
  );
}
