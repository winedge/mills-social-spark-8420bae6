import React, { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useJobListings, type DbJobListing } from "@/lib/content";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin, Clock, Send, CheckCircle2, Loader2, Users, Heart, Star, Upload, FileText, X as CloseIcon } from "lucide-react";
import { toast } from "sonner";
import { submitCareerApplication } from "@/lib/careers.functions";
import { useServerFn } from "@tanstack/react-start";

import WarpText from "@/components/ui/warp-text";
import teamPhoto from "@/assets/team-photo.jpg";


export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers - Mill's Modern Social" },
      { name: "description", content: "Join the team at Mill's Modern Social. View open positions and apply to become part of Tempe's favorite sports bar and kitchen." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const { items: jobs, loading: jobsLoading } = useJobListings();
  const [selectedJob, setSelectedJob] = useState<DbJobListing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const notifyAdmin = useServerFn(submitCareerApplication);


  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, jobId?: string) => {
    e.preventDefault();
    const targetJobId = jobId || selectedJob?.id;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let resumeUrl = "";
      
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("site_assets")
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("site_assets")
          .getPublicUrl(filePath);
        
        resumeUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("job_applications").insert({
        job_id: targetJobId || null,
        full_name: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        cover_letter: formData.get("message") as string,
        resume_url: resumeUrl,
        status: "pending",
      });

      if (error) throw error;
      
      // Notify admin via server function
      try {
        await notifyAdmin({
          data: {
            fullName: formData.get("fullName") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            jobTitle: targetJobId ? (jobs.find((j: any) => j.id === targetJobId)?.title || "Unknown Position") : "General Application",
            resumeUrl: resumeUrl,

            message: formData.get("message") as string,
          }
        });
      } catch (notifyErr) {
        console.error("Admin notification error:", notifyErr);
        // Don't fail the user submission if just the notification fails
      }

      setSubmitted(true);
      setResumeFile(null);
      toast.success("Application submitted successfully!");

    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground font-body min-h-screen">
      <SiteHeader showTicker={false} />

      {/* Hero / Why Join Section */}
      <section className="relative pt-16 pb-14 px-6 overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src={teamPhoto}
            alt="Mill's Modern Social team behind the bar holding signature dishes"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-background/75" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="font-mono text-accent text-sm md:text-base tracking-[0.4em] block mb-2 uppercase font-bold">
              Join The Circle
            </span>
            <div className="mb-4">
              <WarpText
                text="WORK WITH US"
                color="#ffffff"
                warpStrength={0.08}
                warpScale={1.7}
                speed={0.55}
                pointerInfluence={0.42}
                pointerStrength={0.38}
                refraction={0.018}
                ripple
                fontSize="clamp(3.5rem, 12vw, 10rem)"
                fontWeight={800}
                style={{ height: '200px' }}
              />
            </div>

            <p className="text-muted-foreground text-lg md:text-xl text-pretty">
              We aren't just a sports bar; we're a community. We're looking for passionate individuals who love high-energy environments and exceptional hospitality.
            </p>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-14">
        <div className="max-w-7xl mx-auto">


          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-surface border border-border group hover:border-accent transition-colors">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Users className="size-6" />
              </div>
              <h3 className="font-display text-2xl uppercase mb-3">Strong Culture</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Join a tight-knit team where everyone has each other's back. We celebrate wins together and support growth.
              </p>
            </div>
            <div className="p-8 bg-surface border border-border group hover:border-accent transition-colors">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Star className="size-6" />
              </div>
              <h3 className="font-display text-2xl uppercase mb-3">Growth Potential</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We promote from within. Start as a runner, become a manager. We provide the training to help you level up.
              </p>
            </div>
            <div className="p-8 bg-surface border border-border group hover:border-accent transition-colors">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <Heart className="size-6" />
              </div>
              <h3 className="font-display text-2xl uppercase mb-3">Great Perks</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Competitive pay, shift meals, employee discounts, and a flexible schedule that respects your life outside work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="mb-10">
              <h2 className="font-display text-4xl uppercase mb-4">Open <span className="text-accent">Positions</span></h2>
              <p className="text-muted-foreground">Select a role to view details and apply.</p>
            </div>

            {jobsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 w-full bg-surface animate-pulse border border-border" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-border text-center rounded-lg">
                <Briefcase className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No active openings right now</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Check back soon or follow us on social media for updates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                        setSelectedJob(job);
                        setSubmitted(false);
                    }}
                    className={`w-full text-left p-6 border transition-all ${
                      selectedJob?.id === job.id 
                        ? "bg-accent/5 border-accent shadow-[4px_4px_0px_0px_rgba(56,189,248,1)]" 
                        : "bg-surface border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display text-2xl uppercase">{job.title}</h3>
                      <span className="font-mono text-[10px] bg-accent/10 text-accent px-2 py-1 uppercase tracking-widest">
                        {job.type}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground font-mono uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MapPin className="size-3" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="size-3" /> {job.department}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            {selectedJob ? (
              <div className="sticky top-32 p-8 border-2 border-border bg-card shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)]">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="size-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="size-10" />
                    </div>
                    <h3 className="font-display text-3xl uppercase mb-3">Application Received</h3>
                    <p className="text-muted-foreground mb-8">
                      Thanks for your interest in joining the team! We've received your application for the <strong>{selectedJob.title}</strong> position and will be in touch soon.
                    </p>
                    <button 
                      onClick={() => setSubmitted(false)}
                      className="px-8 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                    >
                      Back to Jobs
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 pb-6 border-b border-border">
                      <h3 className="font-display text-3xl uppercase mb-2">Apply for {selectedJob.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
                          <input 
                            required 
                            name="fullName"
                            className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
                          <input 
                            required 
                            type="email"
                            name="email"
                            className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phone Number</label>
                          <input 
                            required 
                            name="phone"
                            className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                            placeholder="(555) 000-0000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Resume (PDF, Max 5MB)</label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-background border border-border border-dashed p-3 min-h-[46px] flex items-center justify-between cursor-pointer hover:border-accent transition-colors"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {resumeFile ? (
                                <>
                                  <FileText className="size-4 text-accent shrink-0" />
                                  <span className="text-xs truncate">{resumeFile.name}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="size-4 text-muted-foreground shrink-0" />
                                  <span className="text-xs text-muted-foreground">Click to upload resume</span>
                                </>
                              )}
                            </div>
                            {resumeFile && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResumeFile(null);
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="text-muted-foreground hover:text-red-500"
                              >
                                <CloseIcon className="size-3" />
                              </button>
                            )}
                          </div>
                          <input 
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Message / Cover Letter</label>
                        <textarea 
                          name="message"
                          rows={4}
                          className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors resize-none" 
                          placeholder="Tell us why you'd be a great fit..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-accent text-primary-foreground font-black uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Submit Application
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-12 text-center opacity-60">
                <div className="size-16 rounded-full bg-surface flex items-center justify-center mb-6">
                  <Send className="size-6 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl uppercase mb-2">Ready to Start?</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Pick a position on the left to see full details and submit your application.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Generic Application Section */}
      <section className="py-24 px-6 border-t border-border bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl uppercase mb-4">Don't see the <span className="text-accent">Right Role?</span></h2>
            <p className="text-muted-foreground">
              Submit a general application. If we have any requirements that match your skills, we'll reach out to you.
            </p>
          </div>

          <div className="bg-card border-2 border-border p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(56,189,248,0.1)]">
            {submitted && !selectedJob ? (
              <div className="text-center py-12">
                <div className="size-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="size-10" />
                </div>
                <h3 className="font-display text-3xl uppercase mb-3">Submission Received</h3>
                <p className="text-muted-foreground mb-8">
                  Thanks for your interest in joining Mill's! We've added your details to our talent pool.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 bg-accent text-primary-foreground font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                >
                  Apply Again
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
                    <input 
                      required 
                      name="fullName"
                      className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
                    <input 
                      required 
                      type="email"
                      name="email"
                      className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phone Number</label>
                    <input 
                      required 
                      name="phone"
                      className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors" 
                      placeholder="(555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Resume (PDF, Max 5MB)</label>
                    <div 
                      onClick={() => generalFileInputRef.current?.click()}
                      className="w-full bg-background border border-border border-dashed p-3 min-h-[46px] flex items-center justify-between cursor-pointer hover:border-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {resumeFile ? (
                          <>
                            <FileText className="size-4 text-accent shrink-0" />
                            <span className="text-xs truncate">{resumeFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">Click to upload resume</span>
                          </>
                        )}
                      </div>
                      {resumeFile && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResumeFile(null);
                            if (generalFileInputRef.current) generalFileInputRef.current.value = "";
                          }}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      )}
                    </div>
                    <input 
                      ref={generalFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tell us about yourself</label>
                  <textarea 
                    name="message"
                    rows={4}
                    className="w-full bg-background border border-border p-3 outline-none focus:border-accent transition-colors resize-none" 
                    placeholder="Experience, interests, and what you're looking for..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-accent text-primary-foreground font-black uppercase tracking-widest text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
