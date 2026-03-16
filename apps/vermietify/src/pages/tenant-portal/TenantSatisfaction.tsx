import { useState } from "react";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Star,
  CheckCircle,
  Loader2,
  ClipboardList,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: "q1",
    question: "Wie zufrieden sind Sie mit dem allgemeinen Zustand Ihrer Wohnung?",
    category: "Wohnqualität",
  },
  {
    id: "q2",
    question: "Wie bewerten Sie die Reaktionszeit bei Reparaturanfragen?",
    category: "Service",
  },
  {
    id: "q3",
    question: "Wie zufrieden sind Sie mit der Kommunikation der Hausverwaltung?",
    category: "Kommunikation",
  },
  {
    id: "q4",
    question: "Wie bewerten Sie die Sauberkeit der Gemeinschaftsflächen?",
    category: "Gebäude",
  },
  {
    id: "q5",
    question: "Wie wahrscheinlich ist es, dass Sie uns weiterempfehlen?",
    category: "Gesamtbewertung",
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hovered || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          {value === 1 && "Sehr unzufrieden"}
          {value === 2 && "Unzufrieden"}
          {value === 3 && "Neutral"}
          {value === 4 && "Zufrieden"}
          {value === 5 && "Sehr zufrieden"}
        </span>
      )}
    </div>
  );
}

export default function TenantSatisfaction() {
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Simulated active survey check
  const hasSurvey = true;

  const handleRatingChange = (questionId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = surveyQuestions.every((q) => ratings[q.id] > 0) && overallRating > 0;

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({ title: "Vielen Dank!", description: "Ihre Bewertung wurde erfolgreich übermittelt." });
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <TenantLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Zufriedenheitsumfrage</h1>
            <p className="text-muted-foreground">
              Helfen Sie uns, unseren Service zu verbessern.
            </p>
          </div>

          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Vielen Dank!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ihre Bewertung hilft uns, unseren Service stetig zu verbessern.
                  Wir schätzen Ihr Feedback sehr.
                </p>
                <div className="flex items-center justify-center gap-1 pt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-6 w-6",
                        overallRating >= star
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ihre Gesamtbewertung: {overallRating} von 5 Sternen
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    );
  }

  if (!hasSurvey) {
    return (
      <TenantLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Zufriedenheitsumfrage</h1>
            <p className="text-muted-foreground">
              Helfen Sie uns, unseren Service zu verbessern.
            </p>
          </div>

          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Keine aktive Umfrage</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Derzeit gibt es keine aktive Zufriedenheitsumfrage. Wir benachrichtigen Sie,
                  sobald eine neue Umfrage verfügbar ist.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Zufriedenheitsumfrage</h1>
          <p className="text-muted-foreground">
            Helfen Sie uns, unseren Service zu verbessern. Ihre Antworten sind anonym.
          </p>
        </div>

        {/* Overall Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Gesamtbewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Wie zufrieden sind Sie insgesamt mit Ihrer Mieterfahrung?
            </p>
            <StarRating value={overallRating} onChange={setOverallRating} />
          </CardContent>
        </Card>

        {/* Category Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Detailbewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {surveyQuestions.map((question) => (
                <div key={question.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 rounded px-2 py-0.5">
                      {question.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{question.question}</p>
                  <StarRating
                    value={ratings[question.id] || 0}
                    onChange={(val) => handleRatingChange(question.id, val)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comment */}
        <Card>
          <CardHeader>
            <CardTitle>Zusätzliche Anmerkungen</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Haben Sie weitere Anregungen oder Verbesserungsvorschläge? (Optional)"
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Bewertung absenden
          </Button>
        </div>
      </div>
    </TenantLayout>
  );
}
