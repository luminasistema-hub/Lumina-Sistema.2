import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";

type ParticipantRow = {
  id: string;
  membro_id: string;
  nome?: string | null;
  email?: string | null;
  status_inscricao?: string | null;
  data_inscricao?: string | null;
};

export function EventParticipantsDialog({
  eventId,
  churchId,
  open,
  onClose,
  eventName,
}: {
  eventId: string;
  churchId: string;
  open: boolean;
  onClose: () => void;
  eventName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const loadParticipants = async () => {
    if (!eventId || !churchId) return;
    setLoading(true);
    try {
      const { data: regs, error } = await supabase
        .from("evento_participantes")
        .select("id, membro_id, status_inscricao, data_inscricao, created_at")
        .eq("evento_id", eventId)
        .eq("id_igreja", churchId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows: ParticipantRow[] = (regs || []).map((r: any) => ({
        id: r.id,
        membro_id: r.membro_id,
        status_inscricao: r.status_inscricao,
        data_inscricao: r.data_inscricao || r.created_at,
      }));

      const memberIds = Array.from(new Set(rows.map(r => r.membro_id).filter(Boolean)));
      if (memberIds.length > 0) {
        const { data: members, error: mErr } = await supabase
          .from("membros")
          .select("id, nome_completo, email")
          .in("id", memberIds);
        if (mErr) throw mErr;
        const map = new Map<string, { nome_completo?: string | null; email?: string | null }>();
        (members || []).forEach((m: any) => {
          map.set(m.id, { nome_completo: m.nome_completo, email: m.email });
        });
        setParticipants(rows.map(r => ({
          ...r,
          nome: map.get(r.membro_id)?.nome_completo || null,
          email: map.get(r.membro_id)?.email || null,
        })));
      } else {
        setParticipants(rows);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar inscritos: " + err.message);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadParticipants();
  }, [open, eventId, churchId]);

  const printableHtml = useMemo(() => {
    const header = `
      <div style="text-align:center; margin-bottom:16px;">
        <h2 style="margin:0;">Inscritos - ${eventName || "Evento"}</h2>
      </div>
    `;
    const rows = participants.map(p => `
      <tr>
        <td>${p.nome || "-"}</td>
        <td>${p.email || "-"}</td>
        <td>${p.status_inscricao || "-"}</td>
        <td>${p.data_inscricao ? new Date(p.data_inscricao).toLocaleString("pt-BR") : "-"}</td>
      </tr>
    `).join("");
    return `
      <html>
        <head>
          <title>Inscritos - ${eventName || "Evento"}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          ${header}
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Status</th>
                <th>Data de inscrição</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }, [participants, eventName]);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(printableHtml);
    w.document.close();
    // aguardar carregar
    w.onload = () => w.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inscritos {eventName ? `- ${eventName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500">
            {loading ? "Carregando..." : `Total: ${participants.length}`}
          </div>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
        </div>

        <div className="border rounded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de inscrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">Nenhum inscrito ainda</TableCell>
                </TableRow>
              ) : participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome || "-"}</TableCell>
                  <TableCell>{p.email || "-"}</TableCell>
                  <TableCell>{p.status_inscricao || "-"}</TableCell>
                  <TableCell>{p.data_inscricao ? new Date(p.data_inscricao).toLocaleString("pt-BR") : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EventParticipantsDialog;