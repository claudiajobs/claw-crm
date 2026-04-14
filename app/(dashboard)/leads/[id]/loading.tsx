export default function LeadDetailLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-2">
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Score breakdown skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-10 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Activities skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
