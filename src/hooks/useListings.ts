import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
type ListingPortalRow = Database["public"]["Tables"]["listing_portals"]["Row"];
type ListingInquiryRow = Database["public"]["Tables"]["listing_inquiries"]["Row"];
type PortalConnectionRow = Database["public"]["Tables"]["portal_connections"]["Row"];
type ListingSettingsRow = Database["public"]["Tables"]["listing_settings"]["Row"];

type ListingStatus = Database["public"]["Enums"]["listing_status"];
type PortalType = Database["public"]["Enums"]["portal_type"];
type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];

const LISTINGS_KEY = "listings";
const INQUIRIES_KEY = "listing_inquiries";
const PORTALS_KEY = "portal_connections";
const SETTINGS_KEY = "listing_settings";

export interface ListingFormData {
  unit_id: string;
  title: string;
  description?: string;
  rent_cold: number;
  rent_additional?: number;
  heating_included?: boolean;
  heating_costs?: number;
  deposit?: number;
  commission?: string;
  features?: Record<string, boolean>;
  photos?: string[];
  main_photo_index?: number;
  available_from?: string;
  energy_certificate_type?: string;
  energy_value?: number;
  energy_class?: string;
  status?: ListingStatus;
  portals?: PortalType[];
}

export interface ListingWithDetails extends ListingRow {
  unit?: {
    id: string;
    unit_number: string;
    area: number;
    rooms: number;
    floor?: number;
    building?: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
  };
  portals?: ListingPortalRow[];
  inquiry_count?: number;
}

// Feature options for listings
export const LISTING_FEATURES = {
  balcony: "Balkon",
  terrace: "Terrasse",
  garden: "Garten",
  fitted_kitchen: "Einbauküche",
  cellar: "Keller",
  attic: "Dachboden",
  elevator: "Aufzug",
  parking: "Stellplatz",
  garage: "Garage",
  accessible: "Barrierefrei",
  pets_allowed: "Haustiere erlaubt",
  furnished: "Möbliert",
  washing_machine: "Waschmaschinenanschluss",
  guest_toilet: "Gäste-WC",
  floor_heating: "Fußbodenheizung",
};

// Portal information
export const PORTAL_INFO: Record<PortalType, { name: string; logo: string; color: string }> = {
  immoscout: { name: "ImmoScout24", logo: "🏠", color: "bg-orange-500" },
  immowelt: { name: "Immowelt", logo: "🏢", color: "bg-blue-500" },
  ebay: { name: "eBay Kleinanzeigen", logo: "📦", color: "bg-green-500" },
  website: { name: "Eigene Website", logo: "🌐", color: "bg-purple-500" },
};

