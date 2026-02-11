import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useContracts } from "@/hooks/useContracts";
import { Euro, Calendar } from "lucide-react";

interface ContractEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

export function ContractEditDialog({
  open,
  onOpenChange,
  contract,
}: ContractEditDialogProps) {
  const { updateContract } = useContracts();

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    rentAmount: 0,
    utilityAdvance: 0,
    depositAmount: 0,
    depositPaid: false,
    paymentDay: 1,
  });

  useEffect(() => {
    if (contract && open) {
      setFormData({
        startDate: contract.start_date || "",
        endDate: contract.end_date || "",
        rentAmount: (contract.rent_amount || 0) / 100,
        utilityAdvance: (contract.utility_advance || 0) / 100,
        depositAmount: (contract.deposit_amount || 0) / 100,
        depositPaid: contract.deposit_paid || false,
        paymentDay: contract.payment_day || 1,
      });
    }
  }, [contract, open]);

  const handleSave = () => {
    updateContract.mutate(
      {
        id: contract.id,
        data: {
          start_date: formData.startDate,
          end_date: formData.endDate || undefined,
          rent_amount: Math.round(formData.rentAmount * 100),
          utility_advance: Math.round(formData.utilityAdvance * 100),
          deposit_amount: Math.round(formData.depositAmount * 100),
          deposit_paid: formData.depositPaid,
          payment_day: formData.paymentDay,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const totalRent = formData.rentAmount + formData.utilityAdvance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vertrag bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Mietbeginn *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Mietende</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Rent */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentAmount">Kaltmiete (€) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="rentAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.rentAmount || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rentAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="utilityAdvance">Nebenkosten (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="utilityAdvance"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.utilityAdvance || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      utilityAdvance: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Gesamtmiete</span>
            <span className="text-lg font-bold">
              {totalRent.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>

          {/* Deposit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Kaution (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.depositAmount || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      depositAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDay">Zahlungstag</Label>
              <Input
                id="paymentDay"
                type="number"
                min={1}
                max={28}
                value={formData.paymentDay}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    paymentDay: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>

          {/* Deposit paid toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="depositPaid">Kaution bezahlt</Label>
            <Switch
              id="depositPaid"
              checked={formData.depositPaid}
              onCheckedChange={(checked) =>
                setFormData((p) => ({ ...p, depositPaid: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.startDate || updateContract.isPending}
          >
            {updateContract.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
