import { formatBytes } from "@/lib/format-bytes";
import { describe, expect, it } from "vitest";

describe("formatBytes", () => {
  it("0과 1 미만은 0 B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(0.4)).toBe("0 B");
  });

  it("바이트는 정수로 표시", () => {
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("KB/MB/GB는 소수 1자리", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(25 * 1024 * 1024)).toBe("25.0 MB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
  });

  it("GB를 넘어도 GB 단위로 유지(상한)", () => {
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.0 GB");
  });
});
