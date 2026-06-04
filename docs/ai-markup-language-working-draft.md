# AI Markup Language Working Draft

Status: living research document
Purpose: explore whether Markdown is the right text format for AI system input/output, and whether a small semantic HTML or XHTML subset would be a better default.

This document is intentionally unfinished. It is a place to collect arguments, source links, candidate tag sets, open questions, and decisions as the idea evolves.

## Working Thesis

Markdown is a useful authoring format, but it may not be the best interchange format for AI systems.

The current AI ecosystem often treats Markdown as the natural language of agents because it is short, readable, and common in code repositories. That has real advantages. But Markdown also has weak structure, multiple dialects, ambiguous parsing, limited native semantics, fragile tables, no built-in validation model, and poor support for mixed content where structure matters.

A small, strict, semantic subset of HTML or XHTML might be better for AI input/output because it can:

- preserve document hierarchy and inline semantics,
- support links, lists, quotes, code, tables, forms, and machine-readable metadata,
- be validated by a DTD, XML schema, Relax NG, or a custom validator,
- reuse decades of parser behavior and tooling,
- avoid inventing a fully new syntax unless there is a clear reason.

The open question is not "Markdown bad, HTML good." The useful question is:

> What is the smallest markup language that remains readable to humans, easy for models to produce, easy for tools to validate, and expressive enough for real AI workflows?

## Recent Context

The public discussion is moving fast and is not settled.

Cloudflare now treats Markdown as an agent-facing format. Their Markdown for Agents docs say that clients can send `Accept: text/markdown`; Cloudflare then converts eligible HTML pages to Markdown and returns `text/markdown` with metadata such as an estimated token count. Cloudflare also describes Markdown as a common agent format because it is structured and token efficient.

John Mueller from Google has pushed against serving Markdown copies to LLM crawlers. In February 2026, Search Engine Journal reported his concern that bots may not treat raw Markdown pages like normal web pages, may not follow links as expected, and may lose context such as navigation and hierarchy. The same report summarizes Jono Alderson's objection: flattening pages into Markdown can strip structure and meaning.

Academic work is also mixed. HtmlRAG argues that HTML can preserve headings, tables, and other semantic structure that plain-text RAG pipelines lose, but it also notes the cost of noisy tags, JavaScript, CSS, and extra tokens. A Checksum experiment comparing JSON, XML, and Markdown found that format choice was not decisive for most tasks, but XML performed worse on precise find/replace bug-fixing tasks. A 2026 paper on hidden-comment injection in agent skills highlights another risk: Markdown documents can contain invisible or easy-to-miss HTML comments that still reach the model.

This suggests a balanced starting point:

- Markdown is excellent when brevity and human editability matter most.
- Raw web HTML is too noisy for direct AI context.
- Clean semantic HTML may preserve meaning better than flattened Markdown.
- Strict XML/XHTML may be validatable, but could be harder for models to emit perfectly.
- A purpose-built subset should be judged by empirical tests, not taste alone.

## Candidate Names

Working names:

- AI Markup Language
- AIML
- Agent Markup
- Agent HTML
- AIHTML
- AHTML
- Minimal Agent Markup

Concern: AIML already commonly refers to Artificial Intelligence Markup Language, an XML dialect for chatbots. Reusing the name may cause confusion unless the project deliberately positions itself as a successor or unrelated profile.

## Design Goals

The candidate format should be:

- Semantic: tags describe meaning, not visual styling.
- Small: the core set should fit on one page.
- Validatable: malformed structure should be detectable before it reaches a model or tool.
- Streamable: partial output should remain easy to inspect and recover.
- Human-readable: a person should be able to review it in plain text.
- Model-friendly: common models should reliably emit it without frequent repair.
- Tool-friendly: parsers should produce a predictable tree.
- Web-compatible: where possible, valid documents should also be valid HTML or XHTML.
- Source-preserving: links, headings, quotes, code blocks, and table relationships should survive round trips.

Non-goals for the first version:

- Styling.
- Layout.
- JavaScript.
- Browser app behavior.
- Arbitrary custom components.
- Full HTML compatibility.
- Replacing JSON for pure data APIs.

## Baseline: Core Markdown And HTML Equivalent

