import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { DataTable, EmptyState } from "@/components/shared";
import { CreditCard, Filter, Plus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";

interface UnitPaymentsTabProps {
  unitId: string;
}

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  is_income: boolean;
  description: string | null;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  rent: "Miete",
  deposit: "Kaution",
  utility: "Nebenkosten",
  repair: "Reparatur",
  insurance: "Versicherung",
  tax: "Steuer",
  other_income: "Sonstige Einnahme",
  other_expense: "Sonstige Ausgabe",
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "transaction_date",
    header: "Datum",
    cell: ({ row }) => format(new Date(row.original.transaction_date), "dd.MM.yyyy", { locale: de }),
  },
  {
    accessorKey: "transaction_type",
    header: "Typ",
    cell: ({ row }) => (
      <Badge variant="outline">
        {TRANSACTION_TYPE_LABELS[row.original.transaction_type] || row.original.transaction_type}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Betrag",
    cell: ({ row }) => (
      <span className={row.original.is_income ? "text-green-600" : "text-red-600"}>
        {row.original.is_income ? "+" : "-"}{formatCurrency(row.original.amount / 100)}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Beschreibung",
    cell: ({ row }) => row.original.description || "–",
  },
];

export function UnitPaymentsTab({ unitId }: UnitPaymentsTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch lease to get lease_id for transactions
  const { data: lease } = useQuery({
    queryKey: ["leases", "unit", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions for the lease
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", "lease", lease?.id, selectedYear, selectedType],
    queryFn: async () => {
      if (!lease?.id) return [];

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("lease_id", lease.id)
        .gte("transaction_date", `${selectedYear}-01-01`)
        .lte("transaction_date", `${selectedYear}-12-31`)
        .order("transaction_date", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("transaction_type", selectedType as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!lease?.id,
  });

  // Generate year options
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Calculate totals
  const totals = transactions?.reduce(
    (acc, t) => {
      if (t.is_income) {
        acc.income += t.amount;
      } else {
        acc.expense += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  ) || { income: 0, expense: 0 };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="rent">Miete</SelectItem>
                <SelectItem value="deposit">Kaution</SelectItem>
                <SelectItem value="utility">Nebenkosten</SelectItem>
                <SelectItem value="repair">Reparatur</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Zahlung erfassen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Einnahmen {selectedYear}</p>
            <p className="text-2xl font-bold text-green-600">
              +{formatCurrency(totals.income / 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ausgaben {selectedYear}</p>
            <p className="text-2xl font-bold text-red-600">
              -{formatCurrency(totals.expense / 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo {selectedYear}</p>
            <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency((totals.income - totals.expense) / 100)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!lease ? (
            <EmptyState
              icon={CreditCard}
              title="Kein aktiver Vertrag"
              description="Zahlungen können nur für aktive Mietverträge angezeigt werden."
            />
          ) : transactions && transactions.length > 0 ? (
            <DataTable columns={columns} data={transactions} />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="Keine Zahlungen"
              description={`Für ${selectedYear} wurden keine Zahlungen gefunden.`}
              action={
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Zahlung erfassen
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
