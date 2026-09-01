/**
 * `vimeo-mcp doctor`
 *
 * Integrations fail for about six reasons and every one of them looks identical
 * from inside an MCP client, which reports "the tool errored" and nothing else.
 *
 * Two of those six are specific to Vimeo and account for most of the confusion:
 *
 * - A token's scopes are fixed when it is generated. The `delete` box is off by
 *   default, so a token that reads and edits perfectly will fail every delete,
 *   and Vimeo's 403 does not name the missing scope.
 *
 * - Analytics and teams answer 404 on a free plan rather than saying the plan
 *   is the problem, which reads as "no such video".
 *
 * So this command names both explicitly instead of leaving them to be
 * discovered on a failing call.
 */

import { VimeoClient } from "./api/client.js";
import { loadConfig, VIMEO_SCOPES } from "./config.js";

/** Tools that cannot work without a given scope. */
const SCOPE_DEPENDENTS: Record<string, string[]> = {
  delete: [
    "delete_video",
    "delete_folder",
    "delete_showcase",
    "delete_chapter",
    "delete_texttrack",
    "delete_comment",
  ],
  create: ["create_folder", "create_showcase"],
  edit: ["update_video", "update_folder", "update_showcase", "set_video_tags", "add_chapter"],
  upload: ["upload_video", "upload_texttrack", "set_video_thumbnail"],
  interact: ["add_videos_to_folder", "remove_videos_from_folder", "add_comment"],
  video_files: ["get_download_links"],
  stats: ["get_video_analytics"],
  private: ["list_folders", "get_folder"],
};

export async function runDoctor(): Promise<number> {
  const config = loadConfig();
  const out = (line: string): void => {
    process.stdout.write(`${line}\n`);
  };

  out("vimeo-mcp doctor");
  out("");

  if (!config.token) {
    out("  FAIL  No token found.");
    out("");
    out("        Set VIMEO_PAT to a personal access token.");
    out("        Generate one at https://developer.vimeo.com/apps: open your app,");
    out("        then the Authentication section, and tick the scopes you need.");
    out("        Tick 'delete' if you want the delete tools to work: it is off by");
    out("        default and cannot be added to a token afterwards.");
    return 1;
  }

  out(`  ok    Token found (${config.token.length} characters).`);

  const client = new VimeoClient(config);
  let scopes: string[] = [];
  let plan: string | undefined;

  try {
    const verified = await client.verify();
    scopes = verified.scopes;
    plan = verified.user?.account;
    out(`  ok    Token is valid.`);
    out(`        Account:  ${verified.user?.name ?? "unknown"}`);
    out(`        App:      ${verified.app?.name ?? "unknown"}`);
    out(`        Plan:     ${plan ?? "unknown"}`);
  } catch (error) {
    out(`  FAIL  The token was rejected: ${(error as Error).message}`);
    return 1;
  }

  out("");
  out("  Scopes on this token:");
  for (const scope of VIMEO_SCOPES) {
    const held = scopes.includes(scope);
    const dependents = SCOPE_DEPENDENTS[scope];
    const mark = held ? "  yes" : "   no";
    const detail =
      !held && dependents ? `  (disables ${dependents.length} tool${dependents.length > 1 ? "s" : ""})` : "";
    out(`   ${mark}  ${scope}${detail}`);
  }

  let failures = 0;

  const missing = Object.entries(SCOPE_DEPENDENTS).filter(([scope]) => !scopes.includes(scope));
  if (missing.length > 0) {
    out("");
    out("  Tools that will fail with this token:");
    for (const [scope, tools] of missing) {
      out(`        ${scope} is missing, so these fail: ${tools.join(", ")}`);
    }
    out("");
    out("        Vimeo fixes a token's scopes when it is created, so these cannot");
    out("        be granted now. Generate a new token with the boxes ticked and");
    out("        update VIMEO_PAT.");
    failures += 1;
  }

  // Analytics is the one capability that depends on the plan rather than the
  // token, and it is worth testing rather than inferring from the plan name,
  // since Vimeo's tier names change more often than the API does.
  out("");
  try {
    const videos = await client.list<{ uri?: string }>("/me/videos", {
      params: { per_page: 1, fields: "uri" },
    });
    const first = videos.data[0]?.uri;
    if (!first) {
      out("  note  The library is empty, so analytics could not be tested.");
    } else {
      const id = first.split("/").pop();
      try {
        await client.request("GET", `/videos/${id}/analytics`, {
          params: { dimension: "time" },
        });
        out("  ok    Analytics is available on this account.");
      } catch {
        out("  note  Analytics is not available on this account.");
        out(`        Vimeo's reporting API needs a paid plan and this one is "${plan}".`);
        out("        get_video_analytics will explain this rather than erroring.");
        out("        get_video_stats still returns lifetime play counts.");
      }
    }
  } catch (error) {
    out(`  warn  Could not reach the library: ${(error as Error).message}`);
  }

  out("");
  out("  Settings:");
  out(`        read-only:        ${config.readOnly ? "on, every write is hidden" : "off"}`);
  out(`        destructive:      ${config.allowDestructive ? "allowed, with confirm" : "blocked"}`);
  out(`        audit log:        ${config.auditPath ?? "off"}`);
  out(`        API version:      ${config.apiVersion}`);
  out(`        request timeout:  ${config.requestTimeoutMs}ms`);

  out("");
  out(failures === 0 ? "  All good." : "  Finished with warnings above.");
  return failures === 0 ? 0 : 1;
}
