export default function PipelineLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-1.5" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col min-w-[220px] max-w-[220px] bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="px-3 py-2.5 border-b border-gray-200">
              <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                <div
                  key={j}
                  className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
                >
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
