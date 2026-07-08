# MVP_REQUIREMENTS.md

# Project Emergence MVP Requirements

## 1. Executive Summary

Project Emergence is a genealogy-centered writing system. Its MVP must test whether treating writing as the evolution of sealed thoughts changes the writer's experience compared with document-centered editing.

The MVP is not a general writing app, markdown editor, document processor, collaboration tool, or productivity dashboard. Its minimum purpose is to let a writer form an editable Expression, Seal it into an immutable Emergence, create Descendants instead of editing sealed thoughts, inspect the resulting Genealogy and Lineage, and Publish one node as a projection without ending evolution.

The source of truth is not a document. The source of truth is the Genealogy: permanent nodes with explicit identity, ancestry, state, chronological time, and genealogical relationships. Documents, publications, exports, views, and collections are projections or references, not owners of thought.

The MVP validates or falsifies the core philosophy by making these behaviors real:

- A thought can be expressed without premature structure.
- Seal creates permanence and stops editing.
- Later refinement happens through Descendant creation, not overwriting.
- The writer can always understand where a thought came from, where it exists, and what may grow from it.
- Publication exposes one node without closing its Lineage.

Everything outside this loop is excluded unless required to preserve trust, ancestry, immutability, privacy, or the quiet visual experience defined by the Constitution.

## 2. Constitutional Mapping

### FOUNDATION.md

Engineering consequences:

- The primary product object is an evolving thought, not a document.
- Sealed thoughts must be immutable and permanently accessible.
- Meaningful future changes must create lineage through Descendants.
- History must be part of the work, not hidden metadata.
- Multiple Descendants may coexist without forcing a canonical version.
- Publication must not terminate evolution.
- The writer controls when to Seal, Descend, Reflect, or Publish.
- Implementation choices must remain replaceable.
- Expression is transient; Emergence begins only through Seal.

### LEXICON.md

Implementation responsibilities:

- Use constitutional language in user-facing UI: Expression, Emergence, Descendant, Seal, Reflection, Published, Genealogy, Lineage.
- Treat Expression as editable, temporary, and without permanent identity.
- Treat Emergence as a sealed Expression with permanent identity.
- Treat Descendant as a new thought that acknowledges a previous one.
- Treat Seal as recognition, not save.
- Treat Published as a public projection of a node.
- Treat Branch as internal/visual language only; expose Descendant as the conceptual primitive.
- Treat Document as an output, never source of truth.

### EXPERIENCE.md

Experience responsibilities:

- The first screen must minimize friction and open into writing.
- Expression must be fully editable before history begins.
- Seal must transform Expression into Emergence and begin history.
- Descendant creation must replace editing of sealed thoughts.
- Reflection must support deliberate reading and relationship awareness.
- Publication must select one visible expression without closing the Genealogy.
- The interface must reveal ancestry without overwhelming the writer.

### DESIGN_LANGUAGE.md

Visual responsibilities:

- Visual design must reveal thought structure, not decorate it.
- Thought has priority over Lineage, state, controls, and decoration.
- Circle represents Emergence/origin.
- Line represents Lineage/ancestry.
- Triangle represents intentional divergence.
- Square represents system/container only, never thought itself.
- Negative space is active and must remain visible.
- Motion must communicate state change with restraint.
- Color must reinforce structural roles and remain understandable in monochrome.
- Palette, composition, typography, grid, and anti-pattern constraints must follow `VISUAL_SYSTEM.md`.

### VISUAL_SYSTEM.md

Visual system responsibilities:

- Use the Psicoandino base palette as implementation tokens: `--cobre`, `--musgo`, `--mostaza`, `--sangre`, `--hueso`, `--oled`, `--amatista`.
- Treat colors as frequencies, not fixed hierarchy.
- Use one dominant color, one secondary color, and one accent color per composed surface.
- Keep negative space active.
- Use circle, triangle, line, square, and negative space according to structural meaning.
- Use a 12-column digital grid and 4 or 8 point spacing units.
- Use geometric or humanist sans-serif typography compatible with Inter, Space Grotesk, IBM Plex Sans, or Satoshi.
- Avoid decoration without structural function, purposeless gradients, mixed visual styles, and saturation without hierarchy.

