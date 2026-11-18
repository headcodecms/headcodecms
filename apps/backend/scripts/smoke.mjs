// End-to-end check of an MCP URL, the way an MCP client connects:
// 401 challenge -> resource metadata -> auth server metadata -> client
// registration (DCR) -> sign-in -> authorize -> consent -> token -> tools.
// Then the schema and entries, with the smoke test's own schema (the
// project's schema is restored at the end), and a second user checks the
// member rules: live for everyone signed in, draft and writes for members,
// schema and member changes for admins.
//
//   node scripts/smoke.mjs [mcp-url]
//
// SMOKE_EMAIL / SMOKE_PASSWORD: an admin of the project (locally the dev
// account dev@headcode.local). SMOKE_GUEST_EMAIL: a second account with a
// verified address. Accounts are created if sign-up is open. Defaults are for
// local development only.
import { createHash, randomBytes } from "node:crypto";

const mcpUrl = process.argv[2] ?? "http://localhost:3080/p/demo/mcp";
const email = process.env.SMOKE_EMAIL ?? "dev@headcode.local";
const guestEmail = process.env.SMOKE_GUEST_EMAIL ?? "guest@headcode.local";
const password = process.env.SMOKE_PASSWORD ?? "headcode-dev";
const redirectUri = "http://127.0.0.1:9999/callback";

const timings = {};
const step = async (name, fn) => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    timings[name] = Math.round(performance.now() - start);
  }
};
const check = (ok, message) => {
  if (!ok) throw new Error(message);
  console.log(`ok  ${message}`);
};
const b64url = (buffer) => buffer.toString("base64url");
const decode = (part) => JSON.parse(Buffer.from(part, "base64url").toString());

// 1. Without a token: 401 with RFC 9728 resource metadata.
const challenge = await step("challenge", () =>
  fetch(mcpUrl, { method: "POST", body: "{}" }),
);
// Without WWW-Authenticate, MCP clients fall back to the well-known URL
// (RFC 9728 path insertion), as this check does.
const wwwAuthenticate = challenge.headers.get("www-authenticate");
const { origin, pathname } = new URL(mcpUrl);
const metadataUrl =
  wwwAuthenticate?.match(/resource_metadata="([^"]+)"/)?.[1] ??
  `${origin}/.well-known/oauth-protected-resource${pathname}`;
check(
  challenge.status === 401,
  `401 (${wwwAuthenticate ? "with resource_metadata" : "WWW-Authenticate missing, well-known fallback"})`,
);

const resource = await step("resource metadata", () =>
  fetch(metadataUrl).then((r) => r.json()),
);
check(resource.resource === mcpUrl, `resource is ${mcpUrl}`);
const issuer = new URL(resource.authorization_servers[0]);
const server = await step("auth server metadata", () =>
  fetch(
    `${issuer.origin}/.well-known/oauth-authorization-server${issuer.pathname}`,
  ).then((r) => r.json()),
);
check(server.issuer === issuer.href, `issuer ${server.issuer}`);

// 2. Register a public client (DCR).
const client = await step("register", () =>
  fetch(server.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Headcode smoke test",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  }).then((r) => r.json()),
);
check(client.client_id, "client registered");

// 3. Sign in (or sign up), authorize with PKCE, accept consent, get a token.
const authBase = issuer.href.replace(/\/$/, "");
const post = (path, body) =>
  fetch(`${authBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: issuer.origin },
    body: JSON.stringify(body),
  });

async function signIn(email, label) {
  let session = await step(`${label} sign-in`, () =>
    post("/sign-in/email", { email, password }),
  );
  if (!session.ok)
    session = await step(`${label} sign-up`, () =>
      post("/sign-up/email", { email, password, name: email }),
    );
  const cookie = session.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  check(session.ok && cookie, `signed in as ${email}`);

  const verifier = b64url(randomBytes(32));
  const authorize = new URL(server.authorization_endpoint);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: redirectUri,
    scope: resource.scopes_supported.join(" "),
    state: "smoke",
    code_challenge: b64url(createHash("sha256").update(verifier).digest()),
    code_challenge_method: "S256",
    resource: mcpUrl,
  });
  let location = await step(`${label} authorize`, () =>
    fetch(authorize, { headers: { cookie }, redirect: "manual" }).then(
      // Better Auth answers fetch requests with { redirect, url } instead of 302.
      async (r) => r.headers.get("location") ?? (await r.json()).url,
    ),
  );
  if (location && new URL(location, issuer).pathname === "/consent") {
    const consent = await step(`${label} consent`, () =>
      fetch(`${authBase}/oauth2/consent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: issuer.origin,
          cookie,
        },
        body: JSON.stringify({
          accept: true,
          oauth_query: new URL(location, issuer).search.slice(1),
        }),
      }).then((r) => r.json()),
    );
    location = consent.url;
  }
  const code = location && new URL(location).searchParams.get("code");
  if (!code) console.log("redirect:", location);
  check(code, "authorization code");

  const token = await step(`${label} token`, () =>
    fetch(server.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: client.client_id,
        code_verifier: verifier,
        resource: mcpUrl,
      }),
    }).then((r) => r.json()),
  );
  const [header, payload] = (token.access_token ?? "").split(".");
  check(
    header &&
      decode(header).typ === "at+jwt" &&
      [decode(payload).aud].flat().includes(mcpUrl),
    `JWT access token (${decode(header).alg}) for ${decode(payload).aud}`,
  );
  return token.access_token;
}

