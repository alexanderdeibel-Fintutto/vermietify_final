/**
 * Sanitizes database error messages for user display.
 * Logs full errors for debugging while returning generic messages to users.
 */
export function sanitizeErrorMessage(error: unknown): string {
  // Log full error for debugging (server-side only in production)
  console.error("Database error:", error);

  if (!error || typeof error !== "object") {
    return "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
  }

  const err = error as { code?: string; message?: string };

  // Map common Postgres/Supabase error codes to user-friendly messages
  switch (err.code) {
    // Unique constraint violation
    case "23505":
      if (err.message?.includes("email")) {
        return "Diese E-Mail-Adresse wird bereits verwendet.";
      }
      return "Ein Eintrag mit diesen Daten existiert bereits.";

    // Foreign key violation
    case "23503":
      return "Die Referenz auf einen verknüpften Datensatz ist ungültig.";

    // Not null violation
    case "23502":
      return "Bitte füllen Sie alle erforderlichen Felder aus.";

    // Check constraint violation
    case "23514":
      return "Die eingegebenen Daten entsprechen nicht den Anforderungen.";

    // RLS policy violation (insufficient privileges)
    case "42501":
      return "Sie haben keine Berechtigung für diese Aktion.";

    // Invalid input syntax
    case "22P02":
      return "Die eingegebenen Daten haben ein ungültiges Format.";

    // String data right truncation
    case "22001":
      return "Der eingegebene Text ist zu lang.";

    // Division by zero
    case "22012":
      return "Es ist ein Berechnungsfehler aufgetreten.";

    // Connection errors
    case "08000":
    case "08003":
    case "08006":
      return "Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung.";

    // Authentication errors
    case "28P01":
      return "Authentifizierung fehlgeschlagen.";

    // Supabase-specific auth errors
    case "PGRST301":
      return "Sitzung abgelaufen. Bitte melden Sie sich erneut an.";

    default:
      // Return generic message for unknown errors
      return "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
  }
}

/**
 * Type guard to check if an error has a specific structure
 */
export function isSupabaseError(
  error: unknown
): error is { code: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
