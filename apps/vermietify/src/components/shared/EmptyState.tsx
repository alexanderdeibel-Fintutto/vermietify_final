import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode | {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;
    
    // Check if action is a ReactNode (has type property) or plain object
    if (typeof action === "object" && "label" in action && "onClick" in action) {
      return (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      );
    }
    
    // ReactNode
    return action;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {renderAction()}
    </div>
  );
}
