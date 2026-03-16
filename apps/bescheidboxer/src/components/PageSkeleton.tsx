export function DashboardSkeleton() {
  return (
    <div className="container py-8 animate-pulse">
      <div className="h-8 bg-muted rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  )
}

export function RechnerSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 bg-muted rounded w-32 mb-4" />
      <div className="h-10 bg-muted rounded w-64 mb-2" />
      <div className="h-5 bg-muted rounded w-96 mb-8" />
      <div className="bg-muted rounded-xl h-96" />
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="container py-8 animate-pulse">
      <div className="h-8 bg-muted rounded w-56 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-pulse">
      <div className="border-b p-4">
        <div className="h-6 bg-muted rounded w-40" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="h-16 bg-muted rounded-xl w-3/4" />
        <div className="h-12 bg-muted rounded-xl w-1/2 ml-auto" />
        <div className="h-16 bg-muted rounded-xl w-2/3" />
      </div>
      <div className="border-t p-4">
        <div className="h-12 bg-muted rounded-xl" />
      </div>
    </div>
  )
}

export default function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Wird geladen...</span>
      </div>
    </div>
  )
}
