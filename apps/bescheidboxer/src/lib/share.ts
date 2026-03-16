/**
 * Share calculator results via Web Share API or clipboard fallback.
 */

export interface ShareData {
  title: string
  text: string
  url?: string
}

export async function shareResult(data: ShareData): Promise<boolean> {
  // Try native Web Share API first (mobile/modern browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.href,
      })
      return true
    } catch {
      // User cancelled or API failed - fall through to clipboard
    }
  }

  // Fallback: Copy to clipboard
  const shareText = `${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`
  try {
    await navigator.clipboard.writeText(shareText)
    return true
  } catch {
    return false
  }
}
