# Vimeo MCP

Give your AI assistant real access to your Vimeo library: videos, folders, showcases, chapters, transcripts, comments, tags, privacy and embed presets.

```
You:    Which videos in my library have no chapters and run over 30 minutes?

Claude: Six. The longest is "AI Affiliate Marketing Secrets Workshop" at 1h 4m.
        I read its transcript and drafted ten chapter markers. Want them added?

You:    Yes, and file all six into the Workshops folder.

Claude: Added 10 chapters. Moved all six in one call.
```

Built by [Navid Moazzez](https://navid.me).

> **Not published to npm yet.**
> The `npx` lines below are the shape they will take. Until the first release,
> install from source: clone the repo, `npm install`, `npm run build`, then
> point your client at `node /absolute/path/to/dist/index.js`.

## Contents

1. [What you can ask it](#1-what-you-can-ask-it-)
2. [Quick install](#2-quick-install-)
3. [Setup](#3-setup-)
4. [Connect your client](#4-connect-your-client-)
5. [Check it worked](#5-check-it-worked-)
6. [Tools](#6-tools-)
7. [Writing safely](#7-writing-safely-)
8. [How Vimeo actually behaves](#8-how-vimeo-actually-behaves-)
9. [Your data](#9-your-data-)
10. [Troubleshooting](#10-troubleshooting-)
11. [FAQ](#faq-)

## 1. What you can ask it 💬

- "What's in my Vimeo library, and how much of it is unfiled?"
- "Read the transcript of the affiliate marketing workshop and write show notes."
- "Generate chapter markers for that talk from its transcript and add them."
- "Move every video with 'Workshop' in the title into the Workshops folder."
- "Which videos are set to public that shouldn't be?"
- "Build a showcase called Bootcamp 2026 and add these eight videos to it."
- "Add English captions to this video from the VTT file I just made."
- "How many plays does each video in the AI for Creators folder have?"
- "Pull the download link for the original file of video 1096473192."
- "Which of my videos have no tags?"

The one that is impossible without this: **filing a back catalogue.** Vimeo's own
tools move videos between folders one at a time. `add_videos_to_folder` takes up
to 100 ids in a single call, so reorganising a library of hundreds of videos is
one request rather than hundreds.

## 2. Quick install ⚡

Node 20 or newer. Nothing else.

```bash
npx -y @thenavidm/vimeo-mcp --version
```

That is the whole install. `npx` fetches it on demand, so there is nothing to
update later.

## 3. Setup 🔑

You need a Vimeo personal access token.

**Read this before you generate one.** A token's scopes are fixed the moment it
is created and cannot be changed afterwards. If you miss a box, the only fix is
to generate a new token. The two people most often miss:

- **`delete`** is off by default. Without it every delete tool fails.
- **`video_files`** is off by default. Without it you cannot get download links.

### Have an agent do it

The agent cannot sign in to Vimeo for you. Only you can create the token. What
it can do is walk you through it, wire up the config and verify the connection.

Paste this into Claude Code, Cursor, or any agent with terminal access:

```
Help me set up the Vimeo MCP server.

1. Tell me how to create a Vimeo personal access token, and which scopes to
   tick. Then stop and wait: I will paste the token back to you.
2. Once I give you the token, add the server to my MCP client config with the
   token in the env block.
3. Run the doctor command and tell me what it says about my scopes and plan.
```

### Or do it yourself

1. Go to <https://developer.vimeo.com/apps> and sign in.
2. Create an app, or open one you already have.
3. Open the app's **Authentication** section.
4. Find the personal access token area and generate a new token.
5. Tick the scopes you want. `public`, `private`, `edit`, `create`, `interact`
   and `upload` cover everyday use. Add `delete` if you want the delete tools
   and `video_files` if you want download links. `stats` only does something on
   a paid plan.
6. Copy the token immediately. Vimeo shows it once.

### To revoke it

Go back to the same Authentication section and delete the token. It stops
working at once, everywhere it is configured.

## 4. Connect your client 🔌

### Claude Code

```bash
claude mcp add vimeo \
  -e VIMEO_PAT=your_token_here \
  -- npx -y @thenavidm/vimeo-mcp@latest
```

Add `--scope user` to make it available in every project rather than just this one.

### Claude Desktop

| Platform | Config path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "vimeo": {
      "command": "npx",
      "args": ["-y", "@thenavidm/vimeo-mcp@latest"],
      "env": { "VIMEO_PAT": "your_token_here" }
    }
  }
}
```

> **Tip**
> Claude Desktop does not inherit your shell PATH. If `npx` is not found, use
> the absolute path from `which npx`.

Quit Claude Desktop completely and reopen it.

### claude.ai on the web

claude.ai runs connectors from Anthropic's cloud, not from your machine, so it
needs a public HTTPS URL rather than a local command.

```bash
npx -y @thenavidm/vimeo-mcp@latest --http --port 8000
```

Host that behind a public HTTPS URL, set `VIMEO_HTTP_TOKEN` to a secret of your
choosing, then in claude.ai go to **Customize**, **Connectors**, **+**,
**Add custom connector**, and paste the URL.

### Cursor

`.cursor/mcp.json`, same JSON shape as Claude Desktop, key `mcpServers`.

### Windsurf

`~/.codeium/windsurf/mcp_config.json`, key `mcpServers`.

### VS Code

`.vscode/mcp.json`. The key is **`servers`**, not `mcpServers`, and each entry
takes `"type": "stdio"`.

### Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.vimeo]
command = "npx"
args = ["-y", "@thenavidm/vimeo-mcp@latest"]

[mcp_servers.vimeo.env]
VIMEO_PAT = "your_token_here"
```

### Gemini CLI

`~/.gemini/settings.json`, key `mcpServers`.

### Everything else

Any stdio MCP client takes the same three things: the command `npx`, the args,
and the env block.

## 5. Check it worked 🩺

```bash
npx -y @thenavidm/vimeo-mcp@latest doctor
```

It prints the account, the plan, every scope the token holds, and a list of any
tools that will fail because a scope is missing. Both of the things that
actually go wrong show up here.

## 6. Tools 🛠️

43 tools. 17 of them are reads, and those are the only ones that remain when
`VIMEO_READ_ONLY=1` is set.

### Videos

| Tool | What it does |
|---|---|
| `list_videos` | List your library, optionally filtered to one folder |
| `get_video` | Full detail on one video |
| `search_videos` | Search your own library by title and description |
| `update_video` | Change title, description or privacy |
| `delete_video` | Permanently delete. Needs `delete`, confirms |
| `upload_video` | Upload by giving Vimeo a public URL to pull. Needs `upload` |
| `get_download_links` | Direct URLs for source and rendered files. Needs `video_files` |
| `set_video_thumbnail` | Set the poster frame from a timecode. Needs `upload` |

### Folders

| Tool | What it does |
|---|---|
| `list_folders` | Your folders with video counts |
| `get_folder` | One folder and what is in it |
| `create_folder` | Needs `create` |
| `update_folder` | Rename |
| `delete_folder` | Needs `delete`, confirms |
| `add_videos_to_folder` | **Up to 100 videos in one call** |
| `remove_videos_from_folder` | **Up to 100 in one call.** Unfiles by default |

### Showcases

| Tool | What it does |
|---|---|
| `list_showcases` | Your showcases with video counts |
| `get_showcase` | One showcase and its videos in curated order |
| `create_showcase` | Needs `create` |
| `update_showcase` | Name, description, privacy, sort order |
| `delete_showcase` | Needs `delete`, confirms. Videos survive |
| `add_video_to_showcase` | Adds a reference, does not move the video |
| `remove_video_from_showcase` | Removes the reference only |

### Chapters

| Tool | What it does |
|---|---|
| `list_chapters` | Chapters in timecode order |
| `add_chapter` | Add a marker at a timecode |
| `update_chapter` | Retitle or move it |
| `delete_chapter` | Needs `delete`, confirms |

### Captions and transcripts

| Tool | What it does |
|---|---|
| `list_texttracks` | Caption tracks and their languages |
| `get_transcript` | The transcript as plain text, or raw WebVTT |
| `upload_texttrack` | Add captions from WebVTT you supply. Needs `upload` |
| `update_texttrack` | Rename, change language, or set active |
| `delete_texttrack` | Needs `delete`, confirms |

### Comments

| Tool | What it does |
|---|---|
| `list_comments` | Comments, wrapped as untrusted text |
| `add_comment` | Post publicly as you. Needs `interact`, confirms |
| `edit_comment` | Edit your own |
| `delete_comment` | Needs `delete`, confirms |

### Account, stats and settings

| Tool | What it does |
|---|---|
| `get_me` | Account, plan, storage and the token's scopes |
| `get_video_stats` | Lifetime plays, comments and likes. Every plan |
| `get_video_analytics` | Views over time and finish rate. **Paid plans only** |
| `set_video_tags` | Replace a video's tags |
| `get_video_privacy` | Who can watch and embed, plus the domain whitelist |
| `allow_embed_domain` | Allow one domain to embed |
| `list_embed_presets` | Your saved player presets |
| `apply_embed_preset` | Apply one to a video |

## 7. Writing safely ✍️

Writes work by default. Publishing and organising is the point of the tool.

Seven tools refuse to run without `confirm: true`: the six deletes, and
`add_comment`, because a comment is visible to everyone who can see the video
the moment it posts. Nothing else is gated, because moving a video between
folders or editing a title is one call to undo, and asking to confirm everything
teaches a model to confirm reflexively.

Two flags deserve their own mention. `delete_videos_too` on `delete_folder` and
`remove_videos_from_folder` destroys videos rather than unfiling them. Both
default to false and both route through the confirm path when set.

| Setting | Effect |
|---|---|
| `VIMEO_READ_ONLY=1` | Write tools are not registered at all. 17 tools remain |
| `VIMEO_ALLOW_DESTRUCTIVE=0` | Keeps ordinary writes, blocks deletes and comments |
| `VIMEO_AUDIT_LOG=<path>` | One JSON line per attempted write, allowed and blocked |

| | `readOnlyHint` | `destructiveHint` | `idempotentHint` |
|---|---|---|---|
| Reads | true | false | true |
| Reversible writes | false | false | true |
| Deletes and comments | false | true | false |

**On prompt injection.** Comment text is written by other people and can contain
instructions aimed at whatever reads it. Every comment comes back wrapped and
labelled as viewer-authored data, which helps and is not a guarantee. For an
agent working unattended on other people's content, `VIMEO_READ_ONLY=1` is the
real defence.

## 8. How Vimeo actually behaves 🎬

The things that surprise people, learned the hard way.

**Scopes are frozen at creation.** A token cannot gain a scope later. `delete`
and `video_files` are both off by default, and Vimeo's 403 does not name the
missing scope, so a failing delete looks like a missing video. `doctor` names it.

**A 404 can mean "your plan does not include this".** Analytics and teams both
answer 404 rather than 402 on a free account. `get_video_analytics` translates
that into a plain sentence instead of passing the confusion along.

**Two things are called analytics.** `stats.plays` is a lifetime counter on
every plan. The analytics API is views over time and finish rate, on paid plans.

**A video lives in exactly one folder.** Adding it to a folder moves it. A
showcase is different: any video can be in any number of showcases, and adding
it there moves nothing.

**Vimeo expands nested objects in full.** Asking for a video's `parent_folder`
returns the folder, its owner, that owner's avatar in nine sizes and their
upload quota, which is about two kilobytes to learn a folder name. This server
always requests specific leaf fields, which is why its output is small.

**The bulk endpoints are inconsistent.** Folder add and remove take the video
list as a `uris` query parameter. The showcase bulk endpoint takes a `videos`
body field, and it *replaces* the showcase contents rather than appending, which
is why this server does not expose it: adding to a showcase goes one video at a
time so a curated list cannot be wiped by accident.

**Transcripts are two requests.** The API returns caption metadata with a link,
and the text lives at that link on a CDN. The link is signed and short-lived, so
it cannot be cached or handed to someone to open later.

**Uploads are asynchronous.** `upload_video` returns a video id straight away
while transcoding continues. Watch `status` on `get_video` until it reads
`available`.

## 9. Your data 📂

There is no backend. This server runs on your machine and talks to
`api.vimeo.com` directly.

It stores nothing. No session file, no cache, no database. The only file it ever
writes is the audit log, and only when you set `VIMEO_AUDIT_LOG` to a path. That
file contains a timestamp, a tool name and a one-line summary per attempted
write, and it is created with `0600` permissions.

Your token lives wherever you put it, which is your MCP client's config file.
Nothing else is transmitted anywhere.

## 10. Troubleshooting 🔧

Run `doctor` first. It catches most of this.

| Symptom | Cause |
|---|---|
| Every delete fails with a permission error | The token lacks the `delete` scope. It cannot be added: regenerate the token |
| `get_download_links` returns an empty list | The token lacks `video_files`, or downloads are off for that video |
| `get_video_analytics` says analytics is unavailable | The account is on a free plan. `get_video_stats` still works |
| A video "does not exist" but you can see it on vimeo.com | Usually a scope problem rather than a missing video. Check `doctor` |
| A just-uploaded video will not play | Still transcoding. Watch `status` until it reads `available` |
| A video vanished from its folder | `add_videos_to_folder` moves rather than copies. It is in the new folder |
| `npx` not found in Claude Desktop | Desktop does not inherit your shell PATH. Use the full path from `which npx` |
| Rate limited on a bulk job | Raise `VIMEO_MIN_REQUEST_INTERVAL_MS`, and pass whole lists rather than looping |

## FAQ ❓

<details>
<summary><b>What is an MCP server?</b></summary>

A standard way to give an AI assistant real access to a tool, so it can act
rather than guess. You install it once, your assistant gains the tools, and it
works in Claude, Cursor, ChatGPT and anything else that speaks MCP.

</details>

<details>
<summary><b>What is Vimeo?</b></summary>

A video hosting platform. People use it for work that needs to look
professional and stay private: course content, client work, internal training,
webinars. Unlike a public video site, you control exactly who can watch each
video and which sites are allowed to embed it.

</details>

<details>
<summary><b>Do I need to be technical to use this?</b></summary>

You need to paste a token into a config file once. The setup section has a
prompt you can hand to an agent that will do the config part for you. After
that you talk to it in plain language.

</details>

<details>
<summary><b>Is my data sent anywhere? Who can see it?</b></summary>

There is no backend and nothing is collected. The server runs on your machine
and talks to Vimeo's API directly. Whatever you ask your AI assistant is
governed by that assistant's own privacy terms, not by this server.

</details>

<details>
<summary><b>What can it do that I cannot do in Vimeo already?</b></summary>

Bulk work, mostly. Filing a hundred videos into folders is one call here and a
hundred drags in the web app. Reading a transcript and turning it into chapter
markers is a normal request here and manual work there. Everything it does is
something the Vimeo API allows.

</details>

<details>
<summary><b>Can it delete something by accident?</b></summary>

Deleting is guarded twice. Six tools cannot run without `confirm: true`:
`delete_video`, `delete_folder`, `delete_showcase`, `delete_chapter`,
`delete_texttrack` and `delete_comment`. On top of that, most tokens do not have
the `delete` scope, so those tools fail outright unless you deliberately ticked
that box.

The one to watch is `delete_videos_too`, an option on `delete_folder` and
`remove_videos_from_folder` that destroys videos instead of unfiling them. It
defaults to false and needs a confirm when set. If you want no risk at all, run
with `VIMEO_READ_ONLY=1`.

</details>

<details>
<summary><b>Does it cost anything?</b></summary>

The server is free and MIT licensed. You need a Vimeo account, and Vimeo's own
plan limits apply: analytics and teams need a paid plan, and upload limits
depend on your tier.

</details>

<details>
<summary><b>Does it work with ChatGPT, Cursor and Codex, or only Claude?</b></summary>

Any client that speaks MCP. Configs for Claude Code, Claude Desktop, claude.ai,
Cursor, Windsurf, VS Code, Codex CLI and Gemini CLI are all in section 4.

</details>

<details>
<summary><b>Can I connect more than one Vimeo account?</b></summary>

Not in one server instance. A token belongs to one account. To use two, add the
server twice under different names with a different token in each.

</details>

<details>
<summary><b>What happens when my token expires?</b></summary>

Vimeo personal access tokens do not expire on a timer. They stop working when
you revoke them, or when the app they belong to is deleted. If calls suddenly
fail with an authentication error, run `doctor`.

</details>

<details>
<summary><b>How do I disconnect it?</b></summary>

Remove the server from your MCP client's config, then delete the token in your
app's Authentication section at developer.vimeo.com. The second step matters:
removing the config stops this server using it, but revoking it stops anything
using it.

</details>

## Questions

Run into a problem or have a question?
[Open an issue](https://github.com/navidmoazzez/vimeo-mcp/issues) and I will help.

## About the author

Navid Moazzez is a leading AI business strategist and the host of the AI Creator Summit, watched by 100,000+ creators. He helps creators and founders master AI and build their own AI Operating System (AI OS) to automate their business and life. This MCP server is one piece of that system.

**Links**

- Personal website: [navid.me](https://navid.me)
- Store: [navid.bio](https://navid.bio)
- Navid Media: [navid.media](https://navid.media)
- YouTube: [@thenavidm](https://youtube.com/@thenavidm?sub_confirmation=1) and [@thenavidai](https://youtube.com/@thenavidai?sub_confirmation=1)
- X: [@thenavidm](https://x.com/thenavidm)
- Instagram: [@thenavidm](https://instagram.com/thenavidm)
- LinkedIn: [thenavidm](https://linkedin.com/in/thenavidm)

## Dependencies

| Package | Licence | Why |
|---|---|---|
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | MIT | The MCP protocol implementation |
| [zod](https://github.com/colinhacks/zod) | MIT | Tool input schemas and validation |

## License

MIT. See [LICENSE](LICENSE).

© 2026 NM Media. Made with ❤️ by [Navid Moazzez](https://navid.me).
