"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";
import { UPLOAD_LIMITS } from "@/lib/constants";

interface UploadResult {
  uploadId: string;
  fileName: string;
  rowCount: number;
  years: number[];
  summary: Record<number, Record<string, { gseb: number; competitor: number }>>;
}

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);
    setResult(null);

    // Client-side validation
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));
    if (!(UPLOAD_LIMITS.allowedExtensions as readonly string[]).includes(ext)) {
      setError(`Format invalide. Seuls les fichiers .xlsx sont acceptés.`);
      return;
    }
    if (selectedFile.size > UPLOAD_LIMITS.maxFileSize) {
      const maxMB = UPLOAD_LIMITS.maxFileSize / (1024 * 1024);
      setError(`Fichier trop volumineux. Maximum : ${maxMB} MB.`);
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setResult(data);
      setFile(null);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card>
        <CardContent className="p-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center py-16 px-8 cursor-pointer rounded-2xl transition-all duration-200 border-2 border-dashed m-1",
              isDragging
                ? "border-seb-red bg-seb-red-light"
                : "border-border hover:border-seb-gray-light hover:bg-seb-cream/50"
            )}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                isDragging ? "bg-seb-red" : "bg-seb-cream-dark"
              )}
            >
              <Upload
                className={cn(
                  "h-7 w-7",
                  isDragging ? "text-white" : "text-seb-gray"
                )}
              />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging
                ? "Déposez votre fichier ici"
                : "Glissez-déposez votre fichier Excel"}
            </p>
            <p className="text-xs text-seb-gray">
              Format .xlsx uniquement - Maximum 10 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected file */}
      {file && !uploading && !result && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-seb-gray">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
                <Button onClick={handleUpload}>Importer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploading state */}
      {uploading && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center py-8 gap-4">
              <Spinner size="lg" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Traitement en cours...
                </p>
                <p className="text-xs text-seb-gray mt-1">
                  Upload, parsing et insertion des données
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success result */}
      {result && (
        <Card>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Import réussi
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-seb-cream rounded-lg p-3">
                    <p className="text-xs text-seb-gray">Fichier</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.fileName}
                    </p>
                  </div>
                  <div className="bg-seb-cream rounded-lg p-3">
                    <p className="text-xs text-seb-gray">Lignes traitées</p>
                    <p className="text-sm font-medium text-foreground">
                      {result.rowCount}
                    </p>
                  </div>
                  <div className="bg-seb-cream rounded-lg p-3">
                    <p className="text-xs text-seb-gray">Années</p>
                    <p className="text-sm font-medium text-foreground">
                      {result.years.join(" & ")}
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={resetState}>
                  Importer un autre fichier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  Erreur d&apos;import
                </p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="mt-3"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
