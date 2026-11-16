import { describe, expect, it } from "vitest";
import { PUBLIC_CONTACT, verifyPublicSocialUrl } from "./publicContact";

describe("public contact", () => {
  it("publishes the requested GitHub and email", () => {
    expect(PUBLIC_CONTACT.github).toBe("https://github.com/2674321");
    expect(PUBLIC_CONTACT.email).toBe("pvc.devno@gmail.com");
  });

  it("only accepts personal-looking HTTPS paths on the expected domain", () => {
    expect(verifyPublicSocialUrl("https://www.linkedin.com/in/example", "linkedin.com")).toContain("linkedin.com/in/example");
    expect(verifyPublicSocialUrl("http://linkedin.com/in/example", "linkedin.com")).toBeNull();
    expect(verifyPublicSocialUrl("https://evil.test/in/example", "linkedin.com")).toBeNull();
  });
});
