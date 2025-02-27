export default function WingIndicator({ index }) {
  return (
  <>
    {index == 0 && <div className="w-4 h-12 border-l border-t border-gray-500 rounded-sm"></div>}
    {index == 1 && <div className="w-4 h-12 border-l border-b border-gray-500 rounded-sm"></div>}
  </>
  );
}

