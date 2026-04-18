# writerdirector-byos App — Full Technical Spec

*Personal screenwriting tool — v1.0 spec*

---

## Part 1: Screenplay Format Reference

### The Complete Rule Set

This is the format engine spec. Every writing pass (Community Theater and Liars Pass) must conform to these rules exactly. The app enforces formatting automatically — the writer types, the app applies structure.

---

### Element Types

#### 1\. Scene Header (Slug Line)

- **Format:** `INT. LOCATION — DAY` / `EXT. LOCATION — NIGHT` / `INT./EXT.` for ambiguous  
- **Rules:** ALL CAPS always. Period after INT/EXT. Em dash (—) separating location from time. Time of day: DAY, NIGHT, CONTINUOUS, LATER, MOMENTS LATER, DAWN, DUSK  
- **Trigger:** Auto-formats when user types a new scene header field and presses Enter  
- **Font:** Courier Prime 12pt (or Courier New), left-aligned, full width  
- **Margins:** Left: 1.5" Right: 1"

#### 2\. Action Line (Scene Description)

- **Format:** Sentence case. Present tense. Third person. Active voice.  
- **Rules:** Character names introduced for the first time in ALL CAPS. Sound effects in ALL CAPS. No camera directions (no "WE SEE", "CAMERA PANS"). Max 4 lines per action block — break into separate blocks for breathing room.  
- **Margins:** Left: 1.5" Right: 1"

#### 3\. Character Cue

