import HookahView from "@/app/components/HookahView.js";
import { Suspense } from "react";


export default function HookahRoute() {
  return (
    <Suspense
      fallback={<p style={{ padding: 40, textAlign: "center" }}>Loading...</p>}
    >
      <HookahView />
    </Suspense>
  );
}
