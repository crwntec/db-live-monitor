import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { Skeleton, SVGSkeleton } from "@/components/journey/Skeleton";

export default function Loading() {
  return (
    <>
      <ScrollToTop />{" "}
      {/* Weird workaround for resetting scroll position on navigation */}
      <div>
        <Navbar title={""} referring={""} />
        <section className="mb-8 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border shadow-md">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SVGSkeleton className="w-[24px] h-[24px]" />
                <span>
                  <Skeleton className="w-[16px] max-w-full" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SVGSkeleton className="w-[24px] h-[24px]" />
                <span>
                  <Skeleton className="w-[24px] max-w-full" />
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SVGSkeleton className="w-[24px] h-[24px]" />
                <span>
                  <Skeleton className="w-[24px] max-w-full" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SVGSkeleton className="w-[24px] h-[24px]" />
                <span>
                  <Skeleton className="w-[176px] max-w-full" />
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="mb-8 p-4">
          <h2 className="mb-3">
            <Skeleton className="w-[104px] max-w-full" />
          </h2>
          <div className="space-y-2">
            <div className="space-y-2">
              <ol className="relative border-l border-gray-200 dark:border-gray-700">
                {Array.from({ length: 10 }).map((_, index) => (
                  <li key={index} className="mb-10 ml-6">
                    <div>
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 border border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex flex-col min-w-[60px]">
                        <div className="flex items-center">
                          <span className="mr-2">
                            <Skeleton className="w-[40px] max-w-full" />
                          </span>
                        </div>
                        <div className="text-yellow-500">
                          <Skeleton className="w-[40px] max-w-full" />
                        </div>
                      </div>
                      <div className="flex justify-between w-full items-center">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <SVGSkeleton className="w-[13px] h-[13px]" />
                            <span>
                              <Skeleton className="w-[224px] max-w-full" />
                            </span>
                          </span>
                          <div>
                            <Skeleton className="w-[88px] max-w-full" />
                          </div>
                        </div>
                        <div>
                          <strong>
                            <Skeleton className="w-[16px] max-w-full" />
                          </strong>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
