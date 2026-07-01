export function SiteFooter() {
  return (
    <footer id="visit" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div className="font-display text-6xl md:text-7xl uppercase mb-8 leading-[0.9]">
            Come <br />
            <span className="text-accent">hang.</span>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <p>425 S MILL AVE, TEMPE, AZ 85281</p>
            <p className="text-muted-foreground">SUN–THU · 11AM – 12AM</p>
            <p className="text-muted-foreground">FRI–SAT · 11AM – 2AM</p>
            <p className="text-muted-foreground pt-3">(480) 555-0142</p>
          </div>
        </div>
        <div className="bg-accent/5 p-10 md:p-12 border border-accent/20 flex flex-col justify-between gap-12">
          <div>
            <h6 className="font-display text-3xl uppercase mb-4">Join the circle</h6>
            <p className="text-sm text-muted-foreground mb-8">
              Big games, watch parties, and private events — straight to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-3 border-b border-foreground/20 pb-2">
              <input
                type="email"
                required
                placeholder="EMAIL ADDRESS"
                className="bg-transparent flex-1 py-2 text-sm outline-none font-mono placeholder:text-muted-foreground"
              />
              <button className="font-display text-sm tracking-widest uppercase hover:text-accent transition-colors">
                Join →
              </button>
            </form>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent">Instagram</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent">X / Twitter</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-accent">TikTok</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-2 opacity-50 text-[10px] font-mono tracking-tighter">
        <span>© 2026 MILLS MODERN SOCIAL · ALL RIGHTS RESERVED</span>
        <span>TEMPE, ARIZONA</span>
      </div>
    </footer>
  );
}
