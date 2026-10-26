import type { Metadata } from "next";

import { PcBuilderWorkbench } from "@/components/pc-builder/pc-builder-workbench";

export const metadata: Metadata = {
  title: "Build Workbench",
  description: "Select compatible PC components in the TechBondhu build workbench.",
};

export default function PcBuilderWorkbenchPage() {
  return <PcBuilderWorkbench />;
}
