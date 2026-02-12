import { useState } from "react";
import { useEcosystemApps, type EcosystemApp } from "@/hooks/useEcosystemApps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Send, Sparkles, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EcosystemInviteDialog } from "./EcosystemInviteDialog";

interface EcosystemPromoCardsProps {
  compact?: boolean;
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Kostenlos";
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function calcSavingsPercent(monthly: number, yearly: number): number {
  if (monthly === 0 || yearly === 0) return 0;
  const fullYear = monthly * 12;
  return Math.round(((fullYear - yearly) / fullYear) * 100);
}

function AppCard({ app, onInvite, compact }: { app: EcosystemApp; onInvite: (app: EcosystemApp) => void; compact?: boolean }) {
  const isFree = app.price_monthly_cents === 0;
  const savingsPercent = calcSavingsPercent(app.price_monthly_cents, app.price_yearly_cents);
  const yearlySavedCents = (app.price_monthly_cents * 12) - app.price_yearly_cents;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(135deg, ${app.color_from}, ${app.color_to})` }}
      />
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl text-xl shrink-0"
            style={{ background: `linear-gradient(135deg, ${app.color_from}20, ${app.color_to}20)` }}
          >
            {app.icon_emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight">{app.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{app.tagline}</p>
          </div>
          {isFree && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Gratis
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {app.description}
        </p>

        {!compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {app.features.slice(0, 3).map((f) => (
              <span key={f} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {f}
              </span>
            ))}
            {app.features.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1">+{app.features.length - 3}</span>
            )}
          </div>
        )}

        {/* Price with savings */}
        <div className="flex items-center justify-between mb-3 py-2 px-3 rounded-lg bg-muted/50">
          {isFree ? (
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {app.free_for_target || "Kostenlos"}
              </span>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{formatPrice(app.price_monthly_cents)}</span>
                <span className="text-[10px] text-muted-foreground">/Monat</span>
              </div>
              {app.price_yearly_cents > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    oder {formatPrice(app.price_yearly_cents)}/Jahr
                  </span>
                  {savingsPercent > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      {savingsPercent}% sparen ({formatPrice(yearlySavedCents)})
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
            <a href={app.app_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Öffnen
            </a>
          </Button>
          {app.target_audience !== "vermieter" ? (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs text-white"
              style={{ background: `linear-gradient(135deg, ${app.color_from}, ${app.color_to})` }}
              onClick={() => onInvite(app)}
            >
              <Send className="h-3 w-3 mr-1" />
              Einladen
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs text-white"
              style={{ background: `linear-gradient(135deg, ${app.color_from}, ${app.color_to})` }}
              asChild
            >
              <a href={app.register_url} target="_blank" rel="noopener noreferrer">
                <Sparkles className="h-3 w-3 mr-1" />
                Jetzt testen
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EcosystemPromoCards({ compact }: EcosystemPromoCardsProps) {
  const { data: apps, isLoading } = useEcosystemApps();
  const [inviteApp, setInviteApp] = useState<EcosystemApp | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!apps?.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Fintutto Ökosystem</h3>
        <span className="text-xs text-muted-foreground">– Alle Apps, eine Plattform</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onInvite={setInviteApp} compact={compact} />
        ))}
      </div>

      {inviteApp && (
        <EcosystemInviteDialog
          open={!!inviteApp}
          onOpenChange={(o) => !o && setInviteApp(null)}
          app={inviteApp}
        />
      )}
    </div>
  );
}
