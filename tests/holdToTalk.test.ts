import { describe, expect, it } from "vitest";
import { appendTranscript, createHoldToTalk } from "../lib/holdToTalk";

describe("hold to talk lifecycle", () => {
  it("appends once, routes all targets and uses selected languages", () => {
    const drafts = { answer: "Typed", followUp: "Second", reflection: "Reflection" };
    let recognition: any;
    let starts = 0;
    let stops = 0;
    const voice = createHoldToTalk({
      create: () => recognition = { start() { starts++; }, stop() { stops++; }, abort() {} },
      append: (target, text) => { drafts[target] = appendTranscript(drafts[target], text); },
      listening() {}, error() {},
    });
    for (const [target, language, code] of [["answer", "en", "en-US"], ["followUp", "es", "es-US"], ["reflection", "fr", "fr-FR"]] as const) {
      voice.start(target, language);
      voice.start(target, language);
      expect(recognition.lang).toBe(code);
      recognition.onstart();
      const result: any = [{ transcript: "spoken" }]; result.isFinal = true;
      recognition.onresult({ results: [result] });
      recognition.onresult({ results: [result] });
      voice.stop(); voice.stop(); recognition.onend();
    }
    expect(starts).toBe(3); expect(stops).toBe(3);
    expect(drafts).toMatchObject({ answer: "Typed spoken", followUp: "Second spoken", reflection: "Reflection spoken" });
  });
  it("stops after a release before onstart and ignores stale results", () => {
    let recognition: any; let stopped = 0; let transcript = "";
    const voice = createHoldToTalk({ create: () => recognition = { start() {}, stop() { stopped++; }, abort() {} }, append: (_, text) => { transcript += text; }, listening() {}, error() {} });
    voice.start("answer", "en"); voice.stop(); recognition.onstart();
    expect(stopped).toBe(1);
    voice.dispose(); recognition.onresult({ results: [[{ transcript: "late" }]] });
    expect(transcript).toBe("");
  });
  it("reports unsupported recognition without throwing", () => {
    let errors = 0;
    const voice = createHoldToTalk({ create: () => null, append() {}, listening() {}, error() { errors++; } });
    voice.start("answer", "en"); voice.stop();
    expect(errors).toBe(1);
  });
});
