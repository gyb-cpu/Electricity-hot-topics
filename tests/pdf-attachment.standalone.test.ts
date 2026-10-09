// A notice page often carries only the announcement and links the document as a PDF. Reading that
// attachment is what turns a titled announcement into the actual clauses, so it has to work on the
// shapes these sites actually use — and must not reach outside the page's own host.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attachmentLinks, pdfHtml } from "@powerhot/backend/content/pdf";

test("a pdf linked next to the notice is the attachment to read", () => {
  const html = `<p>现予公布。</p>
    <a href="./P020260409348498606128.pdf">附件：电力重大事故隐患判定标准</a>
    <a href="./P020260409348498936344.ofd">OFD 版</a>
    <a href="/xxgk/zcfb/fzggwl/index.html">返回列表</a>`;
  assert.deepEqual(attachmentLinks(html, "https://www.ndrc.gov.cn/xxgk/zcfb/fzggwl/202604/t20260409.html"), [
    "https://www.ndrc.gov.cn/xxgk/zcfb/fzggwl/202604/P020260409348498606128.pdf",
  ]);
});

test("an attachment on another host is not followed", () => {
  const html = `<a href="https://cdn.example.com/a.pdf">附件</a><a href="//evil.test/b.pdf">附件</a>`;
  assert.deepEqual(attachmentLinks(html, "https://www.nea.gov.cn/x.htm"), []);
});

test("a page with no attachment offers nothing rather than guessing", () => {
  assert.deepEqual(attachmentLinks("<p>纯文字页面</p>", "https://www.nea.gov.cn/x.htm"), []);
});

test("extracted text becomes escaped paragraphs, not invented structure", () => {
  assert.equal(pdfHtml("第一条 目的\n\n第二条 <范围> & \"引用\""),
    "<p>第一条 目的</p>\n<p>第二条 &lt;范围&gt; &amp; &quot;引用&quot;</p>");
});