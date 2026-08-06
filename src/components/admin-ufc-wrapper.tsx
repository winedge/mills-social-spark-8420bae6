import { useState } from "react";
import { AdminUfcSection } from "./admin-ufc-section";
import { UfcFighterImageManager } from "./admin-ufc-image-manager";
import { Tv, Image as ImageIcon } from "lucide-react";

export function UfcAdminWrapper() {
  const [tab, setTab] = useState<"streaming" | "images">("streaming");

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("streaming")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${
            tab === "streaming" ? "border-b-2 border-accent text-accent" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tv className="size-3.5" /> Streaming Management
        </button>
        <button
          onClick={() => setTab("images")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${
            tab === "images" ? "border-b-2 border-accent text-accent" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="size-3.5" /> Fighter Headshots
        </button>
      </div>

      <div className="mt-6">
        {tab === "streaming" ? <AdminUfcSection /> : <UfcFighterImageManager />}
      </div>
    </div>
  );
}
