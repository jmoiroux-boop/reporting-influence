import { createClient } from "@/lib/supabase/server";
import { HistoryContent } from "@/components/history/history-content";

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("*, profiles:uploaded_by(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Historique des imports
        </h1>
        <p className="text-sm text-seb-gray mt-1">
          Suivi de tous les fichiers importés
        </p>
      </div>

      <HistoryContent uploads={uploads || []} />
    </div>
  );
}
