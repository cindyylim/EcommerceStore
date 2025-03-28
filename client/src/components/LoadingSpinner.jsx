const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 space-x-2">
      <div className="w-20 h-20 rounded-full animate-spin border-2 border-t-2 border-gray-200 border-t-yellow-500"></div>
      <div className="sr-only">Loading</div>
    </div>
  );
};

export default LoadingSpinner;
