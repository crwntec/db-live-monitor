import Navbar from "@/components/Navbar";
import Skeleton from "@/components/board/Skeleton";
export default function Loading() {
  return (
    <>
      <Navbar title={''} referring={''} />
      <div className="flex flex-col space-y-2">
        <ul className="animate-pulse list-none">
            {Array.from({ length: 10 }).map((_, index) => (
              <li key={index} className="border-b border-gray-700">
                <div className="flex flex-col gap-2 px-3 py-2">
                  <div className="flex flex-col">
                  <div className="flex">
                    <div className="max-w-full flex-shrink-0">
                      <Skeleton className="w-[304px] max-w-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="px-1 w-20 h-10 flex items-center justify-center shrink-0">
                      <div>
                        <Skeleton className="w-[32px] max-w-full" />
                      </div>
                    </div>
                    <span>
                      <Skeleton className="w-[80px] max-w-full" />
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="hidden sm:block">
                      <Skeleton className="w-[56px] max-w-full" />
                    </div>
                    <div className="flex flex-col items-end ml-1 sm:w-10 w-24">
                      <div>
                        <Skeleton className="w-[40px] max-w-full" />
                      </div>
                      <div>
                        <Skeleton className="w-[40px] max-w-full" />
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}
