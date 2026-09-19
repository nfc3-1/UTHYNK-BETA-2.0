export type VoiceTarget = "answer" | "followUp" | "reflection";
export const speechLanguages = { en: "en-US", es: "es-US", fr: "fr-FR" };
export function appendTranscript(draft: string, transcript: string) {
  return transcript.trim() ? `${draft}${draft && !/\s$/.test(draft) ? " " : ""}${transcript.trim()}` : draft;
}

// One recognizer per hold; late events cannot move speech into a different field.
export function createHoldToTalk(options: {
  create: () => any;
  append: (target: VoiceTarget, transcript: string) => void;
  listening: (value: boolean) => void;
  error: () => void;
}) {
  let current: any = null;
  let released = false;
  let started = false;
  return {
    start(target: VoiceTarget, language: keyof typeof speechLanguages) {
      if (current) return;
      let recognition: any;
      try { recognition = options.create(); } catch { options.error(); return; }
      if (!recognition) { options.error(); return; }
      current = recognition;
      released = false;
      started = false;
      recognition.lang = speechLanguages[language];
      recognition.continuous = true;
      recognition.interimResults = false;
      let processed = 0;
      recognition.onstart = () => {
        if (current !== recognition) return;
        started = true;
        if (released) recognition.stop();
        else options.listening(true);
      };
      recognition.onresult = (event: any) => {
        if (current !== recognition) return;
        for (; processed < event.results.length; processed++) {
          if (event.results[processed].isFinal) options.append(target, event.results[processed][0]?.transcript || "");
        }
      };
      recognition.onerror = () => {
        if (current !== recognition) return;
        current = null;
        options.listening(false);
        options.error();
        try { recognition.abort(); } catch { /* Already ended. */ }
      };
      recognition.onend = () => {
        if (current !== recognition) return;
        current = null;
        started = false;
        options.listening(false);
      };
      try { recognition.start(); }
      catch { current = null; options.listening(false); options.error(); }
    },
    stop() {
      if (!current || released) return;
      released = true;
      options.listening(false);
      if (started) { try { current.stop(); } catch { options.error(); } }
    },
    dispose() {
      const previous = current;
      current = null;
      options.listening(false);
      if (previous) { try { previous.abort(); } catch { /* Already ended. */ } }
    },
  };
}
