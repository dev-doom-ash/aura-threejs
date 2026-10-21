"use client";

import dynamic from "next/dynamic";
import Overlay from "./Overlay";
import Loader from "./Loader";
import Cursor from "./Cursor";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function App() {
  return (
    <main className="relative">
      <Scene />
      <Overlay />
      <Loader />
      <Cursor />
    </main>
  );
}
