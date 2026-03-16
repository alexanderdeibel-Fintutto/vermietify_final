import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HardHat, Plus, Search, Star, Phone, Mail, History } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  gewerk: string;
  telefon: string;
  email: string;
  bewertung: number;
  einsaetze: { datum: string; beschreibung: string }[];
}

const GEWERK_OPTIONS = [
  "Handwerker",
  "Reinigung",
  "Gartner",
  "Schornsteinfeger",
  "Elektriker",
  "Installateur",
  "Maler",
  "Dachdecker",
  "Schlosser",
  "Sonstiges",
];

const placeholderVendors: Vendor[] = [
  {
    id: "1",
    name: "Muller Haustechnik GmbH",
    gewerk: "Installateur",
    telefon: "+49 30 12345678",
    email: "info@mueller-haustechnik.de",
    bewertung: 5,
    einsaetze: [
      { datum: "2026-03-01", beschreibung: "Heizungswartung Hauptstr. 12" },
      { datum: "2026-01-15", beschreibung: "Wasserhahn-Reparatur Gartenweg 5" },
      { datum: "2025-11-20", beschreibung: "Therme-Austausch Bergstr. 8" },
      { datum: "2025-09-10", beschreibung: "Heizungswartung Hauptstr. 12" },
      { datum: "2025-06-05", beschreibung: "Rohrreinigung Gartenweg 5" },
    ],
  },
  {
    id: "2",
    name: "Clean Team Berlin",
    gewerk: "Reinigung",
    telefon: "+49 30 98765432",
    email: "kontakt@cleanteam-berlin.de",
    bewertung: 4,
    einsaetze: [
      { datum: "2026-03-01", beschreibung: "Treppenhausreinigung Hauptstr. 12" },
      { datum: "2026-02-01", beschreibung: "Treppenhausreinigung Hauptstr. 12" },
      { datum: "2026-01-01", beschreibung: "Grundreinigung Gartenweg 5" },
    ],
  },
  {
    id: "3",
    name: "Grun & Schon GbR",
    gewerk: "Gartner",
    telefon: "+49 30 55566677",
    email: "kontakt@grun-schoen.de",
    bewertung: 4,
    einsaetze: [
      { datum: "2026-01-10", beschreibung: "Winterdienst Gartenweg 5" },
      { datum: "2025-10-15", beschreibung: "Herbstschnitt alle Objekte" },
    ],
  },
  {
    id: "4",
    name: "Schornsteinfeger Meier",
    gewerk: "Schornsteinfeger",
    telefon: "+49 30 33344455",
    email: "meier@schornsteinfeger-berlin.de",
    bewertung: 5,
    einsaetze: [
      { datum: "2025-12-01", beschreibung: "Feuerstattenschau Hauptstr. 12" },
      { datum: "2025-11-15", beschreibung: "Abgasmessung Bergstr. 8" },
    ],
  },
  {
    id: "5",
    name: "Elektro Schneider",
    gewerk: "Elektriker",
    telefon: "+49 30 77788899",
    email: "schneider@elektro-schneider.de",
    bewertung: 3,
    einsaetze: [
      { datum: "2026-02-20", beschreibung: "Treppenhausbeleuchtung Gartenweg 5" },
    ],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>(placeholderVendors);
  const [search, setSearch] = useState("");
  const [filterGewerk, setFilterGewerk] = useState<string>("alle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: "",
    gewerk: "Handwerker",
    telefon: "",
    email: "",
    bewertung: 3,
  });

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.gewerk.toLowerCase().includes(search.toLowerCase());
    const matchesGewerk = filterGewerk === "alle" || v.gewerk === filterGewerk;
    return matchesSearch && matchesGewerk;
  });

  const handleAdd = () => {
    const vendor: Vendor = {
      id: crypto.randomUUID(),
      name: newVendor.name,
      gewerk: newVendor.gewerk,
      telefon: newVendor.telefon,
      email: newVendor.email,
      bewertung: newVendor.bewertung,
      einsaetze: [],
    };
    setVendors((prev) => [vendor, ...prev]);
    setNewVendor({ name: "", gewerk: "Handwerker", telefon: "", email: "", bewertung: 3 });
    setDialogOpen(false);
  };

  return (
    <MainLayout
      title="Dienstleister"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Dienstleister" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Dienstleisterverwaltung"
          subtitle="Verwalten Sie Ihre Handwerker, Dienstleister und deren Einsatzhistorie."
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Neuen Dienstleister anlegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Dienstleister anlegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      placeholder="Firmenname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gewerk</Label>
                    <Select
                      value={newVendor.gewerk}
                      onValueChange={(val) => setNewVendor({ ...newVendor, gewerk: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GEWERK_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        value={newVendor.telefon}
                        onChange={(e) => setNewVendor({ ...newVendor, telefon: e.target.value })}
                        placeholder="+49 ..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-Mail</Label>
                      <Input
                        value={newVendor.email}
                        onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                        placeholder="email@example.de"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bewertung (1-5)</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewVendor({ ...newVendor, bewertung: i })}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 ${i <= newVendor.bewertung ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full">
                    Anlegen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Dienstleister suchen..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={filterGewerk} onValueChange={setFilterGewerk}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Gewerk" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Gewerke</SelectItem>
                    {GEWERK_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardHat className="h-5 w-5 text-primary" />
              Dienstleister ({filteredVendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gewerk</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Bewertung</TableHead>
                  <TableHead>Einsatze</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <>
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vendor.gewerk}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {vendor.telefon}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {vendor.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={vendor.bewertung} />
                      </TableCell>
                      <TableCell>{vendor.einsaetze.length}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)
                          }
                        >
                          <History className="h-4 w-4 mr-1" />
                          Historie
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedVendor === vendor.id && (
                      <TableRow key={`${vendor.id}-history`}>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-2">
                            <p className="text-sm font-medium mb-2">Einsatzhistorie (letzte 5)</p>
                            {vendor.einsaetze.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Keine Einsatze vorhanden.</p>
                            ) : (
                              <div className="space-y-1">
                                {vendor.einsaetze.slice(0, 5).map((e, i) => (
                                  <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="text-muted-foreground min-w-[90px]">{e.datum}</span>
                                    <span>{e.beschreibung}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
