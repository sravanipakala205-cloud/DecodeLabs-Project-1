# TaskFlow background push notifications

## Important
GitHub Pages only hosts the static website. Background reminders require this separate Node.js server to stay online. Browser/device support and power-saving settings can affect delivery; notifications are not guaranteed at an exact second.

## 1. Create VAPID keys
In this folder run:
```bash
npm install
npm run generate-vapid
```
Copy the public and private keys from the output. Keep the private key secret; never commit it to GitHub.

## 2. Deploy the push server
Deploy the `push-server` folder to a Node.js host that supports a persistent disk. Set the environment variables from `.env.example` in the host dashboard. Set `DATA_FILE` to a file path on that persistent disk. Use the generated VAPID keys and your own email in `VAPID_SUBJECT`. Keep the service running.

## 3. Connect GitHub Pages
After deployment, copy the server's HTTPS URL. Edit the root `config.js` file and set:
```js
window.TASKFLOW_API_URL = "https://YOUR-SERVER-URL";
```
Commit the change and wait for GitHub Pages to publish it.

## 4. Enable each device
On Windows Chrome/Edge, open the website, allow notifications, then click **Enable Background Reminders**. On Android, open the same HTTPS site in Chrome, allow notifications, optionally use Chrome's **Add to Home screen / Install app**, open the installed TaskFlow, and enable notifications there too. Each browser/device must subscribe separately.

## 5. How reminders work
The server checks every minute and sends one push notification per task/device around 15 minutes before its deadline. A task needs a deadline and must be synced from that device. To receive on both devices, enable notifications on both and add/sync the tasks on both devices. Current task data remains in each device's local storage; this starter does not provide cross-device task synchronization.

## Security and reliability
Do not publish VAPID private keys. Restrict `ALLOWED_ORIGIN` to your GitHub Pages origin. For a public production app, add user authentication, per-user data isolation, rate limiting, and a managed database. Free hosting may sleep or restart, and ephemeral storage loses subscriptions/tasks; use an always-on service and persistent storage for dependable delivery.