This table starts with common Markdown that AI systems already produce and maps it to a simple HTML counterpart.

| Meaning | Markdown | HTML candidate | Notes |
| --- | --- | --- | --- |
| Document title | `# Title` | `<h1>Title</h1>` | If the root has metadata, this can also be `<title>`. |
| Section heading | `## Section` | `<h2>Section</h2>` through `<h6>` | Keep six levels for compatibility, but discourage skipping levels. |
| Paragraph | blank-line-separated text | `<p>Text</p>` | HTML is more explicit and easier to parse. |
| Strong emphasis | `**text**` | `<strong>text</strong>` | Prefer semantic `<strong>` over `<b>`. |
| Emphasis | `*text*` | `<em>text</em>` | Prefer semantic `<em>` over `<i>`. |
| Link | `[label](url)` | `<a href="url">label</a>` | Clear attributes are useful for tools. |
| Image | `![alt](src)` | `<img src="src" alt="alt" />` | Keep only `src`, `alt`, maybe `title`, width, height. |
| Unordered list | `- item` | `<ul><li>item</li></ul>` | Avoid Markdown nesting ambiguity. |
| Ordered list | `1. item` | `<ol><li>item</li></ol>` | HTML preserves actual item order independent of marker style. |
| Block quote | `> text` | `<blockquote><p>text</p></blockquote>` | Consider requiring citation attributes later. |
| Inline code | `` `code` `` | `<code>code</code>` | Good fit. |
| Code block | fenced block | `<pre><code>...</code></pre>` | Add `data-language` or `class="language-ts"` only if useful. |
| Horizontal break | `---` | `<hr />` | Low priority, but harmless. |
| Table | pipe table | `<table><thead><tbody><tr><th><td>` | HTML is much stronger than Markdown for table structure. |
| Definition list | not core Markdown | `<dl><dt><dd>` | Useful for glossaries and specs. |
| Details | HTML passthrough | `<details><summary>...</summary>...</details>` | Later HTML, but useful for collapsible or optional context. |

## Candidate Core Tag Set

Start from HTML 2.0 style document structure and add a few later semantic tags where they solve real AI problems.

Core document tags:

- `html`
- `head`
- `title`
- `meta`
- `link`
- `body`

Core content tags:

- `h1` through `h6`
- `p`
- `a`
- `ul`
- `ol`
- `li`
- `blockquote`
- `pre`
- `code`
- `em`
- `strong`
- `br`
- `hr`
- `img`
- `table`
- `thead`
- `tbody`
- `tr`
- `th`
- `td`
- `caption`
- `dl`
- `dt`
- `dd`

Useful later additions to discuss:

- `section`: explicit grouping without relying only on heading inference.
- `article`: complete reusable unit, especially for retrieved chunks.
- `nav`: navigational links; may help crawlers and agents distinguish content from chrome.
- `main`: primary content boundary.
- `aside`: secondary content boundary, but could invite noise.
- `figure` and `figcaption`: important for images, charts, and screenshots.
- `time`: dates and datetimes with machine-readable attributes.
- `mark`: highlights or cited answer spans.
- `abbr`: expansions for acronyms.
- `q`: inline quotation, although many tools ignore it.
- `details` and `summary`: optional context, expandable evidence, tool traces.
- `data`: visible value with machine-readable value.

## Tags To Exclude Or Discourage

Likely exclude from the first profile:

- `style`
- `script`
- `font`
- `center`
- `blink`
- `marquee`
- layout-only `div`
- generic `span`
- event attributes such as `onclick`
- styling attributes such as `style`, `bgcolor`, `align`, `color`
- embedded app content such as `object`, `embed`, `iframe`, `applet`
- forms, unless the use case is explicitly interactive agents

Open question: should `div` and `span` be forbidden, or allowed only with a constrained `role` or `data-*` vocabulary? For AI interchange, generic containers can quickly recreate the mess of modern HTML.

## Root Element Options

### Option A: Reuse Full HTML Shape

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Example</title>
    <meta name="source" content="https://example.com/page" />
  </head>
  <body>
    <main>
      <h1>Example</h1>
      <p>Document text.</p>
    </main>
  </body>
