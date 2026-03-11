import { BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { getRules } from "../utils/storage";

export function RulesPage() {
  const rules = getRules();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
            Community
          </p>
          <h1 className="font-display text-4xl font-light text-foreground mb-3">
            Rules
          </h1>
          <div className="h-px w-12 bg-primary" />
        </motion.div>

        {/* Rules list */}
        {rules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center py-16 border border-dashed border-border rounded-xl"
            data-ocid="rules.empty_state"
          >
            <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No rules have been posted yet.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5" data-ocid="rules.list">
            {rules.map((rule, i) => (
              <motion.article
                key={rule.id}
                data-ocid={`rules.item.${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Image */}
                {rule.imageDataUrl && (
                  <div className="w-full">
                    <img
                      src={rule.imageDataUrl}
                      alt={rule.title || `Rule ${i + 1}`}
                      className="w-full object-cover max-h-64 rounded-t-xl"
                    />
                  </div>
                )}

                {/* Text content */}
                {(rule.title || rule.description) && (
                  <div className="p-5 flex gap-4">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      {rule.title && (
                        <h2 className="font-medium text-foreground leading-snug">
                          {rule.title}
                        </h2>
                      )}
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Image-only: show badge overlay */}
                {rule.imageDataUrl && !rule.title && !rule.description && (
                  <div className="px-4 py-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {i + 1}
                    </span>
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
