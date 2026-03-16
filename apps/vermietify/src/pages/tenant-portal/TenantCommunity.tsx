import { useState } from "react";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, EmptyState } from "@/components/shared";
import { useTenantCommunity, CommunityPost } from "@/hooks/useTenantCommunity";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Pin,
  Send,
  Users,
  ShoppingBag,
  CalendarDays,
  HelpCircle,
  Megaphone,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  general: { label: "Allgemein", icon: Users, color: "bg-blue-100 text-blue-800" },
  marketplace: { label: "Marktplatz", icon: ShoppingBag, color: "bg-green-100 text-green-800" },
  events: { label: "Events", icon: CalendarDays, color: "bg-purple-100 text-purple-800" },
  help: { label: "Hilfe", icon: HelpCircle, color: "bg-orange-100 text-orange-800" },
  announcement: { label: "Ankündigung", icon: Megaphone, color: "bg-red-100 text-red-800" },
};

export default function TenantCommunity() {
  const { data: posts = [], isLoading, createPost, addComment } = useTenantCommunity();

  const [activeCategory, setActiveCategory] = useState("all");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  // New post form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPosts = activeCategory === "all"
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createPost.mutateAsync({
        title: newTitle,
        content: newContent,
        category: newCategory as CommunityPost["category"],
        author_name: "Mieter",
      });
      setShowNewPostDialog(false);
      setNewTitle("");
      setNewContent("");
      setNewCategory("general");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    await addComment.mutateAsync({
      post_id: postId,
      content: text,
      author_name: "Mieter",
    });
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  if (isLoading) {
    return (
      <TenantLayout>
        <LoadingState />
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Community</h1>
            <p className="text-muted-foreground">
              Tauschen Sie sich mit Ihren Nachbarn aus.
            </p>
          </div>
          <Button onClick={() => setShowNewPostDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Beitrag
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="marketplace">Marktplatz</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="help">Hilfe</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            {filteredPosts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Keine Beiträge"
                description="Noch keine Beiträge in dieser Kategorie. Starten Sie die Konversation!"
                action={
                  <Button onClick={() => setShowNewPostDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Beitrag erstellen
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.general;
                  const CatIcon = catConfig.icon;
                  const comments = post.tenant_community_comments || [];
                  const isExpanded = expandedPost === post.id;

                  return (
                    <Card key={post.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {post.is_pinned && (
                              <Pin className="h-4 w-4 text-primary mt-1 shrink-0" />
                            )}
                            <div>
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {post.author_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(post.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={catConfig.color}>
                            <CatIcon className="h-3 w-3 mr-1" />
                            {catConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {isExpanded ? post.content : post.content.slice(0, 200)}
                          {!isExpanded && post.content.length > 200 && "..."}
                        </p>

                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{post.likes_count}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {comments.length} Kommentare
                          </Button>
                        </div>

                        {/* Comment Section */}
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {comments.length > 0 && (
                              <div className="space-y-2 pl-4 border-l-2">
                                {comments.map((comment) => (
                                  <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium">
                                        {comment.author_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(comment.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Input
                                placeholder="Kommentar schreiben..."
                                value={commentText[post.id] || ""}
                                onChange={(e) =>
                                  setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentText[post.id]?.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Beitrag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Allgemein</SelectItem>
                  <SelectItem value="marketplace">Marktplatz</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="help">Hilfe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titel des Beitrags"
              />
            </div>

            <div className="space-y-2">
              <Label>Inhalt *</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Was möchten Sie teilen?"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Veröffentlichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