### INTERFACE.md

Interaction consequences:

- The workspace revolves around the current thought.
- No permanent tool sidebars, inspector panels, folders, project setup, or dashboard overload.
- The user should always know origin, current position, and possible continuation.
- Actions appear only when relevant.
- Genealogy is contextual and intentionally opened.
- Seal has no confirmation dialog and no celebratory feedback.
- Navigation follows ancestry: Ancestor, Descendant, Sibling, Lineage, Publication.
- Mobile favors capture; desktop favors synthesis, Reflection, publishing, and larger genealogies.

### ARCHITECTURE.md

Data consequences:

- Genealogy is the permanent source of truth.
- Expression is transient and never belongs to Genealogy.
- Sealed nodes are immutable in content, identity, and ancestry.
- Every node has explicit parent, descendants, Lineage, root Emergence, identity, and creation moment.
- Publication creates a projection without copying source data or altering Genealogy.
- Chronological time and genealogical time must both be preserved.
- Normal deletion of nodes is out of scope.
- Offline capture must work.
- Synchronization assumptions must preserve identity; conflicts create Descendants, never overwrites.
- Export creates representations, never migrations or source truth.

## 3. Core User Journey

The smallest complete MVP journey is:

1. Open the application.
2. Begin typing into an empty Expression.
3. Seal the Expression into an immutable Emergence.
4. Return to the sealed Emergence.
5. Create a Descendant instead of editing the Emergence.
6. Seal the Descendant.
7. View the Genealogy enough to see ancestry and Lineage.
8. Enter Reflection to read the relationship between nodes.
9. Publish one node.
10. Create another Descendant from a Published node, proving Publication does not close evolution.

No onboarding, folder setup, formatting setup, project creation, team setup, or dashboard is part of the MVP journey.

## 4. Core Objects

### Expression

Purpose:

- Temporary editable manifestation of a thought before history begins.

Required properties:

- Local draft content.
- Creation timestamp for recovery only.
- Current editing state.
- Optional source node when forming a Descendant.

Relationships:

- Has no permanent identity.
- Is not part of Genealogy.
- May be derived from a parent node when creating a Descendant.

Lifecycle:

- Created when the writer starts typing.
- Editable until Seal.
- Ceases to exist as Expression when Sealed.
- May be discarded only before Seal.

Constitutional origin:

- FOUNDATION, LEXICON, EXPERIENCE, INTERFACE, ARCHITECTURE.

### Emergence

Purpose:

- First permanent manifestation of a thought and root of future Descendants.

Required properties:

- Permanent node id.
- Immutable content.
- Created/sealed timestamp.
- State: Emergence, Reflection, Published when applicable.
- Parent: null.
- Root Emergence id: self.
- Descendant ids.
- Publication projection ids if Published.

Relationships:

- Root of a Genealogy.
- May have many Descendants.
- May be Published.
- May be part of many Lineages.

Lifecycle:

- Created only by Seal from an Expression.
- Never edited after Seal.
- May generate Descendants indefinitely.
- May be Published without ending evolution.

Constitutional origin:

- FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE.

### Descendant

Purpose:

- New sealed thought that acknowledges ancestry while allowing evolution.

Required properties:

- Permanent node id.
- Immutable content after Seal.
- Parent node id.
- Root Emergence id.
- Explicit ancestor path or stored Lineage references.
- Created/sealed timestamp.
- State: Emergence-derived node, Reflection, Published when applicable.
- Descendant ids.
- Publication projection ids if Published.

Relationships:

- Belongs to one Genealogy.
- Has exactly one parent in the MVP.
- May have many Descendants.
- May have siblings through shared parent.

Lifecycle:

- Begins as an editable Expression opened from an existing node.
- Becomes a permanent Descendant only through Seal.
- Never replaces parent or sibling.
- May continue the Lineage indefinitely.

Constitutional origin:

- FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE.

### Genealogy

Purpose:

- Complete ancestry of an Emergence and all Descendants.

