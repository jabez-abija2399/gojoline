import { describe, expect, it } from "vitest";
import { canMove, nextStatus, statusFromRead } from "./message-status";

describe("message status", () => {
  it("steps New → Replied → Done, and Done can be opened again", () => {
    expect(nextStatus("new")).toBe("replied");
    expect(nextStatus("replied")).toBe("done");
    expect(nextStatus("done")).toBe("new");
  });
  it("allows the moves an owner makes and refuses the rest", () => {
    expect(canMove("new", "replied")).toBe(true);
    expect(canMove("new", "done")).toBe(true);
    expect(canMove("replied", "new")).toBe(true);
    expect(canMove("done", "new")).toBe(true);
    expect(canMove("done", "replied")).toBe(false);
    expect(canMove("new", "new")).toBe(false);
  });
  it("maps old read/unread: unread is New, read is Done", () => {
    expect(statusFromRead(null)).toBe("new");
    expect(statusFromRead(new Date())).toBe("done");
  });
});
