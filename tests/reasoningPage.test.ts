import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ReasoningPage from "../app/reasoning/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams("id=workplace-01") }));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("../lib/telemetry", () => ({ createTelemetryEvent: () => ({}), trackEvent() {} }));

let page: ReactTestRenderer;
let storage: Map<string, string>;
let requests: any[];
let reply: (body: any) => Promise<Response>;
const first = { perspectiveExpansion: "Consider the other person's incentives.", secondaryQuestion: "What evidence would change your mind?" };
function mount() { act(() => { page = create(createElement(ReasoningPage)); }); }
function setup(language = 'en') {
  storage = new Map([["uthynk-onboarding-dismissed", "true"]]); requests = [];
  storage.set('uthynk-language', language);
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) });
  vi.stubGlobal("window", { localStorage, dispatchEvent() {}, location: { pathname: "/reasoning" }, history: { replaceState() {} }, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("document", { cookie: "" });
  reply = async () => Response.json(first);
  vi.stubGlobal("fetch", async (url: string, init: any) => {
    if (url !== "/api/reasoning") return Response.json({ eligible: false });
    const body = JSON.parse(init.body); requests.push(body); return reply(body);
  });
  mount();
}
function field(id: string) { return page.root.findByProps({ id }); }
function button(label: string) { return page.root.findAllByType("button").find(node => node.children.join("") === label)!; }
function type(id: string, value: string) { act(() => field(id).props.onChange({ target: { value } })); }
function submitButton() { return page.root.findAllByType("button").find(node => node.props.className === "btn btnPrimary" && node.props.onClick && !node.props.disabled)!; }
async function submit() { await act(async () => { await submitButton().props.onClick(); }); }
afterEach(() => { if (page) act(() => page.unmount()); vi.unstubAllGlobals(); });

describe("reasoning page finite workout", () => {
  for (const language of ['en','es','fr']) it(`completes and restores the ${language} finite flow`, async () => {
    setup(language);
    const perspective = language === 'es' ? 'Considera quién se beneficia.' : language === 'fr' ? 'Considère qui en profite.' : 'Consider who benefits.';
    const question = language === 'es' ? '¿Qué evidencia falta?' : language === 'fr' ? 'Quelle preuve manque ?' : 'What evidence is missing?';
    const synthesis = language === 'es' ? 'Primero propusiste una prueba. Después mantuviste tu postura. Falta medir el coste. Distingue evidencia de suposiciones.' : language === 'fr' ? 'Tu proposais un test. Ensuite tu as maintenu ta position. Le coût reste inconnu. Distingue les preuves des hypothèses.' : 'You proposed a test and then maintained that position. Its cost is unknown. Distinguish evidence from assumptions.';
    expect(page.root.findAllByProps({ className: 'advancedThinkingDetails' }).length).toBe(0);
    type('response','First answer'); reply = async () => Response.json({ perspectiveExpansion: perspective, secondaryQuestion: question }); await submit();
    type('follow-up-response','Second answer'); reply = async () => Response.json({ finalSynthesis: synthesis }); await submit();
    expect(requests.map(request => request.language)).toEqual([language,language]);
    expect(requests[1].firstUserAnswer).toBe('First answer'); expect(requests[1].secondUserAnswer).toBe('Second answer');
    act(() => page.root.findAllByProps({ role: 'radio' })[0].props.onClick());
    const completion = page.root.findAllByType('button').find(node => node.props.onClick?.name === 'completeWorkout')!;
    act(() => completion.props.onClick());
    expect(storage.get('uthynk-completed-workouts')).toBe('1');
    act(() => page.unmount()); mount();
    expect(page.root.findByType('select').props.value).toBe(language);
    expect(page.root.findAllByProps({ id: 'response' }).length).toBe(0);
    expect(page.root.findAllByProps({ id: 'follow-up-response' }).length).toBe(0);
    expect(requests.length).toBe(2);
    const saved = JSON.parse([...storage.entries()].find(([key]) => key.startsWith('uthynk-reasoning:v1:'))![1]);
    expect(saved.feedback.analysis).toBe(synthesis); expect(saved.workoutStage).toBe('complete');
  });
  it("dictates into each visible draft and keeps previous challenge storage when starting another", async () => {
    setup();
    let recognizer: any;
    (window as any).webkitSpeechRecognition = class {
      onstart = () => {}; onend = () => {}; onresult = (_event: any) => {};
      constructor() { recognizer = this; }
      start() { this.onstart(); }
      stop() { this.onend(); }
      abort() {}
    };
    function speak() {
      const voice = button("Hold To Talk");
      act(() => voice.props.onPointerDown({ button: 0, pointerId: 1, preventDefault() {}, currentTarget: { setPointerCapture() {} } }));
      const result: any = [{ transcript: "spoken" }]; result.isFinal = true;
      act(() => { recognizer.onresult({ results: [result] }); voice.props.onPointerUp(); });
    }
    type("response", "Typed"); speak(); expect(field("response").props.value).toBe("Typed spoken");
    await submit(); type("follow-up-response", "Second"); speak(); expect(field("follow-up-response").props.value).toBe("Second spoken");
    reply = async () => Response.json({ finalSynthesis: "A practical takeaway." }); await submit();
    const reflection = page.root.findByType("textarea");
    act(() => reflection.props.onChange({ target: { value: "Reflection" } }));
    speak(); expect(page.root.findByType("textarea").props.value).toBe("Reflection spoken");
    act(() => button("Yes").props.onClick()); act(() => button("Complete").props.onClick());
    const key = [...storage.keys()].find(key => key.startsWith("uthynk-reasoning:v1:"))!;
    const saved = storage.get(key);
    act(() => button("Start Next Challenge").props.onClick());
    expect(field("response").props.value).toBe("");
    expect(storage.get(key)).toBe(saved);
    expect([...storage.keys()].filter(key => key.startsWith("uthynk-reasoning:v1:")).length).toBe(2);
  });
  it("moves from canonical first feedback to synthesis, reflection and completion once", async () => {
    setup(); type("response", "My first answer");
    let resolve!: (value: Response) => void;
    reply = () => new Promise(done => { resolve = done; });
    const click = submitButton().props.onClick;
    let pending: Promise<void>;
    act(() => { pending = click(); void click(); });
    expect(requests.length).toBe(1);
    await act(async () => { resolve(Response.json(first)); await pending; });
    expect(field("follow-up-response").props.value).toBe("");
    expect(page.root.findAllByProps({ className: "messageBubble userBubble" }).length).toBe(1);
    type("follow-up-response", "My second answer");
    reply = async () => Response.json({ finalSynthesis: "Your evidence test connects both answers.", xp: 12, score: 80 });
    await submit();
    expect(requests[1]).toMatchObject({ firstUserAnswer: "My first answer", secondUserAnswer: "My second answer", perspectiveExpansion: first.perspectiveExpansion, secondaryQuestion: first.secondaryQuestion });
    expect(page.root.findAllByProps({ id: "follow-up-response" }).length).toBe(0);
    expect(page.root.findAllByProps({ className: "finalReflectionPanel" }).length).toBe(1);
    act(() => button("Yes").props.onClick());
    const complete = button("Complete").props.onClick;
    act(() => { complete(); complete(); });
    expect(storage.get("uthynk-completed-workouts")).toBe("1");
    expect(JSON.parse(storage.get("uthynk-profile")!).xp).toBe(12);
    expect(Boolean(button("Start Next Challenge"))).toBe(true);
    act(() => page.unmount()); mount();
    expect(Boolean(button("Start Next Challenge"))).toBe(true);
    expect(requests.length).toBe(2);
  });
  it("preserves both failed drafts, retries without duplicate history, restores and survives language changes", async () => {
    setup(); type("response", "Keep first draft");
    reply = async () => { throw new Error("Network interrupted; retry."); };
    await submit(); expect(field("response").props.value).toBe("Keep first draft");
    expect(page.root.findAllByProps({ className: "messageBubble userBubble" }).length).toBe(0);
    reply = async () => Response.json(first); await submit();
    type("follow-up-response", "Keep second draft");
    reply = async () => Response.json({ error: "Try again" }, { status: 503 });
    await submit(); expect(field("follow-up-response").props.value).toBe("Keep second draft");
    expect(page.root.findAllByProps({ className: "messageBubble userBubble" }).length).toBe(1);
    act(() => page.unmount()); mount();
    expect(field("follow-up-response").props.value).toBe("Keep second draft");
    act(() => page.root.findByType("select").props.onChange({ target: { value: "fr" } }));
    expect(field("follow-up-response").props.value).toBe("Keep second draft");
    reply = async () => Response.json({ finalSynthesis: "Closing feedback." }); await submit();
    expect(requests[requests.length - 1].firstUserAnswer).toBe("Keep first draft");
    expect(page.root.findAllByProps({ className: "messageBubble userBubble" }).length).toBe(2);
  });
});