Required properties:

- Root Emergence id.
- Node ids.
- Parent-child edges.
- Chronological creation order.
- Current selected node.

Relationships:

- Owns no content separately from nodes.
- Is the permanent source of truth.
- Contains one root Emergence and all Descendants.

Lifecycle:

- Created when an Emergence is sealed.
- Expands when Descendants are sealed.
- Never closes.

Constitutional origin:

- FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE.

### Lineage

Purpose:

- Continuous path through a Genealogy.

Required properties:

- Ordered node ids from root to selected node.
- Current node id.
- Sibling branch references where useful for navigation.

Relationships:

- Derived from explicit stored ancestry.
- Multiple Lineages may coexist inside one Genealogy.

Lifecycle:

- Exists when a node has ancestry.
- Updates by adding Descendants, not rewriting existing paths.

Constitutional origin:

- FOUNDATION, LEXICON, INTERFACE, ARCHITECTURE.

### Reflection

Purpose:

- Reading-with-intention mode/state where relationships and patterns become visible without emphasizing production.

Required properties:

- Node id.
- Reflection state flag or mode flag.
- Visible ancestry context.
- Reduced editing affordances.

Relationships:

- Applies to existing sealed nodes.
- Does not alter identity, content, or ancestry.

Lifecycle:

- Entered intentionally from a sealed node or Genealogy.
- Exited back to current thought or Genealogy.
- May coexist with future Descendant creation.

Constitutional origin:

- LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE.

### Publication

Purpose:

- Public projection of one node.

Required properties:

- Publication id.
- Source node id.
- Published timestamp.
- Visibility state.
- Read-only rendered content.

Relationships:

- References exactly one existing node.
- Does not copy source content as new truth.
- Does not alter Genealogy.

Lifecycle:

- Created intentionally from a sealed node.
- Makes one moment visible.
- Does not prevent later Descendants.

Constitutional origin:

- FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE.

## 5. Screens

### 1. Thought Workspace

Purpose:

- Primary surface for Expression, sealed node reading, Seal, Descendant creation, Reflection entry, and Publication.

Visible information:

- Current Expression or sealed node content.
- Minimal ancestry context.
- Current state.
- Relevant actions only.

Allowed actions:

- Type while in Expression.
- Seal Expression.
- Create Descendant from sealed node.
- Enter Reflection.
- Publish sealed node.
- Open Genealogy.
- Navigate to immediate Ancestor, Descendant, or Sibling when available.

Why it exists constitutionally:

- The interface revolves around the current thought and must remain quieter than thought itself.

### 2. Genealogy View

Purpose:

- Intentional exploration of ancestry and divergence.

Visible information:

- Root Emergence.
- Current Lineage.
- Immediate parent, selected node, Descendants, and siblings.
- Minimal tree context, not the entire infinite Genealogy by default.

Allowed actions:

- Select node.
- Navigate Ancestor, Descendant, Sibling, Lineage.
- Return to Thought Workspace.
- Start Descendant from selected node.

Why it exists constitutionally:

- Genealogy is the primary structure, but should appear only when intentionally explored.

### 3. Publication View

Purpose:

- Read-only public projection of one node.

Visible information:

- Published content.
- Published state.
- Quiet indication that it belongs to an ongoing Genealogy.

Allowed actions:

- Read.
- Return to source node if author.
- Create Descendant from source node if author.

Why it exists constitutionally:

- Publication is projection and never terminates evolution.

The MVP should not include dashboards, folder browsers, settings-heavy screens, team spaces, analytics screens, notification centers, or formatting panels.

## 6. Interaction Model

### Writing

- The app opens into emptiness.
- The first written character creates an editable Expression.
- No title, metadata, folder, collection, or formatting is required before writing.
- The writer can edit Expression freely because it has not entered history.

### Sealing

- Seal is available only when an Expression has content.
- Seal transforms Expression into Emergence or Descendant.
- After Seal, the cursor disappears and editing stops.
- No confirmation dialog appears.
- The interface communicates permanence through state change and restraint.

### Branching

