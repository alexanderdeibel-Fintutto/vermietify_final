import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ExternalLink, Sparkles } from "lucide-react";
import { useCalculatorAppsForPage, type CalculatorApp } from "@/hooks/useCalculatorApps";
import { supabase } from "@/integrations/supabase/client";
import { getIconByName } from "@/lib/iconMap";

function ToolMiniCard({ tool }: { tool: CalculatorApp }) {
  const handleOpen = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const sep = tool.app_url.includes("?") ? "&" : "?";
    const url = token ? `${tool.app_url}${sep}access_token=${token}` : tool.app_url;
    window.open(url, "_blank");
  };

  const Icon = getIconByName(tool.icon_name);

  return (
    <button
      onClick={handleOpen}
      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 text-left hover:border-primary/30 hover:bg-accent/50 transition-all group"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tool.name}</p>
        <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
          <Coins className="h-2.5 w-2.5" />
          {tool.credit_cost}
        </Badge>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
      </div>
    </button>
  );
}

export function PortalToolPromo({ maxTools = 3 }: { maxTools?: number }) {
  const location = useLocation();
  const { data: tools } = useCalculatorAppsForPage(location.pathname);

  if (!tools?.length) return null;

  const displayTools = tools.slice(0, maxTools);

  return (
    <Card className="border-dashed border-primary/20 bg-primary/[0.02]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Portal-Tools für diese Seite</span>
        </div>
        <div className="grid gap-2">
          {displayTools.map(tool => (
            <ToolMiniCard key={tool.slug} tool={tool} />
          ))}
        </div>
        {tools.length > maxTools && (
          <Button variant="link" size="sm" className="mt-2 px-0 h-auto" asChild>
            <a href="/portal">Alle {tools.length} Tools anzeigen →</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
