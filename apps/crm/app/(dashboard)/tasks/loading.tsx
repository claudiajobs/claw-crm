export default function TasksLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-6">
        {[0, 1, 2].map((group) => (
          <div key={group}>
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse mb-3" />
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
