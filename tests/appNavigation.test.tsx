import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppNavigation from "../components/AppNavigation";
vi.mock("../components/RestrictedNavLinks", () => ({
  default: () => (
    <>
      <a href="/teacher">Teacher</a>
      <a href="/school">School / district</a>
    </>
  ),
}));
vi.mock("next/link", () => ({ default: (p: any) => <a {...p} /> }));
beforeEach(() => {
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
describe("shared compact navigation", () => {
  it.each(["en", "es", "fr"] as const)(
    "keeps four main destinations visible and secondary tools in a disclosure for %s",
    (language) => {
      let ui: ReturnType<typeof create>;
      act(() => {
        ui = create(<AppNavigation language={language} />);
      });
      const nav = ui!.root.findByType("nav");
      expect(
        nav.children
          .filter((c) => typeof c !== "string" && c.type !== "details")
          .flatMap((c) =>
            typeof c === "string"
              ? []
              : c.findAllByType("a").map((a) => a.props.href),
          ),
      ).toEqual(["/", "/daily", "/lessons", "/thinking-paths"]);
      const details = ui!.root.findByType("details");
      expect(details.findByType("summary").findAllByType("svg")).toHaveLength(
        1,
      );
      const hrefs = details.findAllByType("a").map((a) => a.props.href);
      expect(hrefs).toEqual(
        expect.arrayContaining([
          "/teacher",
          "/school",
          "/profile",
          "/classroom",
          "/leaderboard",
          "/feedback",
          "/?guide=1",
        ]),
      );
      expect(hrefs).not.toContain("/how-to-use");
    },
  );
  it("reopens the current page guide without navigating away from an answer", () => {
    const help = vi.fn();
    let ui: ReturnType<typeof create>;
    act(() => {
      ui = create(<AppNavigation language="en" onHelp={help} />);
    });
    act(() =>
      ui!.root.findByType("details").findByType("button").props.onClick(),
    );
    expect(help).toHaveBeenCalledOnce();
  });
});