- User-facing language is Create Descendant or Descend, not Branch.
- Descendant creation starts a new Expression from a sealed parent.
- The parent remains accessible and unchanged.
- Siblings can coexist indefinitely.

### Reading

- Sealed nodes are read-only.
- Reflection privileges observation over production.
- Reading shows enough ancestry to answer where the thought came from and where it currently exists.

### Publishing

- Publish is available only for sealed nodes.
- Publishing creates a Publication projection.
- Publishing does not duplicate source truth.
- Published nodes remain able to generate Descendants.

### Navigation

- Default navigation follows ancestry, not folders.
- Required directions: Ancestor, Descendant, Sibling, Lineage, Publication.
- Chronological order may support orientation but must not replace Genealogy.

## 7. Visual Requirements

### Hierarchy

- Thought is visually dominant.
- Lineage is secondary.
- State is tertiary.
- Controls are quiet and contextual.
- Decoration is absent unless it reveals structure.

### Spacing

- Default density is low.
- The writing surface must breathe.
- The interface must not fill available space merely because space exists.
- Genealogy context must be sparse enough to preserve focus.

### Motion

- Motion communicates state change only.
- Seal motion must feel like recognition and permanence, not saving.
- Descendant motion must communicate continuation from an ancestor.
- Publication motion must be calm and non-celebratory.
- No reward animations, confetti, urgency, or gamification.

### Negative Space

- Whitespace is an active part of the interface.
- Empty space represents possibility and silence.
- The MVP must preserve visible quiet around the current thought.

### Typography

- Body text must prioritize clarity and disappear into reading.
- Titles may establish identity but must not dominate thought content.
- Typography must not imitate a productivity dashboard or code editor.

### Color Usage

- Color expresses structural role only.
- Meaning must remain understandable in monochrome.
- The MVP must implement the Psicoandino base palette exactly as design tokens:
  - `--cobre: #248692`
  - `--musgo: #6D7C50`
  - `--mostaza: #B78627`
  - `--sangre: #C73A4A`
  - `--hueso: #F5F3EC`
  - `--oled: #000000`
  - `--amatista: #7D5AA1`
- Colors must be applied as frequencies, not a fixed hierarchy.
- Each composed screen or major surface may use one dominant color, one secondary color, and one accent color.
- The default MVP surface should privilege `--hueso` for silence/space and `--oled` for structure/text unless a specific state requires another frequency.
- `--amatista` represents intentional negative space and must not be used as a solid filled thought form.
- Color may reinforce origin, lineage, divergence, container, state, and publication, but structure and text must still carry meaning.

### Geometry

- Circle represents Emergence/origin.
- Line represents Lineage/ancestry.
- Triangle represents meaningful divergence.
- Square represents containers or system organization.
- Geometry must never be decorative only.

### Grid and Composition

- Digital layouts must use a 12-column grid.
- Spacing must use 4 or 8 point units.
- Alignment must be strict on primary axes.
- Visual rupture is allowed only when it expresses a conceptual decision.
- Each screen must express one dominant structural idea.

### Typography System

- Use a geometric or humanist sans-serif family.
- Compatible families are Inter, Space Grotesk, IBM Plex Sans, and Satoshi.
- High contrast may appear in titles only.
- Body text must remain clear and quiet.
- Letter spacing may be broader in identity moments, but not as decoration inside reading surfaces.

## 8. Architectural Requirements

### Identity

- Every sealed node must receive a permanent id at Seal.
- Identity must not depend on title, content, location, state, or publication.
- Expression must not receive permanent identity.

### Immutability

- Sealed node content, identity, and ancestry must be immutable.
- Attempts to alter sealed content must be impossible through normal UI.
- Refinement must create Descendants.

### Genealogy

- Store parent-child edges explicitly.
- Store root Emergence id explicitly.
- Store descendant references or derive them only from stored edges.
- The system must never infer ancestry from timestamps, file paths, titles, or content similarity.

### Storage

- The durable store contains sealed nodes, edges, state, and publication projections.
- Expression storage may exist only for local recovery and must not become source of truth.
- Documents, exports, and publications must reference nodes rather than owning thought.

