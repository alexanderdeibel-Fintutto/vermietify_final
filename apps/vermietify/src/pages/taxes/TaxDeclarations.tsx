import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTaxDeclarations, FORM_TYPE_LABELS, TaxDeclaration } from "@/hooks/useTaxDeclarations";
import { LoadingState, EmptyState } from "@/components/shared";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Filter,
  Building2,
} from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  in_progress: "In Bearbeitung",
  review: "Prufung",
  ready: "Bereit",
  submitted: "Eingereicht",
  accepted: "Akzeptiert",
  rejected: "Abgelehnt",
  amended: "Geandert",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  submitted: "bg-purple-100 text-purple-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  amended: "bg-orange-100 text-orange-800",
};

const FORM_TYPES = Object.keys(FORM_TYPE_LABELS);

export default function TaxDeclarations() {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [filterFormType, setFilterFormType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDeclaration, setNewDeclaration] = useState({
    tax_year: currentYear,
    form_type: "" as string,
    building_id: "",
  });

  const { data: declarations = [], isLoading, createDeclaration, deleteDeclaration } = useTaxDeclarations(selectedYear);

  const filtered = declarations.filter((d: TaxDeclaration) => {
    if (filterFormType !== "all" && d.form_type !== filterFormType) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newDeclaration.form_type) return;
    createDeclaration.mutate({
      tax_year: newDeclaration.tax_year,
      form_type: newDeclaration.form_type as TaxDeclaration["form_type"],
      building_id: newDeclaration.building_id || null,
      status: "draft",
      data_json: {},
    });
    setShowCreateDialog(false);
    setNewDeclaration({ tax_year: currentYear, form_type: "", building_id: "" });
  };

  const handleDelete = (id: string) => {
    deleteDeclaration.mutate(id);
  };

  return (
    <MainLayout title="Steuererklarungen">
      <div className="space-y-6">
        <PageHeader
          title="Steuererklarungen"
          subtitle="Alle Steuererklarungen verwalten und einreichen"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Erklarungen" },
          ]}
          actions={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Erklarung
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedYear ? String(selectedYear) : "all"}
                onValueChange={(v) => setSelectedYear(v === "all" ? undefined : Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jahre</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterFormType}
                onValueChange={setFilterFormType}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Formular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Formulare</SelectItem>
                  {FORM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FORM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Declarations Table */}
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Keine Erklarungen"
            description="Erstellen Sie Ihre erste Steuererklarung"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Erklarung erstellen
              </Button>
            }
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formular</TableHead>
                  <TableHead>Steuerjahr</TableHead>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((decl: TaxDeclaration) => (
                  <TableRow key={decl.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {FORM_TYPE_LABELS[decl.form_type] || decl.form_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{decl.tax_year}</TableCell>
                    <TableCell>
                      {decl.buildings?.name ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{decl.buildings.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[decl.status]}>
                        {STATUS_LABELS[decl.status] || decl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" title="Anzeigen">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Bearbeiten">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Loschen"
                          onClick={() => handleDelete(decl.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Steuererklarung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Steuerjahr *</Label>
              <Select
                value={String(newDeclaration.tax_year)}
                onValueChange={(v) => setNewDeclaration((p) => ({ ...p, tax_year: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formulartyp *</Label>
              <Select
                value={newDeclaration.form_type}
                onValueChange={(v) => setNewDeclaration((p) => ({ ...p, form_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Formular wahlen" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FORM_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={!newDeclaration.form_type}>
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
