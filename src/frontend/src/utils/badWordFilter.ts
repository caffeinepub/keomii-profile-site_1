export const BAD_WORDS = [
  "fuck",
  "shit",
  "ass",
  "bitch",
  "bastard",
  "damn",
  "crap",
  "piss",
  "cock",
  "dick",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "twat",
  "wank",
  "bollocks",
  "bugger",
  "bloody hell",
];

export interface TextSegment {
  text: string;
  isBadWord: boolean;
  wordIndex: number;
}

export function filterText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let remaining = text;
  let wordIndex = 0;

  while (remaining.length > 0) {
    let earliestMatch: { index: number; word: string } | null = null;

    for (const word of BAD_WORDS) {
      const regex = new RegExp(`\\b${word.replace(" ", "\\s+")}\\b`, "gi");
      const match = regex.exec(remaining);
      if (match !== null) {
        if (earliestMatch === null || match.index < earliestMatch.index) {
          earliestMatch = { index: match.index, word: match[0] };
        }
      }
    }

    if (!earliestMatch) {
      segments.push({ text: remaining, isBadWord: false, wordIndex: -1 });
      break;
    }

    if (earliestMatch.index > 0) {
      segments.push({
        text: remaining.slice(0, earliestMatch.index),
        isBadWord: false,
        wordIndex: -1,
      });
    }

    segments.push({
      text: earliestMatch.word,
      isBadWord: true,
      wordIndex: wordIndex++,
    });

    remaining = remaining.slice(
      earliestMatch.index + earliestMatch.word.length,
    );
  }

  return segments;
}
