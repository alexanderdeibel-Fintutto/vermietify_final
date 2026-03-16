import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useInboundEmail, InboundEmail } from "@/hooks/useInboundEmail";
import { useCostTypes } from "@/hooks/useCostTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileText,
  Building2,
  Receipt,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { StatCard } from "@/components/shared";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Ausstehend", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  processed: { label: "Gebucht", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  needs_review: { label: "Prüfung nötig", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", icon: AlertCircle },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
};

export default function InboundEmailQueue() {
  const { emails, isLoadingEmails, updateEmailStatus } = useInboundEmail();
  const { costTypes } = useCostTypes();
  const { profile } = useAuth();

  const { data: buildings } = useQuery({
    queryKey: ["buildings-simple", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, address")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [reviewBuildingId, setReviewBuildingId] = useState("");
  const [reviewCostTypeId, setReviewCostTypeId] = useState("");
  const [reviewAmount, setReviewAmount] = useState("");
  const [activeTab, setActiveTab] = useState("needs_review");

  const pendingCount = emails.filter((e) => e.status === "pending").length;
  const reviewCount = emails.filter((e) => e.status === "needs_review").length;
  const processedCount = emails.filter((e) => e.status === "processed").length;
  const rejectedCount = emails.filter((e) => e.status === "rejected").length;

  const filteredEmails = emails.filter((e) => e.status === activeTab);

  const handleOpenReview = (email: InboundEmail) => {
    setSelectedEmail(email);
    setReviewBuildingId(email.matched_building_id || "");
    setReviewCostTypeId(email.matched_cost_type_id || "");
    setReviewAmount(email.amount_cents ? (email.amount_cents / 100).toFixed(2) : "");
  };

  const handleBook = () => {
    if (!selectedEmail) return;
    const amountCents = Math.round(parseFloat(reviewAmount || "0") * 100);
    updateEmailStatus.mutate({
      emailId: selectedEmail.id,
      status: "processed",
      updates: {
        matched_building_id: reviewBuildingId || null,
        matched_cost_type_id: reviewCostTypeId || null,
        amount_cents: amountCents || null,
        review_notes: "Manuell geprüft und gebucht",
      } as any,
    });
    setSelectedEmail(null);
  };

  const handleReject = () => {
    if (!selectedEmail) return;
    updateEmailStatus.mutate({
      emailId: selectedEmail.id,
      status: "rejected",
      updates: { review_notes: "Manuell abgelehnt" } as any,
    });
    setSelectedEmail(null);
  };

  const formatCents = (cents: number | null) => {
    if (!cents) return "–";
    return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  };

  return (
    <MainLayout title="E-Mail-Eingang">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Mail-Eingang</h1>
          <p className="text-muted-foreground">
            Automatisch empfangene Rechnungen und Belege verwalten
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Ausstehend" value={pendingCount} icon={Clock} />
          <StatCard title="Prüfung nötig" value={reviewCount} icon={AlertCircle} />
          <StatCard title="Gebucht" value={processedCount} icon={CheckCircle2} />
          <StatCard title="Abgelehnt" value={rejectedCount} icon={XCircle} />
        </div>

        {/* Queue */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="needs_review" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Prüfung nötig
              {reviewCount > 0 && (
                <Badge variant="secondary" className="ml-1">{reviewCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Ausstehend
            </TabsTrigger>
            <TabsTrigger value="processed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Gebucht
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Abgelehnt
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoadingEmails ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Einträge</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "needs_review"
                      ? "Keine E-Mails benötigen eine Prüfung"
                      : "Keine Einträge in dieser Kategorie"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => {
                  const sc = statusConfig[email.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <Card key={email.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium truncate">{email.subject || "(Kein Betreff)"}</span>
                              <Badge className={`${sc.color} border-0 shrink-0`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {sc.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span>Von: {email.from_email}</span>
                              <span>{format(new Date(email.received_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                              {email.vendor_name && (
                                <span className="flex items-center gap-1">
                                  <Receipt className="h-3 w-3" />
                                  {email.vendor_name}
                                </span>
                              )}
                              {email.amount_cents && (
                                <span className="font-medium text-foreground">{formatCents(email.amount_cents)}</span>
                              )}
                              {email.attachments?.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {email.attachments.length} Anhang/Anhänge
                                </span>
                              )}
                            </div>
                            {email.review_notes && (
                              <p className="text-xs text-muted-foreground italic mt-1">{email.review_notes}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReview(email)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>E-Mail prüfen & buchen</DialogTitle>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Von:</span>
                  <span className="font-medium">{selectedEmail.from_email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Betreff:</span>
                  <span className="font-medium">{selectedEmail.subject || "–"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Empfangen:</span>
                  <span>{format(new Date(selectedEmail.received_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                </div>
                {selectedEmail.vendor_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rechnungssteller:</span>
                    <span className="font-medium">{selectedEmail.vendor_name}</span>
                  </div>
                )}
                {selectedEmail.invoice_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rechnungsnr.:</span>
                    <span>{selectedEmail.invoice_number}</span>
                  </div>
                )}
                {selectedEmail.attachments?.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Anhänge:</span>
                    <span>{selectedEmail.attachments.map((a: any) => a.name).join(", ")}</span>
                  </div>
                )}
              </div>

              {selectedEmail.review_notes && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{selectedEmail.review_notes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Betrag (EUR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={reviewAmount}
                    onChange={(e) => setReviewAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gebäude zuordnen</Label>
                  <Select value={reviewBuildingId} onValueChange={setReviewBuildingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gebäude auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(buildings || []).map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} – {b.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kostenart</Label>
                  <Select value={reviewCostTypeId} onValueChange={setReviewCostTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kostenart auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(costTypes || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Ablehnen
            </Button>
            <Button onClick={handleBook} disabled={updateEmailStatus.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Buchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
