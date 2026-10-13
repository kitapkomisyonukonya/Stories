# Stories — Interactive Language and Values Library

Stories is an English/Arabic A2, B1 and B2 interactive educational library for classroom and self-study use. It includes narration, visuals, Word Notes, exercises, Teacher Guides and Self-Study Guides.

## Content rule

Story prose, chapter identity/order, approved quotations/references, narration and timing data are protected source material. Exercises and guides never authorize a silent story rewrite.

The single pedagogical authoring rulebook is:

`docs/MANUAL_CONTENT_AUTHORING_STANDARD.md`

Its core principle is simple:

**Structure by code. Learning content by hand.**

Questions, answers, distractors, vocabulary selections, Teacher Guide prose and Self-Study Guide prose are written manually after reading the relevant story and chapter. Shared code may render and organize that content, but it must not generate or rewrite it.

## Target content architecture

Each book/level should have one obvious manually authored source for:

- story pages
- exercises and assessments
- Teacher Guide
- Self-Study Guide
- metadata

Approved material is locked and changed only by an intentional manual edit.

Legacy Blueprint/Gold runtime layers have been removed. Approved learning content now lives in direct authored book files and passes only through the shared active learning/finalization layer. Do not reintroduce Gold, Blueprint, pedagogy-generator or parallel quality-contract layers.

## Commands

```bash
npm ci
npm run dev
npm run validate
npm run build
```

`npm run validate` is a technical check only. Pedagogical quality is reviewed manually.

## Repository

- `src/` — application and book data
- `public/` — static assets required by the app
- `scripts/validation/` — technical build/media diagnostics only
- `docs/MANUAL_CONTENT_AUTHORING_STANDARD.md` — single pedagogical authoring standard
- `docs/GUIDE_VISUAL_STANDARD.md` — guide UI/PDF visual rules
- `deploy/` — Cloud Run runtime server
- `Dockerfile` and `cloudbuild.preview.yaml` — preview deployment

## Adding or revising a book

1. Add or preserve the approved EN/AR story source without silently rewriting it.
2. Read the complete story and each chapter manually.
3. Manually author Quick Challenges, whole-book assessments and vocabulary support according to `MANUAL_CONTENT_AUTHORING_STANDARD.md`.
4. Manually author every Teacher Guide and Self-Study Guide chapter.
5. Register the book and media paths.
6. Review English and Arabic independently against their own story source.
7. Test the interactions in the UI.
8. Run `npm run validate` and `npm run build` for technical integrity.
9. Human-review and lock the finished book.

## Book PDFs

Each book has five PDFs per level and language (`src/lib/bookPdfs.ts`). They are not in this repository: they live in the Cloudflare R2 bucket `from-language-to-culture` under `books/<name>.pdf`, and the server answers `/pdfs/books/<name>.pdf` with a redirect to `PDF_BASE_URL` (set by `_PDF_BASE_URL` in both Cloud Build files). After the PDFs are rebuilt into `public/pdfs/books/` (ignored by git), `bash scripts/r2/upload-pdfs.sh` uploads them. The short usage-guide PDFs (`public/pdfs/guides/`) stay in the app. The About page's media kit (brand guide, visual style guide, logo ZIP) lives in the same bucket under `media-kit/` and is served the same way from `/pdfs/media-kit/<name>`. Its sources are in the project's shared folder (`medya-paketi/`); after a rebuild, upload the files under the same names with the Cloudflare R2 API.

## Preview deployment

The `preview` branch is connected to Cloud Build through `cloudbuild.preview.yaml`. Preview deployment builds the application and deploys it to the `stories-preview` Cloud Run service.