</html>
```

Pros:

- familiar,
- validatable,
- web-compatible,
- has a place for metadata,
- easy to render in browsers.

Cons:

- more boilerplate,
- models may omit wrappers,
- feels like a web page even when the use case is a message, tool result, or retrieved chunk.

### Option B: Use HTML As The Root But Skip Head And Body

```html
<html>
  <h1>Example</h1>
  <p>Document text.</p>
</html>
```

Pros:

- shorter,
- still signals "this is HTML-like",
- avoids metadata boilerplate.

Cons:

- not normal valid HTML,
- validators and parsers may infer missing elements differently,
- metadata needs another convention.

### Option C: Use A New Root Element

```xml
<aiml version="0.1">
  <title>Example</title>
  <section>
    <h1>Example</h1>
    <p>Document text.</p>
  </section>
</aiml>
```

Pros:

- clear that this is an AI interchange profile, not a web page,
- can define stricter rules,
- avoids inheriting old browser baggage.

Cons:

- new parsers and validators,
- possible name conflict with existing AIML,
- models have less training exposure,
- less likely to be accepted by the web ecosystem.

### Option D: Fragment Profile

```html
<h1>Example</h1>
<p>Document text.</p>
```

Pros:

- shortest,
- good for chat messages and tool output,
- easy to embed.

Cons:

- no single root,
- harder to validate as XML,
- metadata and provenance must live elsewhere.

Current leaning: define both a full-document profile and a fragment profile. The full-document profile can use `html/head/body` or XHTML for validation. The fragment profile can be used for chat messages, tool results, and retrieved chunks.

## Validation Approaches

### DTD

A DTD fits the historical HTML 2.0/3.2 idea and is compact. It can define allowed elements and nesting rules, but it is not great for modern attribute constraints or richer datatypes.

### XHTML

XHTML gives strict XML parsing: closed tags, quoted attributes, lowercase names, and parser errors for malformed documents. This helps validation, but models may produce small XML mistakes during streaming. The format may need a repair pass.

### Relax NG Or XML Schema

More expressive than DTDs. Better if the project wants constraints like required `alt` on images, allowed attributes, and machine-readable dates.

### Zod Or TypeScript AST Validation

Useful inside Headcode or agent tools. Parse HTML with an existing parser, transform into a typed AST, validate with Zod, and reject or repair unsupported nodes. This may be more practical than expecting every model output to satisfy XML perfectly.

## Specific Issues With Markdown

Working list of pain points:

- Many dialects: CommonMark, GitHub Flavored Markdown, MDX, custom docs flavors.
- HTML passthrough makes Markdown less simple than it looks.
- Tables are weak and hard to extend.
- Nested lists are visually compact but parser-sensitive.
- Footnotes, definition lists, admonitions, tasks, and directives vary by implementation.
- Source provenance is not native.
- Attributes are not native.
- Comments and hidden content can create review gaps.
- Machine-readable metadata usually requires YAML frontmatter or another convention.
- The syntax is convenient for authors, but not necessarily ideal for validated exchange.

## Specific Issues With HTML

Working list of pain points:

- Real web HTML is noisy: navigation, scripts, style, tracking, layout wrappers.
- Full HTML carries decades of compatibility baggage.
- Modern HTML often uses generic `div` and `span` instead of semantic tags.
- Token overhead is real.
- Strict XML-style output may be brittle for models.
- HTML is associated with presentation, so the subset must be explicitly semantic and style-free.

## First Proposed Profile

Name: Agent HTML Profile 0.1

Rules:

- Documents may be full documents or fragments.
- No styling.
- No scripting.
- No event attributes.
- Tags must be lowercase.
- Attributes must be quoted.
- Void tags must be closed in XHTML mode.
- Text content must be escaped.
- Only the allowed tag set is valid.
- Unknown tags are invalid by default.
- `img` requires `alt`.
- `a` requires `href`.
- `table` should use `thead` when headers exist.
- `section` should have a heading or `aria-label`-like title mechanism, but this needs discussion.
- Metadata belongs in `head` for full documents and in an external envelope for fragments.

Allowed attributes, first pass:

- global: `id`, `lang`, `title`
- links: `href`, `rel`
- images: `src`, `alt`, `title`, `width`, `height`
- time: `datetime`
- code: `data-language`
- table cells: `colspan`, `rowspan`
- data: `value`

Maybe attributes:

- `class`, only for whitelisted semantic classes.
- `data-*`, only for namespaced machine data.
- `role`, if using ARIA-like semantics helps agents.

## Example

Markdown:

```md
# Product Options

