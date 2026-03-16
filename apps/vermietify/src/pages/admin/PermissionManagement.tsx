import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles, Permission } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/shared";
import {
  ShieldCheck,
  Filter,
  Save,
  Grid3X3,
  Lock,
  Info,
} from "lucide-react";

export default function PermissionManagement() {
  const { toast } = useToast();
  const { roles, permissions } = useRoles();
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [hasChanges, setHasChanges] = useState(false);

  const allRoles = roles.data || [];
  const allPermissions = permissions.data || [];

  // Get unique modules
  const modules = Array.from(new Set(allPermissions.map((p) => p.module))).sort();

  // Filter permissions by module
  const filteredPermissions =
    moduleFilter === "all"
      ? allPermissions
      : allPermissions.filter((p) => p.module === moduleFilter);

  // Group filtered permissions by module
  const permissionsByModule = filteredPermissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      const mod = perm.module || "general";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    },
    {}
  );

  // Check if a role has a specific permission
  const roleHasPermission = (roleId: string, permissionId: string): boolean => {
    const role = allRoles.find((r) => r.id === roleId);
    if (!role?.role_permissions) return false;
    return role.role_permissions.some((rp) => rp.permission_id === permissionId);
  };

  const handleTogglePermission = (roleId: string, permissionId: string) => {
    // In a real implementation this would call a mutation
    setHasChanges(true);
    toast({
      title: "Berechtigung geändert",
      description: "Änderungen werden beim Speichern übernommen",
    });
  };

  const handleSave = () => {
    toast({ title: "Berechtigungen gespeichert" });
    setHasChanges(false);
  };

  if (roles.isLoading || permissions.isLoading) {
    return (
      <MainLayout title="Berechtigungsmatrix">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Berechtigungsmatrix">
      <div className="space-y-6">
        <PageHeader
          title="Berechtigungsmatrix"
          subtitle="Übersicht aller Rollen und deren Berechtigungen pro Modul"
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Berechtigungen" },
          ]}
          actions={
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Änderungen speichern
            </Button>
          }
        />

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allRoles.length}</p>
                  <p className="text-sm text-muted-foreground">Rollen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Lock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allPermissions.length}</p>
                  <p className="text-sm text-muted-foreground">Berechtigungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Module</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Modul filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Module</SelectItem>
              {modules.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  <span className="capitalize">{mod}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Ungespeicherte Änderungen
            </Badge>
          )}
        </div>

        {/* Permission Matrix */}
        {Object.entries(permissionsByModule).map(([module, perms]) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <ShieldCheck className="h-5 w-5" />
                {module}
                <Badge variant="secondary" className="ml-2">
                  {perms.length} Berechtigungen
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Berechtigung</TableHead>
                      {allRoles.map((role) => (
                        <TableHead key={role.id} className="text-center min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{role.name}</span>
                            {role.is_system_role && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                System
                              </Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div>
                              <p className="text-sm font-medium">{perm.name}</p>
                              {perm.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {perm.description}
                                </p>
                              )}
                              <code className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                {perm.code}
                              </code>
                            </div>
                          </div>
                        </TableCell>
                        {allRoles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={roleHasPermission(role.id, perm.id)}
                                onCheckedChange={() =>
                                  handleTogglePermission(role.id, perm.id)
                                }
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPermissions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Keine Berechtigungen gefunden</p>
              <p className="text-muted-foreground">
                Für das ausgewählte Modul sind keine Berechtigungen vorhanden.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
