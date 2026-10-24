// Model answers that stop one bracket short of a complete JSON object: the completion is applied only
// after JSON.parse fails, and the caller's schema still judges the value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { completeJsonBrackets } from "@powerhot/backend/lib/text";

test("a JSON object missing its final closing brace is completed", () => {
  const answer = '{"query":"四川","decisions":[{"id":"C1","relation":"SAME_OCCURRENCE"}],"selection":{"addsValue":true,"reason":"补充了执行参数。"}';
  assert.throws(() => JSON.parse(answer));
  const completed = completeJsonBrackets(answer);
  assert.equal(completed, `${answer}}`);
  assert.deepEqual(JSON.parse(completed!), {
    query: "四川",
    decisions: [{ id: "C1", relation: "SAME_OCCURRENCE" }],
    selection: { addsValue: true, reason: "补充了执行参数。" },
  });
});

test("several missing closers are completed in reverse order", () => {
  assert.equal(completeJsonBrackets('{"a":[{"b":1'), '{"a":[{"b":1}]}');
});

test("a complete object is left alone and reported as nothing to complete", () => {
  assert.equal(completeJsonBrackets('{"a":1}'), null);
});

test("brackets and braces inside strings do not count", () => {
  assert.equal(completeJsonBrackets('{"a":"}","b":"["'), '{"a":"}","b":"["}');
  assert.equal(completeJsonBrackets('{"a":"\\"}"'), '{"a":"\\"}"}');
});

test("a mismatched or unterminated answer is not completed", () => {
  assert.equal(completeJsonBrackets('{"a":1]'), null);
  assert.equal(completeJsonBrackets('{"a":"unterminated'), null);
  assert.equal(completeJsonBrackets("not json at all"), null);
});
