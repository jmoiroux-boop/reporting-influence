"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CommentSectionProps {
  section: string;
  isAdmin: boolean;
}

interface CommentData {
  content: string;
  updated_at: string;
  profiles: { full_name: string | null; email: string } | null;
}

export function CommentSection({ section, isAdmin }: CommentSectionProps) {
  const [comment, setComment] = useState<CommentData | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("kpi_comments")
      .select("content, updated_at, profiles:updated_by(full_name, email)")
      .eq("section", section)
      .single()
      .then(({ data }) => {
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const typedData = data as any;
          setComment({
            content: typedData.content,
            updated_at: typedData.updated_at,
            profiles: typedData.profiles,
          });
          setEditValue(typedData.content);
        }
      });
  }, [section]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content: editValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setComment({
          content: data.content,
          updated_at: data.updated_at,
          profiles: data.profiles || comment?.profiles || null,
        });
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const hasContent = comment?.content && comment.content.trim().length > 0;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-3.5 w-3.5 text-seb-gray-light" />
        <span className="text-xs font-medium text-seb-gray">Commentaire</span>
      </div>

      {isAdmin ? (
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-seb-gray-light focus:outline-none focus:ring-2 focus:ring-seb-red/20 focus:border-seb-red/40 resize-none transition-all"
                rows={3}
                placeholder="Ajoutez un commentaire..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} loading={saving}>
                  <Save className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(comment?.content || "");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl border border-dashed transition-colors text-sm",
                hasContent
                  ? "border-border bg-white hover:border-seb-gray-light text-foreground"
                  : "border-border hover:border-seb-gray-light text-seb-gray-light"
              )}
            >
              {hasContent
                ? comment.content
                : "Cliquez pour ajouter un commentaire..."}
            </button>
          )}
        </div>
      ) : hasContent ? (
        <p className="px-4 py-3 rounded-xl bg-seb-cream/50 text-sm text-foreground">
          {comment.content}
        </p>
      ) : null}

      {/* Last edited info */}
      {hasContent && comment.updated_at && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-seb-gray-light">
          <Clock className="h-2.5 w-2.5" />
          <span>
            {comment.profiles?.full_name || comment.profiles?.email || "—"} ·{" "}
            {format(new Date(comment.updated_at), "dd MMM yyyy HH:mm", {
              locale: fr,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