### Synchronization Assumptions

- MVP may be local-first with no multi-device sync implementation.
- If sync is later added, identity must be preserved.
- Sync conflicts must become Descendants, never silent overwrites.
- The MVP data model must not prevent this future invariant.

### Offline Behavior

- Writing an Expression and Sealing into an Emergence must work offline.
- Creating and Sealing Descendants must work offline.
- Publishing may require connectivity, but failure must not affect Genealogy.

### Export

- General export is out of scope for MVP.
- If any export exists, it must be a projection from sealed nodes and must never become source of truth.
- Publication is the only required projection.

### Search

- Search is out of scope for the first MVP unless needed for manual test data.
- The data model must allow later search by ideas, relationships, Lineages, states, authors, and publications.
- No filename/folder-centered search should be introduced.

### State Transitions

Required MVP transitions:

- No object -> Expression.
- Expression -> Emergence through Seal.
- Sealed node -> Expression for Descendant.
- Descendant Expression -> Descendant through Seal.
- Sealed node -> Reflection state/mode.
- Sealed node -> Published projection.
- Published node -> Expression for new Descendant.

Forbidden transitions:

- Emergence -> editable Emergence.
- Descendant -> editable Descendant.
- Published -> closed/completed Genealogy.
- Export -> source of truth.
- Sync conflict -> overwrite.

## 9. Non-Functional Requirements

### Performance

- Opening the app to an empty Expression must be immediate enough to support capture before refinement.
- Thought Workspace should render without loading full Genealogy.
- Genealogy View should render contextual portions, not infinite trees.

### Accessibility

- Meaning must not depend exclusively on color, motion, or icons.
- State and ancestry must be readable through text and structure.
- Sealed/read-only state must be perceivable without animation.

### Responsiveness

- Mobile must prioritize fast Expression capture.
- Desktop must support Reflection, comparison, Publication, and larger Genealogy exploration.
- The MVP must not treat mobile as a reduced copy of desktop.

### Privacy

- Private thought is default.
- Publication must be intentional.
- No node becomes public through Seal, Descendant creation, Reflection, navigation, or export.

### Reliability

- Nothing meaningful should disappear through normal interaction.
- Sealed nodes must survive app restart.
- Failed Publication must not modify source node or Genealogy.

### Trust

- The writer must be able to verify that sealed content cannot be edited.
- The writer must be able to see ancestry for any selected sealed node.
- The writer must be able to continue from a Published node.

### Simplicity

- No feature may appear unless it supports Expression, Seal, Descendant, Reflection, Genealogy, Lineage, Publication, privacy, or trust.
- Controls appear only when relevant.

## 10. Explicitly Out of Scope

The MVP excludes:

- Real-time collaboration.
- AI writing or AI suggestions.
- Rich text editing.
- Complex formatting.
- Markdown feature completeness.
- Teams.
- Notifications.
- Analytics.
- Comments.
- Plugins.
- Folder/project organization.
- Permanent sidebars.
- Inspector panels.
- Dashboard home screens.
- Gamification.
- Social feeds.
- Full document assembly.
- Collections.
- Import.
- General export beyond Publication.
- Semantic search UI.
- Full-text search unless required for debugging.
- Deletion of sealed nodes through normal UI.
- Multi-author identity.
- Multi-device synchronization implementation.
- Conflict resolution UI.
- Maturity/Tested/Matured stage implementation.
- Cross-genealogy references.
- Voice, handwriting, or visual thought input.

## 11. Acceptance Criteria

