import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDB, resetDB } from "../db";
import { createDraft, deleteDraft, getDraft, listDrafts, putDraft } from "./draftRepository";

beforeEach(async () => { resetDB(); await getDB().delete(); resetDB(); });

describe("draftRepository", () => {
  it("persists, updates, lists and deletes form drafts", async () => {
    const draft = await createDraft("flight-plan", { notes: "recuperable" }, "draft-1");
    await putDraft({ ...draft, payload: { notes: "actualizado" }, updatedAt: new Date(Date.now() + 1_000).toISOString() });
    expect(await getDraft("draft-1")).toMatchObject({ payload: { notes: "actualizado" }, revision: 1 });
    expect(await listDrafts("flight-plan")).toHaveLength(1);
    await deleteDraft("draft-1");
    expect(await getDraft("draft-1")).toBeUndefined();
  });
});
