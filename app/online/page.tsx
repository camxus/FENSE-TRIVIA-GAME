
import { Suspense } from "react";
import OnlinePage from "./client";

// Page component
export default async function Page() {
  return <Suspense
    fallback={
      <div className="w-full h-full">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    }
  >
    <OnlinePage />
  </Suspense>;

}
