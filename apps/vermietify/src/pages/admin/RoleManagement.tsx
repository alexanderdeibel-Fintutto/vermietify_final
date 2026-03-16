import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRoles, Permission } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/shared";
import {
  Shield,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Users,
  Lock,
} from "lucide-react";

export default function RoleManagement() {
  const { toast } = useToast();
  const { roles, permissions, createRole } = useRoles();
  const [showDialog, setShowDialog] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const allRoles = roles.data || [];
  const allPermissions = permissions.data || [];

  // Group permissions by module
  const permissionsByModule = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const mod = perm.module || "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleCreateRole = () => {
    if (!roleName.trim()) {
      toast({ title: "Fehler", description: "Rollenname ist erforderlich", variant: "destructive" });
      return;
    }
    createRole.mutate(
      { name: roleName, description: roleDescription, permissionIds: selectedPermissions },
      {
        onSuccess: () => {
          setShowDialog(false);
          setRoleName("");
          setRoleDescription("");
          setSelectedPermissions([]);
        },
      }
    );
  };

  const handleOpenDialog = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setShowDialog(true);
  };

  if (roles.isLoading || permissions.isLoading) {
    return (
      <MainLayout title="Rollenverwaltung">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Rollenverwaltung">
      <div className="space-y-6">
        <PageHeader
          title="Rollenverwaltung"
          subtitle="Rollen erstellen und verwalten, um Zugriffsrechte zu steuern"
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Rollen" },
          ]}
          actions={
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Rolle
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allRoles.length}</p>
                  <p className="text-sm text-muted-foreground">Rollen gesamt</p>
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
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {allRoles.filter((r) => r.is_system_role).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Systemrollen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alle Rollen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Berechtigungen</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="w-[70px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.role_permissions?.length || 0} Berechtigungen
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.is_system_role ? (
                        <Badge className="bg-amber-100 text-amber-800">System</Badge>
                      ) : (
                        <Badge variant="outline">Benutzerdefiniert</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplizieren
                          </DropdownMenuItem>
                          {!role.is_system_role && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {allRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Keine Rollen vorhanden. Erstellen Sie Ihre erste Rolle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Rolle erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rollenname</Label>
                <Input
                  placeholder="z.B. Hausverwalter"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input
                  placeholder="Kurze Beschreibung der Rolle"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Berechtigungen</Label>
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <Card key={module}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium capitalize">
                      {module}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-start gap-2">
                          <Checkbox
                            id={perm.id}
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => handleTogglePermission(perm.id)}
                          />
                          <div className="grid gap-0.5 leading-none">
                            <label
                              htmlFor={perm.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {perm.name}
                            </label>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {Object.keys(permissionsByModule).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Keine Berechtigungen verfügbar.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateRole} disabled={createRole.isPending}>
              {createRole.isPending ? "Erstelle..." : "Rolle erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
