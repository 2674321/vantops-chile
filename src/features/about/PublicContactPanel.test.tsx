// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicContactPanel } from "./PublicContactPanel";

describe("PublicContactPanel", () => {
  it("renders every requested public contact without dead cards", () => {
    render(<PublicContactPanel />);
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/patricioa2/",
    );
    expect(screen.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://www.instagram.com/__mudrock",
    );
    expect(screen.queryByText("Enlace aún no configurado")).not.toBeInTheDocument();
  });
});
