const LoadingItem: React.FC = () => (
  <div className="h-3 animate-pulse rounded bg-slate-300" />
);

/**
 * Represents a loading state when the query to fetch the session's items
 * has not fully resolved
 */
const LoadingList: React.FC<{ itemCount: number }> = ({ itemCount }) => {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 p-4">
      {Array.from({ length: itemCount }, (_, index) => (
        <LoadingItem key={`loading-list-${index}`} />
      ))}
    </div>
  );
};

export default LoadingList;