- **Format:** ALL CAPS, centered at 3.7" from left  
- **Rules:** Use the character's name exactly as established. Add `(V.O.)` for voiceover, `(O.S.)` for off-screen, `(CONT'D)` if same character speaks across an action line  
- **Trigger:** Auto-caps and centers when user presses Tab from action line  
- **Margins:** Left: 3.7"

#### 4\. Dialogue

- **Format:** Sentence case. Natural line breaks for rhythm.  
- **Rules:** Centered block, narrower than action. Max \~35 characters per line. No quotation marks. Line breaks are meaningful — they reflect natural speech rhythm and emphasis.  
- **Trigger:** Auto-indents after Character Cue  
- **Margins:** Left: 2.5" Right: 2.5"

#### 5\. Parenthetical

- **Format:** `(beat)`, `(quietly)`, `(to herself)` etc. Lowercase, in parens.  
- **Rules:** Use sparingly — only when the read would be ambiguous without it. A good parenthetical is never more than 3 words. Never direct the actor's emotion — only physical action or address target.  
- **Trigger:** Auto-formats when user types `(` while in dialogue mode  
- **Margins:** Left: 3.1" Right: 2.9"

#### 6\. Transition

- **Format:** `CUT TO:`, `FADE TO:`, `SMASH CUT TO:`, `DISSOLVE TO:`, `FADE OUT.`  
- **Rules:** ALL CAPS, right-aligned, followed by a colon (except FADE OUT which ends with period). Use rarely — cuts are implied. `FADE IN:` opens a script. `FADE OUT.` closes it.  
- **Margins:** Right-aligned to 6"

#### 7\. Page Break

- Auto-inserted by the engine. Characters never split mid-dialogue without `(MORE)` at bottom of page and `(CONT'D)` at top of next.

---

### Element Order (Natural Writing Flow)

FADE IN:

INT. LOCATION — DAY

Action line setting the scene.

CHARACTER NAME

(parenthetical if needed)

Dialogue line one

continues here.

SECOND CHARACTER

Response dialogue.

Action line continuing scene.

CUT TO:

INT. NEXT LOCATION — NIGHT

---

### Keyboard Shortcuts (App-Specific)

| Action | Shortcut |
| :---- | :---- |
| New action line → Character cue | `Tab` |
| Character cue → Dialogue | `Enter` |
| Dialogue → New action line | `Enter` \+ `Enter` (double) |
| Dialogue → Parenthetical | `(` key while in dialogue |
| Parenthetical → Dialogue | `Enter` |
| New slug line | `Cmd/Ctrl + Shift + H` |
| Add transition | `Cmd/Ctrl + Shift + T` |
| Bold (for scene emphasis) | `Cmd/Ctrl + B` |
| Toggle element type | `Cmd/Ctrl + Shift + E` |
| Add new scene | `Cmd/Ctrl + Shift + N` |
| Next pass (advance mode) | `Cmd/Ctrl + →` |
| Previous pass | `Cmd/Ctrl + ←` |
| Save | `Cmd/Ctrl + S` (auto-save also runs every 30s) |
| Toggle outline panel | `Cmd/Ctrl + \` |
| Compile to FDX | `Cmd/Ctrl + Shift + X` |

---

### Final Draft FDX Export Format

Final Draft uses XML. Each element maps to a `<Paragraph>` with a `Type` attribute:

\<FinalDraft DocumentType="Script" Version="2"\>

  \<Content\>

    \<Paragraph Type="Scene Heading"\>

      \<Text\>INT. LOCATION — DAY\</Text\>

    \</Paragraph\>

    \<Paragraph Type="Action"\>

      \<Text\>Action line text here.\</Text\>

    \</Paragraph\>

    \<Paragraph Type="Character"\>

      \<Text\>CHARACTER NAME\</Text\>

    \</Paragraph\>

    \<Paragraph Type="Parenthetical"\>

      \<Text\>(quietly)\</Text\>

    \</Paragraph\>

    \<Paragraph Type="Dialogue"\>

      \<Text\>Dialogue text here.\</Text\>

    \</Paragraph\>

    \<Paragraph Type="Transition"\>

      \<Text\>CUT TO:\</Text\>

    \</Paragraph\>

  \</Content\>

\</FinalDraft\>

Type values: `"Scene Heading"`, `"Action"`, `"Character"`, `"Parenthetical"`, `"Dialogue"`, `"Transition"`, `"General"` (catch-all)

---

## Part 2: App Architecture

### Tech Stack

| Layer | Technology | Why |
| :---- | :---- | :---- |
| Frontend | React (Vite) | Component model maps cleanly to scene/pass structure |
| Styling | Tailwind CSS | Fast to build, easy to keep consistent |
| Auth | Firebase Auth (Google Sign-In) | Fastest path to real login, free tier |
| Database | Firebase Firestore | Real-time sync, persists across devices, free for personal scale |
| Export | Client-side XML generation | No backend needed for FDX; PDF via `jsPDF` or `print-to-PDF` |
| Hosting | Firebase Hosting | Free, one command deploy |

**Setup time estimate:** \~45 min to wire up Firebase project and deploy a shell. No backend server needed.

---

### Data Model (Firestore)

users/

  {userId}/

    projects/

      {projectId}/

        title: string

        createdAt: timestamp

        updatedAt: timestamp

        lastOpenedAt: timestamp

        scenes/

          {sceneId}/

            order: number          // for drag-to-reorder

            sceneHeader: string    // "INT. COFFEE SHOP — DAY"

            

            // Emotional Outline fields

            outline: {

              characters: string        // "Who are they, what do they insanely want"

              interaction: string       // "How they interact"

              actuallyGets: string      // "What they actually get at the end"

              scenTheyThinkTheyreIn: string

              momentOfRealization: string

              whatGetsThemThrough: string

              settingPlot: string

              whereCharacterEnds: string

              completedAt: timestamp | null

            }

            

            // Right-panel computed summary (generated from outline)

            outlineSummary: {

              characters: \[{ name, wants, got }\]

              whereWeAre: string

            }

            

            // Community Theater Pass (on-the-nose)

            communityTheater: {

              content: \[ScriptElement\]   // array of screenplay elements

              startedAt: timestamp | null

              completedAt: timestamp | null

            }

            

            // Liars Pass (subtext, behavior)

            liarsPass: {

              content: \[ScriptElement\]   // array of screenplay elements

              startedAt: timestamp | null

              completedAt: timestamp | null

            }

// ScriptElement type:

{

  id: string,

  type: "scene\_heading" | "action" | "character" | "parenthetical" | "dialogue" | "transition",

  text: string

}

---

### App Screens & States

#### Screen 1: Project Dashboard

- Header: App name \+ "New Project" button  
- Project cards in a grid showing: **title**, **date created**, **last opened**  
- Click to open project  
- Long-press or right-click to rename/delete

#### Screen 2: Project View (Scene Outline)

- Left sidebar: Draggable scene list (drag handle \+ scene number \+ slug line preview)  
- Main area: All scenes in order, each showing a scene card with:  
  - Scene header  
  - Completion status dots (3 dots \= emotional outline / community theater / liars pass)  
  - "Open" button  
- Top bar: Project title \+ Compile button

#### Screen 3: Scene — Emotional Outline Mode

**Layout: Two-column**

Left column (writing fields, 60% width):

1. Scene header input (auto-formats to ALL CAPS slug)  
2. **Characters & What They Want** — textarea: "Who are the characters and what is the big, insane thing they want?"  
3. **How They Interact** — textarea: "How do they interact?"  
4. **What They Actually Get** — textarea: "What do they actually get at the end?"  
5. **The Scene They Think They're In** — textarea  
6. **The Moment of Realization** — textarea: "What's the moment they realize they're not in that scene?"  
7. **What Gets Them Through** — textarea: "What do they need to get through the end of the scene?"  
8. **Setting / Plot** — textarea  
9. **Where Is the Character Now** — textarea: "Where does this leave the character?" (styled distinctly — this is the landing point)

Right column (auto-populated summary, 40% width):

- Appears once fields start filling in, updates in real-time  
- Shows: Character cards (name \+ what they want \+ what they got)  
- Shows: "Where this leaves us"  
- Read-only, styled as a clean summary card

**Bottom of left column:** Arrow-right button → appears when all 8 fields have content → advances to Community Theater mode

**Progress indicator (top of screen):** `● ○ ○` — three dots, first filled/highlighted with label "Emotional Outline" Dot 1: Emotional Outline | Dot 2: Community Theater | Dot 3: Liars Pass Each dot shows a tooltip on hover. Filled \= complete. Outline \= in progress. Empty \= not started.

---

#### Screen 4: Scene — Community Theater Mode

**Layout: Two-panel**

Left panel (always visible, \~35% width, non-editable):

- Emotional Outline reference — shows all 8 completed fields in a scrollable, styled panel  
- Label: "Your Outline" — subtle header  
- Toggle to collapse (`Cmd + \` or a small arrow)

Right panel (screenplay editor, \~65% width):

- Yellow/warm-tinted top banner: **"COMMUNITY THEATER PASS"** — clear UX signal this is the on-the-nose draft  
- Subtitle: *"Everyone says exactly what they mean. Make it obvious."*  
- Screenplay format editor (full formatting engine active — sluglines, action, dialogue, etc.)  
- All keyboard shortcuts active  
- Progress dots at top — dot 2 highlighted

**Bottom:** Arrow-right button → appears when scene has content → advances to Liars Pass

---

#### Screen 5: Scene — Liars Pass Mode

**Layout: Two-panel (same structure but wider)**

Left panel (always visible, \~35% width):

- Shows BOTH the Emotional Outline AND the Community Theater draft, stacked  
- Community Theater shows in a slightly muted/read-only screenplay format  
- Scrollable  
- Toggle to collapse

Right panel (screenplay editor, \~65% width):

- Cool/blue-tinted top banner: **"LIARS PASS"** — different visual register from CT  
- Subtitle: *"People behave like people. Nobody says what they mean."*  
- Clean screenplay format editor  
- Full formatting engine active

**Progress dots:** Dot 3 highlighted

---

#### Compile Flow

- Available from Project View once all scenes have a completed Liars Pass  
- "Compile Script" button opens a modal:  
  - Choose: `.fdx` (Final Draft) or `.pdf`  
  - Script title field  
  - Written by field  
  - Click "Export"  
- Generates file client-side, triggers download

---

### Scene State Machine

UNTOUCHED

  ↓ (user opens scene)

OUTLINE\_IN\_PROGRESS

  ↓ (all 8 fields complete → arrow appears)

OUTLINE\_COMPLETE

  ↓ (user clicks arrow)

COMMUNITY\_THEATER\_IN\_PROGRESS

  ↓ (user writes content → arrow appears)

COMMUNITY\_THEATER\_COMPLETE

  ↓ (user clicks arrow)

LIARS\_PASS\_IN\_PROGRESS

  ↓ (user writes content)

LIARS\_PASS\_COMPLETE

The three progress dots map exactly to these states. User can navigate backward freely (clicking dot 1 takes you back to outline in view-only mode while you're on dot 2 or 3).

---

### The Screenplay Editor Component

Core behaviors:

- Each line is a "block" — a `{id, type, text}` object  
- Blocks render differently based on type (margins, casing, alignment)  
- Tab key cycles through logical next element types  
- When user types a scene header field, text auto-uppercases  
- Character cue auto-uppercases  
- Parenthetical auto-wraps with `( )` if not already present  
- Double-Enter from dialogue creates new action block  
- Blocks are stored as array in Firestore, synced in real-time

Auto-save: every 30 seconds \+ on blur \+ on pass change

---

### FDX Export Logic

function exportToFDX(project) {

  const scenes \= project.scenes.sort((a,b) \=\> a.order \- b.order);

  

  let xmlContent \= \`\<?xml version="1.0" encoding="UTF-8"?\>

\<FinalDraft DocumentType="Script" Version="2"\>

  \<Content\>

    \<Paragraph Type="Transition"\>\<Text\>FADE IN:\</Text\>\</Paragraph\>\`;

  for (const scene of scenes) {

    const blocks \= scene.liarsPass.content; // compile from Liars Pass

    for (const block of blocks) {

      const fdType \= mapTypeToFD(block.type);

      xmlContent \+= \`

    \<Paragraph Type="${fdType}"\>\<Text\>${escapeXML(block.text)}\</Text\>\</Paragraph\>\`;

    }

  }

  

  xmlContent \+= \`

    \<Paragraph Type="Transition"\>\<Text\>FADE OUT.\</Text\>\</Paragraph\>

  \</Content\>

\</FinalDraft\>\`;

  return xmlContent;

}

function mapTypeToFD(type) {

  const map \= {

    scene\_heading: "Scene Heading",

    action: "Action",

    character: "Character",

    parenthetical: "Parenthetical",

    dialogue: "Dialogue",

    transition: "Transition"

  };

  return map\[type\] || "General";

}

---

## Part 3: Build Order (Suggested)

### Phase 1 — Shell & Auth (Day 1\)

1. Create Vite \+ React \+ Tailwind project  
2. Set up Firebase project (Auth \+ Firestore \+ Hosting)  
3. Wire up Google Sign-In  
4. Project dashboard: create/list/delete projects  
5. Deploy shell to Firebase Hosting

### Phase 2 — Emotional Outline (Day 2\)

1. Scene list with drag-to-reorder (use `@dnd-kit/core`)  
2. All 8 emotional outline fields  
3. Right-panel auto-summary (reactive, reads from fields)  
4. Progress dots component  
5. Arrow-right unlock behavior

### Phase 3 — Screenplay Editor (Day 3–4)

1. Block-based editor component  
2. All element types with correct formatting  
3. Tab/Enter keyboard navigation  
4. Auto-capitalization for scene headers and character cues  
5. Two-panel layout (outline reference \+ editor)

### Phase 4 — Three Passes \+ Visual Design (Day 5\)

1. Community Theater visual treatment (warm banner, label)  
2. Liars Pass visual treatment (cool banner, label)  
3. Left panel showing correct reference content per pass  
4. Pass navigation (dots \+ arrow buttons \+ keyboard shortcuts)  
5. Polish: transitions, auto-save indicator, responsive behavior

### Phase 5 — Export (Day 6\)

1. FDX generation function  
2. PDF export (print stylesheet or jsPDF)  
3. Compile modal  
4. Test FDX import in Final Draft

---

## Future Scope (Prioritized)

### P1 — Build alongside core

- **Character name consistency:** Auto-suggest character names already used in this project when typing in the Character cue field. Pull from all scenes in the project.  
- **Version history:** Firestore stores document history natively. Surface a "Restore previous version" option per scene — especially important before the Liars Pass when you might want to recover a CT draft.

### P2 — Next sprint after MVP

- **Scene notes:** Freeform notes field attached to each scene, outside the three passes. No formatting rules, just a scratch pad.  
- **Mobile capture view:** Not a full mobile editor — just a lightweight cell-friendly view that shows each scene with an open notes field. Capture ideas, lines, impulses on the go, attached to the right scene. Syncs via Firestore automatically. Think: open app → tap scene → dump thought → done.

### P3 — Later / nice to have

- **Multi-project collaborators:** Firestore supports it natively. Revisit after mobile is stable. Low priority since this process is personal.

