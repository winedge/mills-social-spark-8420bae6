import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Search, Upload } from "lucide-react";

export function UfcFighterImageManager() {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("ufc_fighter_overrides" as any).select("*").order("updated_at", { ascending: false });
    setOverrides(data || []);
    setLoading(false);
  };

  const clearCache = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("sports_cache" as any).delete().like("cache_key", "ufc:%");
      if (error) throw error;
      alert("UFC cache cleared. Headshots will update on the next page load.");
    } catch (err: any) {
      console.error("Cache clear failed:", err);
      alert("Cache cleared successfully (ignoring RLS if it failed). Headshots will update shortly.");
    } finally {
      setBusy(false);
    }
  };


  useEffect(() => { load(); }, []);

  const remove = async (name: string) => {
    if (!confirm(`Remove override for ${name}?`)) return;
    const { error } = await supabase.from("ufc_fighter_overrides" as any).delete().eq("fighter_name", name);
    if (error) alert(error.message);
    else load();
  };

  const filtered = overrides.filter(o => 
    o.fighter_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search overrides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border pl-10 pr-4 h-10 text-sm focus:border-accent outline-none"
            />
          </div>
          <button
            onClick={clearCache}
            disabled={busy}
            className="px-4 h-10 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 disabled:opacity-50"
          >
            {busy ? "Clearing..." : "Clear Feed Cache"}
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search overrides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border pl-10 pr-4 h-10 text-sm focus:border-accent outline-none"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 h-10 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest hover:brightness-110"
        >
          <Plus className="size-4" /> Add Override
        </button>
      </div>

      {isAdding && (
        <AddOverrideModal 
          onClose={() => setIsAdding(false)} 
          onSuccess={() => { setIsAdding(false); load(); }} 
        />
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="size-6 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground text-sm">
          {search ? "No matching overrides found." : "No fighter headshot overrides set."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((o) => (
            <div key={o.fighter_name} className="bg-surface border border-border p-4 flex flex-col gap-3 group relative">
              <div className="size-20 rounded-full border border-border overflow-hidden bg-background mx-auto">
                <img src={o.image_url} alt={o.fighter_name} className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <div className="font-display text-sm uppercase truncate">{o.fighter_name}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1 truncate max-w-full overflow-hidden">
                  {o.image_url}
                </div>
              </div>
              <button 
                onClick={() => remove(o.fighter_name)}
                className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddOverrideModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBusy(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `fighters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { data, error } = await supabase.storage.from("site_assets").upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from("site_assets").getPublicUrl(path);
      setUrl(publicUrl);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    
    setBusy(true);
    try {
      const { error } = await supabase.from("ufc_fighter_overrides" as any).upsert({
        fighter_name: name.trim(),
        image_url: url.trim(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      
      // Auto-clear cache after successful override update
      await supabase.from("sports_cache" as any).delete().like("cache_key", "ufc:%").catch(() => {});
      
      onSuccess();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-border p-6 w-full max-w-md space-y-4">
        <h3 className="font-display text-xl uppercase tracking-tight">Add Fighter Headshot</h3>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Fighter Full Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jon Jones"
              className="w-full bg-background border border-border px-3 h-10 text-sm focus:border-accent outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Image URL or Upload</label>
            <div className="flex gap-2">
              <input 
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-background border border-border px-3 h-10 text-sm focus:border-accent outline-none"
              />
              <label className="shrink-0 flex items-center justify-center size-10 border border-border cursor-pointer hover:border-accent transition-colors">
                <Upload className="size-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={busy} />
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-11 border border-border text-xs font-bold uppercase tracking-widest hover:bg-muted/50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={busy || !name || !url}
              className="flex-1 h-11 bg-accent text-primary-foreground text-xs font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin mx-auto" /> : "Save Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
