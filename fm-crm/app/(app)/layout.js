import { createClient } from "@/lib/supabase/server";
import NavBar from "../components/NavBar";

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper">
      <NavBar email={user?.email} />
      <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}
