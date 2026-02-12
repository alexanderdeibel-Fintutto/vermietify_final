import {
  Calculator, TrendingUp, Shield, Landmark, BarChart3, Receipt, PiggyBank,
  FileText, ClipboardCheck, UserCheck, FileSpreadsheet, PenTool,
  Scale, AlertTriangle, Search, ClipboardList, XCircle, Lock,
  MinusCircle, Home, Hammer, Paintbrush, Leaf, Building2, HelpCircle,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  calculator: Calculator,
  "trending-up": TrendingUp,
  shield: Shield,
  landmark: Landmark,
  "bar-chart-3": BarChart3,
  receipt: Receipt,
  "piggy-bank": PiggyBank,
  "file-text": FileText,
  "clipboard-check": ClipboardCheck,
  "user-check": UserCheck,
  "file-spreadsheet": FileSpreadsheet,
  "pen-tool": PenTool,
  scale: Scale,
  "alert-triangle": AlertTriangle,
  search: Search,
  "clipboard-list": ClipboardList,
  "x-circle": XCircle,
  lock: Lock,
  "minus-circle": MinusCircle,
  home: Home,
  hammer: Hammer,
  paintbrush: Paintbrush,
  leaf: Leaf,
  "building-2": Building2,
};

export function getIconByName(name: string): LucideIcon {
  return iconMap[name] ?? HelpCircle;
}
