export const Cloud = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <div className="w-24 h-16 bg-white rounded-full relative">
        <div className="absolute -top-6 left-4 w-12 h-12 bg-white rounded-full" />
        <div className="absolute -top-4 left-12 w-10 h-10 bg-white rounded-full" />
      </div>
    </div>
  );
};

