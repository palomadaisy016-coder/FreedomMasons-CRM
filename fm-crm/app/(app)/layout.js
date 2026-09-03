import { createClient } from "@/lib/supabase/server";
import NavBar from "../components/NavBar";

export default async function AppLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper relative">
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <img
          src="/logo.png"
          alt=""
          className="w-[700px] max-w-none opacity-[0.15]"
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <NavBar email={user?.email} />
        <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
