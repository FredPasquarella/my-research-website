import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lesson = readFileSync(
  new URL("../courses/elementary-statistics/lessons/sampling-distributions.qmd", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL("../assets/interactive/sampling-distributions.mjs", import.meta.url),
  "utf8"
);

const questionIds = ["distribution", "sample-size", "standard-error", "clt"];

test("four independent end-of-lesson checks align with four learning objectives", () => {
  const goals = lesson.match(/^\d\. /gm) ?? [];
  // There are also numbered interpretation steps. Scope objectives to their own section.
  const goalsText = lesson.split("**Learning goals**")[1]?.split("**Before starting:**")[0] ?? "";
  const goalCount = (goalsText.match(/^\d\. /gm) ?? []).length;
  assert.equal(goalCount, 4);

  const reviewSection = lesson.slice(lesson.indexOf("## Check your understanding"));
  const ids = [...reviewSection.matchAll(/<fieldset class="clt-question" data-question="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(ids, questionIds);
  assert.equal((reviewSection.match(/data-action="knowledge-check"/g) ?? []).length, 4);
  assert.equal((reviewSection.match(/data-output="check-feedback"/g) ?? []).length, 4);

  for (const id of questionIds) {
    assert.match(controller, new RegExp('"' + id + '": \\{'));
  }
});

test("checks come after the technical explanation and the Lab 3 subsection is removed", () => {
  const technicalSection = lesson.indexOf("## What is the central limit theorem saying?");
  const practiceExplanation = lesson.indexOf("**Why this makes sense:**");
  const reviewSection = lesson.indexOf("## Check your understanding");
  const returnLink = lesson.indexOf("[Back to Elementary Statistics]");
  assert.ok(technicalSection !== -1 && practiceExplanation > technicalSection);
  assert.ok(reviewSection > practiceExplanation);
  assert.ok(returnLink > reviewSection);
  assert.equal(lesson.includes("## How this supports Lab 3"), false);
  assert.ok(lesson.includes("This does not guarantee that every larger sample"));
});

test("each answer has its own radio group and a live feedback region", () => {
  for (const id of questionIds) {
    assert.ok(lesson.includes('name="clt-check-' + id + '"'));
  }
  assert.equal(
    (lesson.slice(lesson.indexOf("## Check your understanding"))
      .match(/role="status" aria-live="polite"/g) ?? []).length,
    4
  );
  assert.match(controller, /button\.closest\("\[data-question\]"\)/);
});
