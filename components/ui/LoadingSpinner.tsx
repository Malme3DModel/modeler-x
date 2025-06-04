export default function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100" data-testid="loading-spinner">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-gray-600">OpenCascade.js を読み込み中...</p>
      </div>
    </div>
  );
} 