/**
 * Tool registration.
 *
 * Grouped by what they reach rather than by API endpoint, because the question
 * a reader has is "what can this see", never "which URL does this call".
 *
 * Under VIMEO_READ_ONLY the write modules are not registered at all. The tools
 * disappear from the list rather than erroring when called: a model cannot call
 * a tool it cannot see, whereas an error is an invitation to retry differently.
 */

import { registerVideoTools } from "./videos.js";
import { registerFolderTools } from "./folders.js";
import { registerShowcaseTools } from "./showcases.js";
import { registerChapterTools } from "./chapters.js";
import { registerCaptionTools } from "./captions.js";
import { registerCommentTools } from "./comments.js";
import { registerMetaTools } from "./meta.js";
import type { ToolContext } from "./types.js";

export function registerAllTools(ctx: ToolContext): void {
  registerVideoTools(ctx);
  registerFolderTools(ctx);
  registerShowcaseTools(ctx);
  registerChapterTools(ctx);
  registerCaptionTools(ctx);
  registerCommentTools(ctx);
  registerMetaTools(ctx);
}

export type { ToolContext } from "./types.js";
