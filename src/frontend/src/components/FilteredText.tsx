import { Eye } from "lucide-react";
import { useState } from "react";
import { filterText } from "../utils/badWordFilter";

interface FilteredTextProps {
  text: string;
}

export function FilteredText({ text }: FilteredTextProps) {
  const segments = filterText(text);
  const hasBadWords = segments.some((s) => s.isBadWord);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());

  if (!hasBadWords) {
    return <span>{text}</span>;
  }

  const toggleWord = (index: number) => {
    setRevealedWords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <span>
      {segments.map((seg) => {
        if (!seg.isBadWord) {
          return (
            <span key={`safe-${seg.text.slice(0, 8)}-${seg.wordIndex}`}>
              {seg.text}
            </span>
          );
        }
        const revealed = revealedWords.has(seg.wordIndex);
        return (
          <span
            key={`bad-${seg.wordIndex}`}
            className="inline-flex items-center gap-0.5"
          >
            <span
              className={`blurred-word${revealed ? " revealed" : ""}`}
              title={revealed ? "Click eye to re-blur" : "Blurred word"}
            >
              {seg.text}
            </span>
            <button
              onClick={() => toggleWord(seg.wordIndex)}
              className="inline-flex items-center justify-center w-4 h-4 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={revealed ? "Re-blur" : "Reveal word"}
              type="button"
            >
              <Eye className="w-3 h-3" />
            </button>
          </span>
        );
      })}
    </span>
  );
}
