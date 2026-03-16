import { useState } from "react";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Wallet,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { de } from "date-fns/locale";

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: "Miete" | "Nebenkosten" | "Kaution" | "Sonstiges";
  status: "paid" | "pending" | "overdue";
  reference?: string;
}

// Generate placeholder payment data
function generatePayments(year: number): PaymentRecord[] {
  const payments: PaymentRecord[] = [];
  const now = new Date();

  for (let month = 0; month < 12; month++) {
    const paymentDate = new Date(year, month, 1);
    if (paymentDate > now) continue;

    const isPast = paymentDate < new Date(now.getFullYear(), now.getMonth(), 1);
    const isCurrent = paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();

    payments.push({
      id: `rent-${year}-${month}`,
      date: format(paymentDate, "yyyy-MM-dd"),
      amount: 850.0,
      type: "Miete",
      status: isPast ? "paid" : isCurrent ? "pending" : "pending",
      reference: `MIETE-${year}-${String(month + 1).padStart(2, "0")}`,
    });

    payments.push({
      id: `utility-${year}-${month}`,
      date: format(paymentDate, "yyyy-MM-dd"),
      amount: 220.0,
      type: "Nebenkosten",
      status: isPast ? "paid" : isCurrent ? "pending" : "pending",
      reference: `NK-${year}-${String(month + 1).padStart(2, "0")}`,
    });
  }

  // Add deposit for 2025
  if (year === 2025) {
    payments.unshift({
      id: "deposit-2025",
      date: "2025-01-15",
      amount: 2550.0,
      type: "Kaution",
      status: "paid",
      reference: "KAUTION-2025",
    });
  }

  return payments.reverse();
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  paid: { label: "Bezahlt", icon: CheckCircle, className: "bg-green-100 text-green-800" },
  pending: { label: "Offen", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "Überfällig", icon: AlertCircle, className: "bg-red-100 text-red-800" },
};

export default function TenantPaymentHistory() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const years = [String(currentYear), String(currentYear - 1)];

  const payments = generatePayments(Number(selectedYear));

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const openBalance = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayments = payments.filter((p) => p.status === "paid").length;

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Zahlungshistorie</h1>
            <p className="text-muted-foreground">
              Übersicht aller Zahlungen und offenen Beträge.
            </p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gezahlt in {selectedYear}
                  </p>
                  <p className="text-2xl font-bold">{totalPaid.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">
                    {totalPayments} Zahlungen
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offener Saldo</p>
                  <p className="text-2xl font-bold">{openBalance.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">
                    {payments.filter((p) => p.status !== "paid").length} offene Posten
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monatliche Miete</p>
                  <p className="text-2xl font-bold">1.070,00 €</p>
                  <p className="text-sm text-muted-foreground">
                    850 € Miete + 220 € NK
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Zahlungen {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Datum</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Referenz</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Typ</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Betrag</th>
                    <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusConfig = STATUS_CONFIG[payment.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(payment.date), "dd.MM.yyyy", { locale: de })}
                          </div>
                        </td>
                        <td className="py-3 text-sm font-mono text-muted-foreground">
                          {payment.reference}
                        </td>
                        <td className="py-3 text-sm">{payment.type}</td>
                        <td className="py-3 text-sm font-mono font-medium text-right">
                          {payment.amount.toFixed(2)} €
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={statusConfig.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
