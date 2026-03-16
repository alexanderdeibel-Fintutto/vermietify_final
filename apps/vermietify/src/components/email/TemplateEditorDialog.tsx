import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Eye,
  Variable,
  Bold,
  Italic,
  List,
  ListOrdered,
} from "lucide-react";
import {
  EmailTemplate,
  EMAIL_CATEGORIES,
  EmailCategory,
  PLACEHOLDERS,
  CreateTemplateInput,
} from "@/hooks/useEmailTemplates";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  onSave: (data: CreateTemplateInput) => void;
  isSaving?: boolean;
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  onSave,
  isSaving,
}: TemplateEditorDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EmailCategory>("general");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setSubject(template.subject);
      setBodyHtml(template.body_html);
    } else {
      setName("");
      setCategory("general");
      setSubject("");
      setBodyHtml("<p>Sehr geehrte/r {{mieter.anrede}} {{mieter.name}},</p>\n\n<p></p>\n\n<p>Mit freundlichen Grüßen,<br/>{{vermieter.name}}</p>");
    }
    setActiveTab("edit");
  }, [template, open]);

  const handleSave = () => {
    onSave({
      name,
      category,
      subject,
      body_html: bodyHtml,
    });
  };

  const insertPlaceholder = (placeholder: string, target: "subject" | "body") => {
    if (target === "subject") {
      setSubject((prev) => prev + placeholder);
    } else {
      setBodyHtml((prev) => prev + placeholder);
    }
  };

  const applyFormatting = (format: "bold" | "italic" | "ul" | "ol") => {
    const selection = window.getSelection()?.toString() || "";
    let formatted = "";

    switch (format) {
      case "bold":
        formatted = `<strong>${selection || "Text"}</strong>`;
        break;
      case "italic":
        formatted = `<em>${selection || "Text"}</em>`;
        break;
      case "ul":
        formatted = `<ul>\n  <li>Punkt 1</li>\n  <li>Punkt 2</li>\n</ul>`;
        break;
      case "ol":
        formatted = `<ol>\n  <li>Punkt 1</li>\n  <li>Punkt 2</li>\n</ol>`;
        break;
    }

    setBodyHtml((prev) => prev + formatted);
  };

  // Group placeholders by category
  const groupedPlaceholders = PLACEHOLDERS.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, typeof PLACEHOLDERS>);

  const isValid = name.trim() && subject.trim() && bodyHtml.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Vorlage bearbeiten" : "Neue Vorlage erstellen"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name (intern)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Zahlungserinnerung Standard"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EmailCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Betreff</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Variable className="h-4 w-4 mr-2" />
                    Platzhalter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {Object.entries(groupedPlaceholders).map(([group, placeholders]) => (
                    <div key={group}>
                      <DropdownMenuLabel>{group}</DropdownMenuLabel>
                      {placeholders.map((p) => (
                        <DropdownMenuItem
                          key={p.key}
                          onClick={() => insertPlaceholder(p.key, "subject")}
                        >
                          <code className="text-xs mr-2">{p.key}</code>
                          <span className="text-muted-foreground text-xs">{p.label}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Betreff der E-Mail mit {{platzhaltern}}"
            />
          </div>

          {/* Body Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Inhalt</Label>
              <div className="flex items-center gap-2">
                {/* Formatting buttons */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => applyFormatting("bold")}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => applyFormatting("italic")}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => applyFormatting("ul")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => applyFormatting("ol")}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Variable className="h-4 w-4 mr-2" />
                      Platzhalter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto">
                    {Object.entries(groupedPlaceholders).map(([group, placeholders]) => (
                      <div key={group}>
                        <DropdownMenuLabel>{group}</DropdownMenuLabel>
                        {placeholders.map((p) => (
                          <DropdownMenuItem
                            key={p.key}
                            onClick={() => insertPlaceholder(p.key, "body")}
                          >
                            <code className="text-xs mr-2">{p.key}</code>
                            <span className="text-muted-foreground text-xs">{p.label}</span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
              <TabsList className="mb-2">
                <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Vorschau
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit">
                <Textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>E-Mail-Inhalt als HTML...</p>"
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>

              <TabsContent value="preview">
                <Card className="p-6 min-h-[300px] bg-white">
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Betreff:</p>
                    <p className="font-medium">{subject || "(kein Betreff)"}</p>
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Placeholder Legend */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Verfügbare Platzhalter:</p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.slice(0, 8).map((p) => (
                <Badge key={p.key} variant="outline" className="font-mono text-xs">
                  {p.key}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                +{PLACEHOLDERS.length - 8} weitere
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
