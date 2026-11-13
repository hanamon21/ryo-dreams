# RE:RISE Manager v1.5

GitHub Pages 用PWA。公開リポジトリにはゲストデータを含めません。

Google Sheets cloud sync:
1. Private Google Sheet `People`: columns `person_id, name, stage, updated_at, person_json, owner`.
2. Google Cloud Console: create OAuth client type **Web application**; authorized JS origin `https://hanamon21.github.io`; add the `https://www.googleapis.com/auth/spreadsheets` scope and allowed test accounts if necessary.
3. Configure OAuth client ID in app **設定** then click Google login > cloud pull.

Google Cloud authorization and Google Drive sharing are controlled by sheet owner. OAuth tokens are memory-only. No untrusted users can view data just by knowing the sheet ID.

If another device changes the same person, the app stops synchronization rather than silently overwriting the concurrent update.