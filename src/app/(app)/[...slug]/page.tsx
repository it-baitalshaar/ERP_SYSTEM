"use client";

import { ModulePage } from "@/components/modules/module-page";
import { simpleModulePages } from "@/lib/simple-module-pages";
import { use } from "react";

export default function GenericModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const path = "/" + slug.join("/");
  const config = simpleModulePages[path];

  if (!config) {
    return (
      <ModulePage
        config={{
          title: slug.map((s) => s.replace(/-/g, " ")).join(" / "),
          description: "Module page",
        }}
      />
    );
  }

  return <ModulePage config={config} />;
}