export function useListings() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const queryClient = useQueryClient();

  // Fetch all listings with details
  const useListingsList = (status?: ListingStatus) => {
    return useQuery({
      queryKey: [LISTINGS_KEY, "list", status, organizationId],
      queryFn: async () => {
        if (!organizationId) return [];

        let query = supabase
          .from("listings")
          .select(`
            *,
            units!inner(
              id, unit_number, area, rooms, floor,
              buildings(id, name, address, city)
            ),
            listing_portals(*)
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Get inquiry counts
        const listingIds = data?.map(l => l.id) || [];
        const { data: inquiryCounts } = await supabase
          .from("listing_inquiries")
          .select("listing_id")
          .in("listing_id", listingIds);

        const countMap = inquiryCounts?.reduce((acc, i) => {
          acc[i.listing_id] = (acc[i.listing_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        return data?.map(listing => ({
          ...listing,
          unit: {
            ...listing.units,
            building: listing.units.buildings,
          },
          portals: listing.listing_portals,
          inquiry_count: countMap[listing.id] || 0,
        })) as ListingWithDetails[];
      },
      enabled: !!organizationId,
    });
  };

  // Fetch single listing
  const useListing = (id: string | undefined) => {
    return useQuery({
      queryKey: [LISTINGS_KEY, "detail", id],
      queryFn: async () => {
        if (!id) throw new Error("Listing ID required");

        const { data, error } = await supabase
          .from("listings")
          .select(`
            *,
            units!inner(
              id, unit_number, area, rooms, floor,
              buildings(id, name, address, city)
            ),
            listing_portals(*)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        return {
          ...data,
          unit: {
            ...data.units,
            building: data.units.buildings,
          },
          portals: data.listing_portals,
        } as ListingWithDetails;
      },
      enabled: !!id,
    });
  };

  // Create listing
  const createListing = useMutation({
    mutationFn: async (data: ListingFormData) => {
      if (!organizationId) throw new Error("Organization required");

      const { portals, ...listingData } = data;

      const insertData: ListingInsert = {
        organization_id: organizationId,
        unit_id: listingData.unit_id,
        title: listingData.title,
        description: listingData.description,
        rent_cold: Math.round((listingData.rent_cold || 0) * 100),
        rent_additional: Math.round((listingData.rent_additional || 0) * 100),
        heating_included: listingData.heating_included ?? true,
        heating_costs: Math.round((listingData.heating_costs || 0) * 100),
        deposit: Math.round((listingData.deposit || 0) * 100),
        commission: listingData.commission,
        features: listingData.features || {},
        photos: listingData.photos || [],
        main_photo_index: listingData.main_photo_index || 0,
        available_from: listingData.available_from,
        energy_certificate_type: listingData.energy_certificate_type,
        energy_value: listingData.energy_value,
        energy_class: listingData.energy_class,
        status: listingData.status || "draft",
      };

      const { data: listing, error } = await supabase
        .from("listings")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Create portal entries if portals selected
      if (portals && portals.length > 0) {
        const portalEntries = portals.map(portal => ({
          listing_id: listing.id,
          portal,
          status: "pending" as const,
        }));

        await supabase.from("listing_portals").insert(portalEntries);
      }

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
      toast({
        title: "Inserat erstellt",
        description: "Das Inserat wurde erfolgreich angelegt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Inserat konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Update listing
  const updateListing = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ListingFormData> }) => {
      const { portals, ...listingData } = data;

      const updateData: ListingUpdate = {};

      if (listingData.title !== undefined) updateData.title = listingData.title;
      if (listingData.description !== undefined) updateData.description = listingData.description;
      if (listingData.rent_cold !== undefined) updateData.rent_cold = Math.round(listingData.rent_cold * 100);
      if (listingData.rent_additional !== undefined) updateData.rent_additional = Math.round(listingData.rent_additional * 100);
      if (listingData.heating_included !== undefined) updateData.heating_included = listingData.heating_included;
      if (listingData.heating_costs !== undefined) updateData.heating_costs = Math.round(listingData.heating_costs * 100);
      if (listingData.deposit !== undefined) updateData.deposit = Math.round(listingData.deposit * 100);
      if (listingData.commission !== undefined) updateData.commission = listingData.commission;
      if (listingData.features !== undefined) updateData.features = listingData.features;
      if (listingData.photos !== undefined) updateData.photos = listingData.photos;
      if (listingData.main_photo_index !== undefined) updateData.main_photo_index = listingData.main_photo_index;
      if (listingData.available_from !== undefined) updateData.available_from = listingData.available_from;
      if (listingData.energy_certificate_type !== undefined) updateData.energy_certificate_type = listingData.energy_certificate_type;
      if (listingData.energy_value !== undefined) updateData.energy_value = listingData.energy_value;
      if (listingData.energy_class !== undefined) updateData.energy_class = listingData.energy_class;
      if (listingData.status !== undefined) updateData.status = listingData.status;

      const { data: listing, error } = await supabase
        .from("listings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update portals if provided
      if (portals !== undefined) {
        // Remove existing portals
        await supabase.from("listing_portals").delete().eq("listing_id", id);

        // Add new portals
        if (portals.length > 0) {
          const portalEntries = portals.map(portal => ({
            listing_id: id,
            portal,
            status: "pending" as const,
          }));

          await supabase.from("listing_portals").insert(portalEntries);
        }
      }

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
      toast({
        title: "Inserat aktualisiert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Delete listing
  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
      toast({
        title: "Inserat gelöscht",
        description: "Das Inserat wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Das Inserat konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Update listing status
  const updateListingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      const { error } = await supabase
        .from("listings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTINGS_KEY] });
      toast({
        title: "Status aktualisiert",
        description: "Der Inseratsstatus wurde geändert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Der Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    },
  });

  // Fetch inquiries
  const useInquiriesList = (status?: InquiryStatus) => {
    return useQuery({
      queryKey: [INQUIRIES_KEY, "list", status, organizationId],
      queryFn: async () => {
        if (!organizationId) return [];

        let query = supabase
          .from("listing_inquiries")
          .select(`
            *,
            listings!inner(
              id, title,
              units!inner(unit_number, buildings(name, address))
            )
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      enabled: !!organizationId,
    });
  };

  // Update inquiry status
  const updateInquiryStatus = useMutation({
    mutationFn: async ({ id, status, viewingAt }: { id: string; status: InquiryStatus; viewingAt?: string }) => {
      const updateData: Partial<ListingInquiryRow> = { status };
      
      if (status === "contacted") {
        updateData.contacted_at = new Date().toISOString();
      }
      if (status === "viewing" && viewingAt) {
        updateData.viewing_at = viewingAt;
      }

      const { error } = await supabase
        .from("listing_inquiries")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INQUIRIES_KEY] });
      toast({
        title: "Anfrage aktualisiert",
        description: "Der Anfragestatus wurde geändert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Anfrage konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Fetch portal connections
  const usePortalConnections = () => {
    return useQuery({
      queryKey: [PORTALS_KEY, organizationId],
      queryFn: async () => {
        if (!organizationId) return [];

        const { data, error } = await supabase
          .from("portal_connections")
          .select("*")
          .eq("organization_id", organizationId);

        if (error) throw error;
        return data as PortalConnectionRow[];
      },
      enabled: !!organizationId,
    });
  };

  // Connect portal
  const connectPortal = useMutation({
    mutationFn: async ({ portal, credentials }: { portal: PortalType; credentials: Record<string, string> }) => {
      if (!organizationId) throw new Error("Organization required");

      const { error } = await supabase
        .from("portal_connections")
        .upsert({
          organization_id: organizationId,
          portal,
          is_connected: true,
          api_credentials: credentials,
          status: "connected",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTALS_KEY] });
      toast({
        title: "Portal verbunden",
        description: "Die Verbindung wurde erfolgreich hergestellt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Verbindung konnte nicht hergestellt werden.",
        variant: "destructive",
      });
    },
  });

  // Disconnect portal
  const disconnectPortal = useMutation({
    mutationFn: async (portal: PortalType) => {
      if (!organizationId) throw new Error("Organization required");

      const { error } = await supabase
        .from("portal_connections")
        .update({
          is_connected: false,
          status: "disconnected",
          api_credentials: {},
        })
        .eq("organization_id", organizationId)
        .eq("portal", portal);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PORTALS_KEY] });
      toast({
        title: "Portal getrennt",
        description: "Die Verbindung wurde getrennt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Verbindung konnte nicht getrennt werden.",
        variant: "destructive",
      });
    },
  });

  // Fetch listing settings
  const useListingSettings = () => {
    return useQuery({
      queryKey: [SETTINGS_KEY, organizationId],
      queryFn: async () => {
        if (!organizationId) return null;

        const { data, error } = await supabase
          .from("listing_settings")
          .select("*")
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (error) throw error;
        return data as ListingSettingsRow | null;
      },
      enabled: !!organizationId,
    });
  };

  // Update listing settings
  const updateListingSettings = useMutation({
    mutationFn: async (data: Partial<ListingSettingsRow>) => {
      if (!organizationId) throw new Error("Organization required");

      const { error } = await supabase
        .from("listing_settings")
        .upsert({
          organization_id: organizationId,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Die Änderungen wurden gespeichert.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    },
  });

  // Get statistics
  const useListingStats = () => {
    return useQuery({
      queryKey: [LISTINGS_KEY, "stats", organizationId],
      queryFn: async () => {
        if (!organizationId) return null;

        // Get active listings count
        const { count: activeCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", "active");

        // Get inquiries this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { count: weeklyInquiries } = await supabase
          .from("listing_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .gte("created_at", weekAgo.toISOString());

        // Get connected portals count
        const { count: connectedPortals } = await supabase
          .from("portal_connections")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("is_connected", true);

        // Get new inquiries count
        const { count: newInquiries } = await supabase
          .from("listing_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", "new");

        return {
          activeListings: activeCount || 0,
          weeklyInquiries: weeklyInquiries || 0,
          connectedPortals: connectedPortals || 0,
          newInquiries: newInquiries || 0,
        };
      },
      enabled: !!organizationId,
    });
  };

  return {
    useListingsList,
    useListing,
    createListing,
    updateListing,
    deleteListing,
    updateListingStatus,
    useInquiriesList,
    updateInquiryStatus,
    usePortalConnections,
    connectPortal,
    disconnectPortal,
    useListingSettings,
    updateListingSettings,
    useListingStats,
  };
}
