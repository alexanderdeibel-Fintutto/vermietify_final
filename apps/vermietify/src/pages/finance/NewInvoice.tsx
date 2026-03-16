import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useBuildings } from "@/hooks/useBuildings";
import { formatCurrency } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number; // in euros
}

export default function NewInvoice() {
  const navigate = useNavigate();
  const { createInvoice } = useInvoices();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList();
  const buildings = buildingsData?.buildings || [];

  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const TAX_RATE = 19;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxAmount = subtotal * (TAX_RATE / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (status: "draft" | "sent") => {
    const subtotalCents = Math.round(subtotal * 100);
    const taxCents = Math.round(taxAmount * 100);
    const totalCents = Math.round(total * 100);

    createInvoice.mutate(
      {
        invoice: {
          recipient_name: recipientName,
          recipient_address: recipientAddress || null,
          issue_date: issueDate,
          due_date: dueDate || null,
          building_id: buildingId || null,
          type: "outgoing",
          status,
          subtotal_cents: subtotalCents,
          tax_rate: TAX_RATE,
          tax_cents: taxCents,
          total_cents: totalCents,
          notes: notes || null,
        },
        items: lineItems
          .filter((item) => item.description.trim() !== "")
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: Math.round(item.unit_price * 100),
            total_cents: Math.round(item.quantity * item.unit_price * 100),
            tax_rate: TAX_RATE,
          })),
      },
      {
        onSuccess: () => {
          navigate("/finanzen/rechnungen");
        },
      }
    );
  };

  return (
    <MainLayout
      title="Neue Rechnung"
      breadcrumbs={[
        { label: "Finanzen", href: "/finanzen" },
        { label: "Rechnungen", href: "/finanzen/rechnungen" },
        { label: "Neue Rechnung" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/finanzen/rechnungen">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Link>
          </Button>
        </div>

        <PageHeader
          title="Neue Rechnung erstellen"
          subtitle="Erstellen Sie eine neue Rechnung für Ihren Empfänger."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Empfänger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Name *</Label>
                    <Input
                      id="recipientName"
                      placeholder="Name des Empfängers"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buildingId">Gebäude</Label>
                    <Select value={buildingId} onValueChange={setBuildingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Gebäude auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building: any) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Adresse</Label>
                  <Textarea
                    id="recipientAddress"
                    placeholder="Straße, PLZ, Ort"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Rechnungsdatum *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Rechnungspositionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <Label>Beschreibung</Label>
                      <Input
                        placeholder="z.B. Miete Januar 2025"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Menge</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Einzelpreis</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={item.unit_price || ""}
                        onChange={(e) =>
                          updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-28 space-y-2">
                      <Label>Summe</Label>
                      <div className="h-10 flex items-center text-sm font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </div>
                    </div>
                    <div className="pt-7">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addLineItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Position hinzufügen
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optionale Notizen zur Rechnung..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Zwischensumme</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MwSt. ({TAX_RATE}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Gesamt</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleSubmit("sent")}
                    disabled={!recipientName || !issueDate || createInvoice.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Erstellen & Senden
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmit("draft")}
                    disabled={!recipientName || !issueDate || createInvoice.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Als Entwurf speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
