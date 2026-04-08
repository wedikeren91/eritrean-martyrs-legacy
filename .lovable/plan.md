
Goal

Make bulk profile import reliable for large Excel/CSV files so it completes in one run, reports exactly what happened, and does not require repeated retrying.

What I found

- The admin profile import UI already batches rows, but the backend function still processes rows one-by-one and often does separate read/write calls per row. That is the main scalability bottleneck.
- The current result modal only shows the first 8 issues, so most failures stay hidden.
- Retrying the same file is not safe for rows without `id`; duplicates already exist in `martyr_profiles`.
- The admin list currently hard-limits profile fetching to 300 rows, which will become misleading once bulk import is fixed.

Plan

1. Rebuild the backend importer as a true bulk pipeline
- Refactor `supabase/functions/import-martyr-profiles/index.ts`.
- Keep validation and normalization on the backend, but switch from row-by-row writes to chunked bulk writes.
- For each chunk, do one lookup for existing IDs, then one bulk insert/upsert instead of dozens of individual queries.
- This is the key change that should eliminate the “only 5–8 records import” behavior.

2. Make the import process durable and transparent
- Reuse `bulk_uploads` for admin imports too, instead of treating the import as a one-shot invisible request.
- Extend it to track `processed`, `added`, `updated`, `skipped`, and full error details.
- Update the import modal to show real progress and a complete final report rather than only a short summary.

3. Make retries safe
- Add a secondary exact-match check for rows that do not include `id`, so re-uploading the same sheet does not blindly create duplicate profiles.
- If a row is ambiguous, skip it with a clear reason instead of inserting a likely duplicate.

4. Unify the import rules across the app
- Centralize header aliasing, date parsing, affiliation/status normalization, and name fallback logic.
- Apply the same rules to both:
  - `src/components/MartyrBatchActions.tsx`
  - `src/components/BulkUpload.tsx`
- Keep `first_name` required and allow blank `last_name` to become `Unknown`.

5. Fix the verification experience after import
- Update `src/pages/Admin.tsx` so the profile list no longer masks successful imports behind `.limit(300)`.
- Add a clear total count / refresh path so you can immediately confirm the full import landed.

Validation

- Add backend tests for:
  - large imports (200+ rows)
  - missing `last_name`
  - Excel serial dates and fuzzy date values
  - mixed insert/update files
  - safe reruns of the same file
- Then verify one full end-to-end admin import and confirm the UI totals match the database totals.

Technical details

- Main files to change:
  - `supabase/functions/import-martyr-profiles/index.ts`
  - `src/components/MartyrBatchActions.tsx`
  - `src/components/BulkUpload.tsx`
  - `src/pages/Admin.tsx`
  - a migration to extend `bulk_uploads` and add any needed support indexes
- I will keep the current security model: only authenticated admins/founders can direct-import profiles, with backend-side role checks and no client-side trust.

Expected outcome

- large spreadsheet imports complete reliably instead of stalling after a few rows
- failures become visible and actionable
- retries stop creating accidental duplicates
- you get one stable bulk import path instead of repeated back-and-forth fixes
