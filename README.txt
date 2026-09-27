ABES-EC Wi-Fi Auto Login v2

INSTALL
1. Extract this ZIP.
2. Open Chrome -> chrome://extensions/
3. Enable Developer mode.
4. Click "Load unpacked".
5. Select the ABES-WiFi-AutoLogin-v2 folder.
6. Connect to ABES-EC Wi-Fi.
7. The portal should fill and submit automatically.

CHANGES IN V2
- Specifically detects the "Sign in" control shown on the portal.
- Tries button/input submit controls.
- Uses a native DOM click first.
- Uses mouse-event fallback.
- If no button is found, submits the surrounding form.
- Waits for dynamically-created portal elements.
- Retries during the first few seconds.

IMPORTANT
- Keep config.js private because it contains the credentials.
- If you edit config.js, click Reload on chrome://extensions/.
- This extension is intended for the specified local ABES portal.
