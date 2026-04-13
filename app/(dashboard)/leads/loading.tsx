export default function LeadsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-50">
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-100 rounded animate-pulse"
                  style={{ width: `${60 + (j * 10) % 40}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
