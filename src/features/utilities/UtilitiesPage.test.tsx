// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { UtilitiesPage } from "./UtilitiesPage";

describe("UtilitiesPage", () => {
  it("opens the operational map route from the available utility", async () => {
    render(<MemoryRouter initialEntries={["/utilidades"]}><Routes><Route path="/utilidades" element={<UtilitiesPage />} /><Route path="/utilidades/mapa" element={<h1>Mapa cargado</h1>} /></Routes></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: /Mapa de operaciones/i }));
    expect(screen.getByRole("heading", { name: "Mapa cargado" })).toBeInTheDocument();
  });
});