The starter plan is best for small sites.

| Plan | Price | Best for |
| --- | ---: | --- |
| Starter | EUR 19 | Small business sites |
| Studio | EUR 49 | Agencies |

See [pricing](/pricing).
```

Agent HTML:

```html
<article>
  <h1>Product Options</h1>
  <p>The starter plan is best for small sites.</p>
  <table>
    <thead>
      <tr>
        <th>Plan</th>
        <th>Price</th>
        <th>Best for</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Starter</td>
        <td>EUR 19</td>
        <td>Small business sites</td>
      </tr>
      <tr>
        <td>Studio</td>
        <td>EUR 49</td>
        <td>Agencies</td>
      </tr>
    </tbody>
  </table>
  <p>See <a href="/pricing">pricing</a>.</p>
</article>
```

The HTML version is longer, but the table is structurally clearer and easier to validate.

## Research Questions

- Do current frontier models follow a small XHTML subset more reliably than full HTML?
- Does a strict subset improve downstream parsing compared with Markdown?
- How much token overhead does the subset add for common content types?
- Does semantic HTML improve RAG answer quality compared with Markdown for tables, pricing, policies, and nested content?
- Is a repair-and-validate loop enough to make XHTML practical?
- Should the profile be valid browser HTML, valid XML, or both?
- Should fragments be first-class?
- Should metadata use `head`, YAML frontmatter, JSON-LD, or an external envelope?
- How should provenance be represented?
- Should the format include forms/actions for agents, or stay read-only?
- Is "AIML" too confusing as a name?

## Suggested Experiments

1. Take the same Headcode page content and emit Markdown, raw HTML, cleaned semantic HTML, and XHTML fragment variants.
2. Measure tokens for each representation.
3. Ask models to answer factual questions, cite evidence, and modify content in each format.
4. Validate outputs against the proposed profile.
5. Track parse failures, hallucinated structure, missing links, broken tables, and repair cost.
6. Repeat for pages, blog posts, pricing tables, FAQs, image-heavy sections, and MCP tool results.

## Source Notes

- Cloudflare, "Markdown for Agents": https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
- Search Engine Journal, "Google's Mueller Calls Markdown-For-Bots Idea 'A Stupid Idea'": https://www.searchenginejournal.com/googles-mueller-calls-markdown-for-bots-idea-a-stupid-idea/566598/
- W3C, HTML 2.0 specification: https://www.w3.org/MarkUp/html-spec/html-spec.html
- W3C, HTML 3.2 features at a glance: https://www.w3.org/MarkUp/Wilbur/features.html
- W3C, XHTML 1.0 Strict cheat sheet: https://www.w3.org/2010/04/xhtml10-strict.html
- Tan et al., "HtmlRAG: HTML is Better Than Plain Text for Modeling Retrieved Knowledge in RAG Systems": https://arxiv.org/abs/2411.02959
- Checksum, "Does Output Format Actually Matter? An Experiment Comparing JSON, XML, and Markdown for LLM Tasks": https://checksum.ai/blog/does-output-format-actually-matter-an-experiment-comparing-json-xml-and-markdown-for-llm-tasks
- Wang et al., "When Skills Lie: Hidden-Comment Injection in LLM Agents": https://arxiv.org/abs/2602.10498
- Artificial Intelligence Markup Language background: https://en.wikipedia.org/wiki/Artificial_Intelligence_Markup_Language

## Next Discussion Agenda

- Decide whether the first target is website page content, chat responses, tool results, RAG chunks, or all of them.
- Decide whether browser-valid HTML compatibility is mandatory.
- Decide whether the root should be `html`, `article`, `aiml`, or fragment-only.
- Refine the first allowed tag and attribute list.
- Build a small validator and sample corpus if the idea still feels promising.
