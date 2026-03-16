import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Plus, Check, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  is_personal: boolean;
}

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, [profile?.organization_id]);

  const fetchOrganizations = async () => {
    // Fetch organizations where user is a member
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("organization_id")
      .eq("accepted_at", "NOT NULL");

    // Also include current organization
    const { data: currentOrg } = await supabase
      .from("organizations")
      .select("id, name, is_personal")
      .eq("id", profile?.organization_id || "")
      .single();

    if (currentOrg) {
      setSelectedOrg(currentOrg);
      
      // For now, just show the current org
      // Multi-org support will come from memberships
      setOrganizations([currentOrg]);
    }
  };

  const handleSelectOrg = async (org: Organization) => {
    if (org.id === selectedOrg?.id) {
      setOpen(false);
      return;
    }

    // Update profile with new organization_id
    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: org.id })
      .eq("id", profile?.id);

    if (!error) {
      setSelectedOrg(org);
      await refreshProfile();
      // Refresh the page to load new org data
      window.location.reload();
    }

    setOpen(false);
  };

  if (organizations.length <= 1) {
    return null; // Don't show switcher if only one org
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedOrg?.name || "Organisation wählen"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Suchen..." />
          <CommandList>
            <CommandEmpty>Keine Organisation gefunden.</CommandEmpty>
            <CommandGroup heading="Organisationen">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSelectOrg(org)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrg?.id === org.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{org.name}</span>
                  {org.is_personal && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Privat
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate("/admin/organisationen");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Neue Organisation
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
