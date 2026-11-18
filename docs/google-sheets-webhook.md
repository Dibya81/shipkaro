# Log /start form requests to Google Sheets (optional)

Every "Send on WhatsApp" submission always opens WhatsApp with the request filled in.
If you also want a copy of each request in a Google Sheet, set up this free Apps Script
webhook. The site posts to it first (waiting at most 4 seconds) and then opens WhatsApp.
If the webhook is down, WhatsApp still opens.

## 1. Create the sheet

1. Create a new Google Sheet, for example "ShipKaro leads".
2. In row 1, add these headers, in this order:

   | Submitted at | Service | Service slug | Price | Name | WhatsApp | College / company | Deadline | Description | Page |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 2. Add the script

1. In the sheet, open **Extensions → Apps Script**.
2. Delete what's there and paste this:

```js
// ShipKaro: append /start form submissions to this sheet.
const SHEET_NAME = ""; // leave empty to use the first sheet, or put a tab name

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];

    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      clean(data.service),
      clean(data.serviceSlug),
      clean(data.price),
      clean(data.name),
      clean(data.phone),
      clean(data.org),
      clean(data.deadline),
      clean(data.description),
      clean(data.page),
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Stops values that start with = + - @ from being run as spreadsheet formulas.
function clean(value) {
  const s = value == null ? "" : String(value).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
```

3. Click **Save**.

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, approve the permissions prompt, and copy the **Web app URL**
   (it ends in `/exec`).

## 4. Connect the site

Add the URL as an environment variable named `NEXT_PUBLIC_SHEETS_WEBHOOK`:

- **Locally:** create `.env.local` in the project root:

  ```
  NEXT_PUBLIC_SHEETS_WEBHOOK=https://script.google.com/macros/s/XXXXXXXX/exec
  ```

  Restart `npm run dev`.

- **On Vercel:** Project → **Settings → Environment Variables** → add
  `NEXT_PUBLIC_SHEETS_WEBHOOK` with the URL, then redeploy. The value is baked in
  at build time, so a redeploy is required after adding or changing it.

## 5. Test

Open `/start`, fill in the form and press **Send on WhatsApp**. A new row should appear in
the sheet within a few seconds.

## Notes

- The browser sends the data as `text/plain` with `mode: "no-cors"`, which is what lets
  it reach Apps Script without a CORS error. The site can't read the response, so it never
  waits on it beyond the 4 second timeout.
- If you edit the script later, use **Deploy → Manage deployments → Edit → New version**
  so the same `/exec` URL keeps working.
- The webhook URL is public (it's in the page's JavaScript). Anyone who finds it could add
  rows, which is why `clean()` neutralises formulas. Treat the sheet as an inbox, not a
  source of truth.