// 4. MCP tools with a token.
let id = 0;
const rpc = (token, url, method, params) =>
  fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
// Resolves to the tool result, or to { refused: message } when the tool says no.
const call = async (token, name, args = {}) => {
  const response = await step(`tools/call ${name}`, () =>
    rpc(token, mcpUrl, "tools/call", { name, arguments: args }).then((r) =>
      r.json(),
    ),
  );
  if (response.error) return { refused: response.error.message };
  if (response.result?.isError)
    return { refused: JSON.stringify(response.result.content) };
  return response.result.structuredContent;
};
// True only for the expected "no", so an internal error does not pass as one.
const refused = (result, text) => result.refused?.includes(text) ?? false;

const admin = await signIn(email, "admin");
const init = await step("initialize", () =>
  rpc(admin, mcpUrl, "initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "smoke", version: "1" },
  }).then((r) => r.json()),
);
check(init.result?.serverInfo, `initialize: ${init.result?.serverInfo?.name}`);
const tools = await step("tools/list", () =>
  rpc(admin, mcpUrl, "tools/list", {}).then((r) => r.json()),
);
check(
  tools.result?.tools?.length === 16,
  `tools: ${tools.result?.tools?.map((t) => t.name).join(", ")}`,
);
// 5. Schema and entries. The smoke test brings its own schema and restores
// the project's schema at the end.
const saved = await call(admin, "schema_get");
const smokeSection = {
  type: "object",
  properties: {
    title: { type: "string", field: "text" },
    stamp: { type: "string", field: "text" },
  },
  required: ["title", "stamp"],
  additionalProperties: false,
};
// Added to the project's schema, so its other entries stay valid for publish.
const withSmoke = (section) => ({
  sections: { ...saved.sections, smoke: section },
  globals: [
    ...(saved.globals ?? []).filter((g) => g.slug !== "smoke"),
    { slug: "smoke", description: "Smoke test", sections: ["smoke"] },
  ],
  collections: saved.collections ?? [],
});
const smokeSchema = withSmoke(smokeSection);
const smokeEntry = (data) => ({
  slug: "smoke",
  sections: [{ name: "smoke", data }],
});
try {
  check(
    refused(
      await call(admin, "schema_push", {
        schema: { sections: {}, globals: [{ slug: "x", sections: ["nope"] }] },
      }),
      'uses the unknown section "nope"',
    ),
    "invalid schema refused",
  );
  const pushed = await call(admin, "schema_push", { schema: smokeSchema });
  check(
    pushed.globals >= 1,
    `schema pushed (${pushed.invalid?.length} invalid)`,
  );

  const stamp = new Date().toISOString();
  await call(admin, "entry_update", {
    ...smokeEntry({ title: "Smoke", stamp }),
    version: "draft",
  });
  const draft = await call(admin, "entry_get", {
    slug: "smoke",
    version: "draft",
  });
  check(
    draft.sections?.[0]?.data?.stamp === stamp,
    "draft write and read back",
  );
  const changes = await call(admin, "changes_list");
  check(
    changes.changes?.some((c) => c.slug === "smoke" && c.status === "new"),
    "changes list the new draft entry",
  );
  const { token } = await call(admin, "preview_link");
  const draftUrl = mcpUrl.replace(/\/mcp$/, "/draft/smoke");
  const preview = await fetch(draftUrl, {
    headers: { "x-headcode-preview": token },
  }).then((r) => r.json());
  const noToken = await fetch(draftUrl);
  check(
    preview.sections?.[0]?.data?.stamp === stamp && noToken.status === 401,
    "preview token reads the draft, without it 401",
  );
  check(
    refused(
      await call(admin, "entry_update", {
        ...smokeEntry({ title: 1 }),
        version: "draft",
      }),
      "does not match the schema",
    ),
    "entry that does not match its section is refused",
  );
  check(
    refused(
      await call(admin, "entry_update", {
        // "smoke" is a global, so the collection "smoke" is not in the schema.
        slug: "smoke/missing",
        sections: [],
        version: "draft",
      }),
      '"smoke/missing" is not in the schema',
    ),
    "entry outside the schema is refused",
  );
  check(
    refused(
      await call(admin, "entry_get", { slug: "smoke", version: "live" }),
      "No entry smoke in live",
    ),
    "draft write did not touch live",
  );
  await call(admin, "entry_update", {
    ...smokeEntry({ title: "Smoke live", stamp }),
    version: "live",
  });
  const live = await call(admin, "entries_list", { version: "live" });
  check(
    live.entries?.some((e) => e.slug === "smoke" && !("sections" in e)),
    `live lists ${live.entries?.length} entries without sections`,
  );
  const stricter = await call(admin, "schema_push", {
    schema: withSmoke({
      ...smokeSection,
      properties: { ...smokeSection.properties, lead: { type: "string" } },
      required: [...smokeSection.required, "lead"],
    }),
  });
  check(
    stricter.invalid?.filter((i) => i.slug === "smoke").length === 2,
    "stricter schema is saved and reports the entries to fix",
  );
  check(
    refused(await call(admin, "publish"), "Not published"),
    "publish refused while a draft entry does not match",
  );
  await call(admin, "schema_push", { schema: smokeSchema });

  const published = await call(admin, "publish");
  const afterPublish = await call(admin, "entry_get", {
    slug: "smoke",
    version: "live",
  });
  check(
    published.snapshot && afterPublish.sections?.[0]?.data?.title === "Smoke",
    `publish copies draft to live (${published.entries} entries, site refreshed: ${published.site_refreshed})`,
  );
  const snapshots = await call(admin, "snapshots_list");
  check(
    snapshots.snapshots?.[0]?.id === published.snapshot,
    "snapshot of live before publish",
  );
  const rolledBack = await call(admin, "rollback", {
    snapshot: published.snapshot,
  });
  const afterRollback = await call(admin, "entry_get", {
    slug: "smoke",
    version: "live",
  });
  check(
    rolledBack.snapshot > published.snapshot &&
      afterRollback.sections?.[0]?.data?.title === "Smoke live",
    "rollback restores live and saves a snapshot to undo it",
  );

  // 6. Member rules with a second account.
  await call(admin, "member_revoke", { email: guestEmail }); // left over from a failed run
  const guest = await signIn(guestEmail, "guest");
  const guestLive = await call(guest, "entry_get", {
    slug: "smoke",
    version: "live",
  });
  check(
    guestLive.sections?.[0]?.data?.title === "Smoke live",
    "guest reads live",
  );
  check(
    refused(
      await call(guest, "entry_get", { slug: "smoke", version: "draft" }),
      "Only members of this project can read the draft",
    ),
    "guest cannot read draft",
  );
  check(
    refused(
      await call(guest, "entry_update", {
        ...smokeEntry({ title: "Guest", stamp }),
        version: "draft",
      }),
      "Only members of this project can change entries",
    ),
    "guest cannot write",
  );
  check(
    refused(
      await call(guest, "publish"),
      "Only members of this project can publish",
    ),
    "guest cannot publish",
  );
  check(
    refused(
      await call(guest, "preview_link"),
      "Only members of this project can see the preview link",
    ) &&
      refused(
        await call(guest, "draft_reset"),
        "Only members of this project can reset the draft",
      ),
    "guest cannot see the preview link or reset the draft",
  );
  check(
    refused(
      await call(guest, "schema_push", { schema: smokeSchema }),
      "Only admins of this project can push the schema",
    ),
    "guest cannot push the schema",
  );
  check(
    refused(
      await call(guest, "member_grant", { email: guestEmail, role: "admin" }),
      "Only admins of this project can manage members",
    ),
    "guest cannot grant",
  );
  await call(admin, "member_grant", { email: guestEmail, role: "editor" });
  const invited = await call(guest, "entry_get", {
    slug: "smoke",
    version: "draft",
  });
  check(
    invited.sections?.[0]?.data?.stamp === stamp,
    "invited editor reads draft",
  );
  const members = await call(admin, "members_list");
  check(
    members.members?.some((m) => m.email === guestEmail && m.joined),
    `members: ${members.members?.map((m) => `${m.email} (${m.role})`).join(", ")}`,
  );
  check(
    refused(
      await call(guest, "member_revoke", { email }),
      "Only admins of this project can manage members",
    ),
    "editor cannot revoke",
  );
  await call(admin, "member_grant", { email: guestEmail, role: "admin" });
  const left = await call(guest, "member_revoke", { email: guestEmail });
  check(
    left.members && !left.members.some((m) => m.email === guestEmail),
    "second admin removes themselves",
  );
  check(
    refused(
      await call(guest, "entry_get", { slug: "smoke", version: "draft" }),
      "Only members of this project can read the draft",
    ),
    "revoked guest cannot read draft",
  );
  check(
    refused(
      await call(admin, "member_revoke", { email }),
      "A project needs at least one admin",
    ),
    "last admin cannot be removed",
  );
} finally {
  // Cleanup also after a failed check, which then stays the reported error.
  await call(admin, "entry_delete", { slug: "smoke", version: "draft" });
  await call(admin, "entry_delete", { slug: "smoke", version: "live" });
  if (saved.sections) await call(admin, "schema_push", { schema: saved });
}
const after = await call(admin, "entries_list", { version: "live" });
check(
  after.entries && !after.entries.some((e) => e.slug === "smoke"),
  `smoke entries deleted${saved.sections ? ", schema restored" : ""}`,
);

// 7. The token is bound to this project's URL.
const other = mcpUrl.replace(/\/p\/[^/]+\/mcp$/, "/p/other/mcp");
const wrongAudience = await rpc(admin, other, "tools/list", {});
check(wrongAudience.status === 401, "token rejected for another project");

console.log("\ntimings (ms):", timings);
