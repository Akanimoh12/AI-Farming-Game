export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-300 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="spinner h-16 w-16 mx-auto glow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🍊</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-gradient">
            Orange Farm
          </h2>
          <p className="text-gray-400">Loading your farm...</p>
        </div>
      </div>
    </div>
  )
}
