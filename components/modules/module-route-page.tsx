import { LocalWorkspacePage } from "@/components/modules/local-workspace-page";
import { modulePages } from "@/lib/module-pages";

export function ModuleRoutePage({ pageKey }: { pageKey: keyof typeof modulePages }) {
  return <LocalWorkspacePage pageKey={pageKey} />;
}
