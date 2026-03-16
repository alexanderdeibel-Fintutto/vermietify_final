import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/shared/DataTable";
import { 
  Home, 
  MessageSquare, 
  Globe, 
  Settings,
  Plus,
  Search,
  Eye,
  Pause,
  Play,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListings, PORTAL_INFO, ListingWithDetails } from "@/hooks/useListings";
import { ListingEditor } from "@/components/listings/ListingEditor";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";
import type { ColumnDef } from "@tanstack/react-table";

type ListingStatus = Database["public"]["Enums"]["listing_status"];
type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];
type PortalType = Database["public"]["Enums"]["portal_type"];

const STATUS_LABELS: Record<ListingStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Entwurf", variant: "secondary" },
  active: { label: "Aktiv", variant: "default" },
  paused: { label: "Pausiert", variant: "outline" },
  rented: { label: "Vermietet", variant: "destructive" },
};

const INQUIRY_STATUS_LABELS: Record<InquiryStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "Neu", variant: "destructive" },
  contacted: { label: "Kontaktiert", variant: "secondary" },
  viewing: { label: "Besichtigung", variant: "default" },
  cancelled: { label: "Abgesagt", variant: "outline" },
  rented: { label: "Vermietet", variant: "default" },
};

export default function ListingsManagement() {
  const [activeTab, setActiveTab] = useState("listings");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    useListingsList,
    useInquiriesList,
    usePortalConnections,
    useListingSettings,
    useListingStats,
    updateListingStatus,
    deleteListing,
    updateInquiryStatus,
    disconnectPortal,
    updateListingSettings,
  } = useListings();

  const { data: listings, isLoading: listingsLoading } = useListingsList();
  const { data: inquiries, isLoading: inquiriesLoading } = useInquiriesList();
  const { data: portalConnections } = usePortalConnections();
  const { data: settings } = useListingSettings();
  const { data: stats } = useListingStats();

  // Filter listings
  const filteredListings = listings?.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.unit?.building?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditListing = (listing: ListingWithDetails) => {
    setSelectedListing(listing);
    setEditorOpen(true);
  };

  const handleNewListing = () => {
    setSelectedListing(null);
    setEditorOpen(true);
  };

  const handleToggleStatus = async (listing: ListingWithDetails) => {
    const newStatus: ListingStatus = listing.status === "active" ? "paused" : "active";
    await updateListingStatus.mutateAsync({ id: listing.id, status: newStatus });
  };

  const handleDeleteListing = async (id: string) => {
    if (confirm("Möchten Sie dieses Inserat wirklich löschen?")) {
      await deleteListing.mutateAsync(id);
    }
  };

  // Listings columns
  const listingColumns: ColumnDef<ListingWithDetails>[] = [
    {
      accessorKey: "unit",
      header: "Einheit",
      cell: ({ row }) => {
        const unit = row.original.unit;
        return (
          <div>
            <p className="font-medium">{unit?.building?.name}</p>
            <p className="text-sm text-muted-foreground">{unit?.unit_number}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Titel",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "rent_cold",
      header: "Kaltmiete",
      cell: ({ row }) => formatCurrency((row.original.rent_cold || 0) / 100),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={STATUS_LABELS[status].variant}>
            {STATUS_LABELS[status].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "portals",
      header: "Portale",
      cell: ({ row }) => {
        const portals = row.original.portals || [];
        return (
          <div className="flex gap-1">
            {portals.map(p => (
              <span key={p.id} title={PORTAL_INFO[p.portal].name} className="text-lg">
                {PORTAL_INFO[p.portal].logo}
              </span>
            ))}
            {portals.length === 0 && <span className="text-muted-foreground">-</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "inquiry_count",
      header: "Anfragen",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.inquiry_count || 0}</Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Erstellt",
      cell: ({ row }) => format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const listing = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                <Eye className="h-4 w-4 mr-2" />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(listing)}>
                {listing.status === "active" ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausieren
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Aktivieren
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteListing(listing.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Inquiry columns
  const inquiryColumns: ColumnDef<any>[] = [
    {
      accessorKey: "created_at",
      header: "Datum",
      cell: ({ row }) => format(new Date(row.original.created_at), "dd.MM.yyyy HH:mm", { locale: de }),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "E-Mail",
      cell: ({ row }) => (
        <a href={`mailto:${row.original.email}`} className="text-primary hover:underline">
          {row.original.email}
        </a>
      ),
    },
    {
      accessorKey: "phone",
      header: "Telefon",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "listing",
      header: "Einheit",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.listings?.units?.buildings?.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.listings?.units?.unit_number}</p>
        </div>
      ),
    },
    {
      accessorKey: "portal_source",
      header: "Portal",
      cell: ({ row }) => {
        const portal = row.original.portal_source as PortalType;
        return portal ? (
          <span title={PORTAL_INFO[portal].name}>{PORTAL_INFO[portal].logo}</span>
        ) : "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as InquiryStatus;
        return (
          <Badge variant={INQUIRY_STATUS_LABELS[status].variant}>
            {INQUIRY_STATUS_LABELS[status].label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const inquiry = row.original;
        return (
          <div className="flex gap-1">
            {inquiry.phone && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`tel:${inquiry.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
            {inquiry.email && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`mailto:${inquiry.email}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateInquiryStatus.mutateAsync({ id: inquiry.id, status: "contacted" })}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Als kontaktiert markieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateInquiryStatus.mutateAsync({ id: inquiry.id, status: "viewing" })}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Besichtigung planen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateInquiryStatus.mutateAsync({ id: inquiry.id, status: "cancelled" })}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Absagen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout title="Inserate" breadcrumbs={[{ label: "Inserate" }]}>
    <div className="space-y-6">
      <PageHeader
        title="Inserate & Portale"
        subtitle="Verwalten Sie Ihre Inserate und Portalverbindungen"
        actions={
          <Button onClick={handleNewListing}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Inserat
          </Button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Aktive Inserate"
          value={stats?.activeListings || 0}
          icon={Home}
        />
        <StatCard
          title="Anfragen diese Woche"
          value={stats?.weeklyInquiries || 0}
          icon={MessageSquare}
        />
        <StatCard
          title="Neue Anfragen"
          value={stats?.newInquiries || 0}
          icon={Mail}
          trend={stats?.newInquiries && stats.newInquiries > 0 ? { value: stats.newInquiries, isPositive: true } : undefined}
        />
        <StatCard
          title="Portale verbunden"
          value={stats?.connectedPortals || 0}
          icon={Globe}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listings">
            <Home className="h-4 w-4 mr-2" />
            Inserate
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            <MessageSquare className="h-4 w-4 mr-2" />
            Anfragen
            {(stats?.newInquiries || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">{stats?.newInquiries}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="portals">
            <Globe className="h-4 w-4 mr-2" />
            Portale
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Inserate durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="draft">Entwürfe</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="paused">Pausiert</SelectItem>
                <SelectItem value="rented">Vermietet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {listingsLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : (
            <DataTable
              columns={listingColumns}
              data={filteredListings || []}
            />
          )}
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-4">
          {inquiriesLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : (
            <DataTable
              columns={inquiryColumns}
              data={inquiries || []}
            />
          )}
        </TabsContent>

        {/* Portals Tab */}
        <TabsContent value="portals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(PORTAL_INFO) as [PortalType, typeof PORTAL_INFO[PortalType]][]).map(([portal, info]) => {
              const connection = portalConnections?.find(c => c.portal === portal);
              const isConnected = connection?.is_connected;

              return (
                <Card key={portal}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-3 rounded-lg ${info.color} text-white text-2xl`}>
                      {info.logo}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <CardDescription>
                        {isConnected ? (
                          <Badge variant="default" className="mt-1">Verbunden</Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1">Nicht verbunden</Badge>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="space-y-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Letzte Synchronisation:</span>
                            <span>
                              {connection?.last_sync_at 
                                ? format(new Date(connection.last_sync_at), "dd.MM.yyyy HH:mm", { locale: de })
                                : "Nie"
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aktive Inserate:</span>
                            <span>{connection?.active_listings_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Synchronisieren
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => disconnectPortal.mutateAsync(portal)}
                          >
                            Trennen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Verbinden Sie Ihr {info.name}-Konto, um Inserate automatisch zu synchronisieren.
                        </p>
                        <Button className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Jetzt verbinden
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontaktdaten für Anfragen</CardTitle>
              <CardDescription>
                Diese Daten werden bei Anfragen an Interessenten weitergegeben
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontaktperson</Label>
                  <Input
                    placeholder="Name der Kontaktperson"
                    value={settings?.contact_name || ""}
                    onChange={(e) => updateListingSettings.mutateAsync({ contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    placeholder="kontakt@beispiel.de"
                    value={settings?.contact_email || ""}
                    onChange={(e) => updateListingSettings.mutateAsync({ contact_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="+49 123 456789"
                  value={settings?.contact_phone || ""}
                  onChange={(e) => updateListingSettings.mutateAsync({ contact_phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automatische Antworten</CardTitle>
              <CardDescription>
                Senden Sie automatisch eine Erst-Antwort bei neuen Anfragen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatische Antwort aktivieren</p>
                  <p className="text-sm text-muted-foreground">
                    Interessenten erhalten sofort eine Bestätigung
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_reply_enabled || false}
                  onCheckedChange={(checked) => updateListingSettings.mutateAsync({ auto_reply_enabled: checked })}
                />
              </div>
              {settings?.auto_reply_enabled && (
                <div className="space-y-2">
                  <Label>Antwort-Text</Label>
                  <Textarea
                    placeholder="Vielen Dank für Ihr Interesse an unserer Wohnung..."
                    rows={4}
                    value={settings?.auto_reply_message || ""}
                    onChange={(e) => updateListingSettings.mutateAsync({ auto_reply_message: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automatisierungen</CardTitle>
              <CardDescription>
                Einstellungen für automatische Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Inserate bei Vermietung deaktivieren</p>
                  <p className="text-sm text-muted-foreground">
                    Wenn eine Einheit vermietet wird, werden die Inserate automatisch pausiert
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_deactivate_on_rental ?? true}
                  onCheckedChange={(checked) => updateListingSettings.mutateAsync({ auto_deactivate_on_rental: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">E-Mail-Benachrichtigung bei Anfragen</p>
                  <p className="text-sm text-muted-foreground">
                    Erhalten Sie eine E-Mail bei jeder neuen Anfrage
                  </p>
                </div>
                <Switch
                  checked={settings?.notify_on_inquiry ?? true}
                  onCheckedChange={(checked) => updateListingSettings.mutateAsync({ notify_on_inquiry: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Listing Editor Dialog */}
      <ListingEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        listing={selectedListing}
      />
    </div>
    </MainLayout>
  );
}
