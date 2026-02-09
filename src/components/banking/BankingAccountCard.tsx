import { Building2, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface BankingAccountCardProps {
  account: {
    id: string;
    account_name: string;
    iban: string;
    balance_cents: number;
    balance_date: string | null;
    connection_id: string;
  };
  connection?: {
    id: string;
    bank_name: string;
    bank_logo_url: string | null;
    status: string;
  };
  status: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  };
  formatCurrency: (cents: number) => string;
  onSync: () => void;
  onDelete: () => void;
  isSyncing: boolean;
}

export function BankingAccountCard({
  account,
  connection,
  status,
  formatCurrency,
  onSync,
  onDelete,
  isSyncing,
}: BankingAccountCardProps) {
  const maskIban = (iban: string) => {
    return `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}`;
  };

  return (
    <div className="rounded-2xl backdrop-blur-md bg-card/40 border border-border/30 p-6 flex flex-col gap-4 transition-all hover:bg-card/50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {connection?.bank_logo_url ? (
            <img 
              src={connection.bank_logo_url} 
              alt={connection.bank_name}
              className="h-10 w-10 rounded-xl"
            />
          ) : (
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-lg">{account.account_name}</p>
            <p className="text-sm text-muted-foreground">{connection?.bank_name}</p>
          </div>
        </div>
        <Badge variant={status.variant} className="flex items-center gap-1 rounded-full">
          {status.icon}
          {status.label}
        </Badge>
      </div>

      {/* IBAN & Balance */}
      <div>
        <p className="text-sm text-muted-foreground font-mono tracking-wider mb-2">
          {maskIban(account.iban)}
        </p>
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {formatCurrency(account.balance_cents)}
        </p>
        {account.balance_date && (
          <p className="text-xs text-muted-foreground mt-1">
            Stand: {format(new Date(account.balance_date), "dd.MM.yyyy HH:mm", { locale: de })}
          </p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-border/20">
        <Button 
          variant="ghost" 
          size="sm"
          className="rounded-full"
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link to={`/banking/transaktionen?account=${account.id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="rounded-full text-destructive hover:text-destructive ml-auto"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
