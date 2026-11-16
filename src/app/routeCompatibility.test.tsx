// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegacyMapRedirect, LegacyPlacesRedirect } from "./App";

function SearchProbe() {
  const location = useLocation();
  return <output>{location.search}</output>;
}

describe("legacy route compatibility", () => {
  it("preserves map, zone and mode parameters", async () => {
    render(
      <MemoryRouter initialEntries={["/utilidades/mapa?mapId=m1&zoneId=z1&mode=measure"]}>
        <Routes>
          <Route path="/utilidades/mapa" element={<LegacyMapRedirect />} />
          <Route path="/" element={<SearchProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("?mapId=m1&zoneId=z1&mode=measure")).toBeInTheDocument();
  });

  it("opens the pins panel from the historical places route", async () => {
    render(
      <MemoryRouter initialEntries={["/lugares?mapId=m1"]}>
        <Routes>
          <Route path="/lugares" element={<LegacyPlacesRedirect />} />
          <Route path="/" element={<SearchProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("?mapId=m1&panel=pines")).toBeInTheDocument();
  });
});
