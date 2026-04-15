export default function ContactDetailLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-2 bg-gray-100 rounded animate-pulse" />
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-6">
        {/* Contact info skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-5" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Leads skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Activities skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
