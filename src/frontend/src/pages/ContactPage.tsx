import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { addContactMessage } from "../utils/storage";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      addContactMessage({
        name: form.name,
        email: form.email,
        message: form.message,
      });
      toast.success("Message sent! I'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
      setSubmitting(false);
    }, 600);
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          Get in touch
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-light mb-2 text-foreground">
          Contact
        </h1>
        <div className="w-10 h-px bg-primary/50 mb-10" />

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Name
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              required
              data-ocid="contact.name.input"
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="your@email.com"
              required
              data-ocid="contact.email.input"
              className="bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-sm text-muted-foreground">
              Message
            </Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="What's on your mind?"
              rows={5}
              required
              data-ocid="contact.message.textarea"
              className="bg-card resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            data-ocid="contact.submit_button"
            className="w-full sm:w-auto"
          >
            {submitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
