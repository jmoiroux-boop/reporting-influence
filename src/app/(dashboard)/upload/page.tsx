import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import type { Profile } from "@/lib/types/database";

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "role"> | null;

  if (!typedProfile || typedProfile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Import des données
        </h1>
        <p className="text-sm text-seb-gray mt-1">
          Uploadez un fichier Excel contenant les données Influence trimestrielles
        </p>
      </div>

      <UploadDropzone />

      <div className="mt-8 bg-white rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Format attendu
        </h3>
        <ul className="space-y-2 text-sm text-seb-gray">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Fichier .xlsx avec 2 onglets (contenant &quot;2024&quot; et &quot;2025&quot;)
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Colonne A : Nom de marque (suffixe All / Organic / Paid)
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Colonne B : Activated Influencers
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Colonne C : Engagements
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Colonne D : Video Views
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-seb-red mt-1.5 flex-shrink-0" />
            Police rouge = Groupe SEB, Police noire = Competitors
          </li>
        </ul>
      </div>
    </div>
  );
}