1. On first launch, the user can begin typing without creating a project, folder, title, metadata, or account.
2. Typing creates an Expression that is editable before Seal.
3. Seal transforms the Expression into an Emergence with a permanent id.
4. After Seal, the Emergence content cannot be edited through the UI.
5. The sealed Emergence remains accessible after app restart.
6. From a sealed Emergence, the user can create a Descendant Expression.
7. Sealing the Descendant creates a new immutable node with explicit parent id and root Emergence id.
8. The parent Emergence remains unchanged after the Descendant is created.
9. The user can create at least two sibling Descendants from the same parent.
10. The user can view a Genealogy showing root, selected node, parent, siblings, and Descendants.
11. The user can navigate by Ancestor, Descendant, Sibling, and Lineage.
12. Reflection mode can be entered for a sealed node and reduces editing affordances to zero.
13. Publishing a sealed node creates a read-only Publication projection.
14. Publishing does not alter node content, identity, ancestry, or Descendant availability.
15. The user can create a Descendant from a Published node's source.
16. Color is not the only carrier of state or ancestry.
17. The app remains usable in monochrome.
18. No normal UI action physically deletes a sealed node.
19. No UI uses Save, Commit, Submit, Branch, or Edit as the primary label for constitutional actions.
20. The implemented MVP contains no collaboration, AI writing, rich text formatting, notifications, analytics, comments, plugins, or team features.

## 12. Constitution Compliance Matrix

| Feature | Supporting Constitutional Documents | Implementation Evidence |
| --- | --- | --- |
| Expression | FOUNDATION, LEXICON, EXPERIENCE, INTERFACE, ARCHITECTURE | Editable transient object before history begins |
| Seal | FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Converts Expression into immutable permanent node |
| Emergence | FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Root sealed node with permanent identity |
| Descendant | FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | New sealed node with explicit parent and ancestry |
| Immutability | FOUNDATION, LEXICON, EXPERIENCE, INTERFACE, ARCHITECTURE | Sealed content, identity, and ancestry cannot change |
| Genealogy | FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Permanent source of truth with explicit edges |
| Lineage | FOUNDATION, LEXICON, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Navigable path from root to current node |
| Reflection | LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Reading-focused state/mode with reduced editing affordances |
| Published | FOUNDATION, LEXICON, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Public projection of one sealed node |
| Publication afterlife | FOUNDATION, LEXICON, EXPERIENCE, INTERFACE, ARCHITECTURE | Published source can still generate Descendants |
| Contextual Genealogy View | FOUNDATION, EXPERIENCE, DESIGN_LANGUAGE, INTERFACE, ARCHITECTURE | Shows relevant ancestry without default overload |
| Ancestry navigation | FOUNDATION, INTERFACE, ARCHITECTURE | Ancestor, Descendant, Sibling, Lineage, Publication routes |
| Offline capture | INTERFACE, ARCHITECTURE | Expression and Seal work without connectivity |
| Privacy by default | ARCHITECTURE | Seal does not publish; Publication is explicit |
| Quiet interface | EXPERIENCE, DESIGN_LANGUAGE, INTERFACE | Low density, contextual controls, negative space |
| Geometry | DESIGN_LANGUAGE | Circle, line, triangle, square mapped to structural meaning |
| Color system | DESIGN_LANGUAGE, INTERFACE, VISUAL_SYSTEM | Psicoandino tokens implemented; monochrome comprehension required |
| Grid and spacing | DESIGN_LANGUAGE, VISUAL_SYSTEM | 12-column grid with 4/8 point units |
| Typography system | DESIGN_LANGUAGE, VISUAL_SYSTEM | Geometric/humanist sans-serif with quiet body text |
| No document source of truth | FOUNDATION, LEXICON, ARCHITECTURE | Documents/export excluded from primary model |
| No forced convergence | FOUNDATION, EXPERIENCE, ARCHITECTURE | Multiple sibling Descendants can coexist |
| Technology independence | FOUNDATION, ARCHITECTURE | Requirements define invariants, not framework choices |

## Compiler Notes

The previous blocking contradiction around pre-Seal editability is resolved by the current Constitution through `Expression`.

The maturity stage named `Tested` in `LEXICON.md` and `Matured` in `DESIGN_LANGUAGE.md` is excluded from the MVP because the stage is not necessary to validate the minimum genealogy-centered writing loop. This avoids selecting a user-visible term while the Constitution marks the name as working.

`VISUAL_SYSTEM.md` is now available and has been incorporated as the source for palette tokens, composition rules, typography constraints, grid units, and visual anti-patterns.
