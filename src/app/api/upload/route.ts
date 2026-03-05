import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseExcelFile } from "@/lib/excel/parser";
import { validateFile } from "@/lib/excel/validators";
import type { InfluenceData } from "@/lib/types/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    // 3. Get file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // 4. Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    // 5. Upload to Supabase Storage
    const adminClient = createAdminClient();
    const timestamp = Date.now();
    const filePath = `uploads/${user.id}/${timestamp}_${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: storageError } = await adminClient.storage
      .from("excel-uploads")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: `Erreur de stockage : ${storageError.message}` },
        { status: 500 }
      );
    }

    // 6. Create upload record (processing)
    const { data: upload, error: uploadError } = await adminClient
      .from("uploads")
      .insert({
        uploaded_by: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        status: "processing",
        metadata: {},
      })
      .select("id")
      .single();

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: `Erreur d'enregistrement : ${uploadError?.message}` },
        { status: 500 }
      );
    }

    // 7. Parse Excel
    let parseResult;
    try {
      parseResult = await parseExcelFile(buffer);
    } catch (parseError) {
      // Update upload status to failed
      await adminClient
        .from("uploads")
        .update({
          status: "failed",
          error_message:
            parseError instanceof Error
              ? parseError.message
              : "Erreur de parsing inconnue",
        })
        .eq("id", upload.id);

      return NextResponse.json(
        {
          error: `Erreur de parsing : ${parseError instanceof Error ? parseError.message : "Erreur inconnue"}`,
        },
        { status: 400 }
      );
    }

    // 8. Delete old data for the same years (from previous uploads)
    for (const year of parseResult.years) {
      await adminClient
        .from("influence_data")
        .delete()
        .eq("year", year);
    }

    // 9. Insert parsed data in batches
    const batchSize = 500;
    const dataToInsert: Omit<InfluenceData, "id" | "created_at">[] =
      parseResult.rows.map((row) => ({
        upload_id: upload.id,
        year: row.year,
        brand: row.brand,
        metric: row.metric,
        entity: row.entity,
        source: row.source,
        value: row.value,
        raw_row_index: row.rawRowIndex,
      }));

    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize);
      const { error: insertError } = await adminClient
        .from("influence_data")
        .insert(batch);

      if (insertError) {
        await adminClient
          .from("uploads")
          .update({
            status: "failed",
            error_message: `Erreur d'insertion données : ${insertError.message}`,
          })
          .eq("id", upload.id);

        return NextResponse.json(
          { error: `Erreur d'insertion : ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // 10. Update upload status to completed
    await adminClient
      .from("uploads")
      .update({
        status: "completed",
        row_count: parseResult.rows.length,
        metadata: {
          sheetNames: parseResult.sheetNames,
          years: parseResult.years,
        },
      })
      .eq("id", upload.id);

    return NextResponse.json({
      uploadId: upload.id,
      fileName: file.name,
      rowCount: parseResult.rows.length,
      years: parseResult.years,
      summary: parseResult.summary,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur serveur inattendue",
      },
      { status: 500 }
    );
  }
}
