# Spotify setup (reference — do this again only if the token stops working)

The "On repeat" widget on `/taste/` needs a one-time authorization so the
site can ask Spotify for your top tracks on your behalf. This does **not**
expire on a schedule, but if you ever revoke the app's access in your Spotify
account, or Spotify invalidates it, redo these steps.

1. **developer.spotify.com/dashboard** → log in → **Create app**.
   - Redirect URI: `http://127.0.0.1:8888/callback` (a placeholder — nothing
     needs to run there; you'll just read the code out of the address bar).
   - APIs used: Web API.
2. Open the app → copy the **Client ID** and **Client Secret**.
3. Build this URL with your own Client ID and open it in a browser, logged
   into the Spotify account whose top tracks you want:

   ```
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A8888%2Fcallback&scope=user-top-read
   ```

4. Click **Allow**. The browser will fail to load `127.0.0.1:8888` —
   that's expected. Copy the `code=...` value out of the address bar.
5. Exchange it for a refresh token (this code is single-use and expires in
   minutes, so do this right after step 4):

   ```powershell
   $code = "PASTE_THE_CODE_HERE"
   $clientId = "YOUR_CLIENT_ID"
   $clientSecret = "YOUR_CLIENT_SECRET"
   $basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("$clientId`:$clientSecret"))
   Invoke-RestMethod -Uri "https://accounts.spotify.com/api/token" -Method Post `
     -Headers @{ Authorization = "Basic $basic" } `
     -Body @{ grant_type = "authorization_code"; code = $code; redirect_uri = "http://127.0.0.1:8888/callback" } `
     -ContentType "application/x-www-form-urlencoded"
   ```

   The response's `refresh_token` field is what you need next.

6. In **Netlify → Site configuration → Environment variables**, add three
   secrets scoped to Functions: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
   `SPOTIFY_REFRESH_TOKEN`. Never put these in the repo.
7. Redeploy (or trigger a new deploy) so the function picks up the new
   environment variables.
