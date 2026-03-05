"use client";

import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UploadRecord {
  id: string;
  file_name: string;
  file_size_bytes: number;
  status: "processing" | "completed" | "failed";
  row_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
}

interface HistoryContentProps {
  uploads: UploadRecord[];
}

const statusConfig = {
  processing: {
    label: "En cours",
    variant: "warning" as const,
    icon: Clock,
  },
  completed: {
    label: "Terminé",
    variant: "success" as const,
    icon: CheckCircle,
  },
  failed: {
    label: "Échoué",
    variant: "danger" as const,
    icon: XCircle,
  },
};

export function HistoryContent({ uploads }: HistoryContentProps) {
  if (uploads.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-seb-cream-dark flex items-center justify-center">
              <FileSpreadsheet className="h-7 w-7 text-seb-gray-light" />
            </div>
            <p className="text-sm text-seb-gray">
              Aucun import enregistré
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => {
        const config = statusConfig[upload.status];
        const StatusIcon = config.icon;

        return (
          <Card key={upload.id}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-seb-cream-dark flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-seb-gray" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {upload.file_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-seb-gray">
                        {(upload.file_size_bytes / 1024).toFixed(1)} KB
                      </span>
                      {upload.row_count > 0 && (
                        <span className="text-xs text-seb-gray">
                          {upload.row_count} lignes
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-seb-gray-light">
                        <User className="h-3 w-3" />
                        {upload.profiles?.full_name ||
                          upload.profiles?.email ||
                          "—"}
                      </span>
                    </div>
                    {upload.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        {upload.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={config.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-xs text-seb-gray-light whitespace-nowrap">
                    {format(
                      new Date(upload.created_at),
                      "dd MMM yyyy HH:mm",
                      { locale: fr }
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
