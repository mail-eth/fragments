// api/webhook.js - Vercel serverless function untuk handle Farcaster events

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the incoming webhook for debugging
    console.log('Farcaster webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Handle different event types
    const { event } = req.body;

    switch (event) {
      case 'miniapp_added':
        // User added your miniapp
        console.log('Miniapp added:', req.body);
        // Save notification token if provided
        if (req.body.notificationDetails) {
          // TODO: Save to database
          console.log('Notification token:', req.body.notificationDetails.token);
        }
        break;

      case 'miniapp_removed':
        // User removed your miniapp
        console.log('Miniapp removed:', req.body);
        // TODO: Remove notification token from database
        break;

      case 'notifications_enabled':
        // User enabled notifications
        console.log('Notifications enabled:', req.body);
        // TODO: Update notification settings
        break;

      case 'notifications_disabled':
        // User disabled notifications
        console.log('Notifications disabled:', req.body);
        // TODO: Update notification settings
        break;

      default:
        console.log('Unknown event type:', event);
    }

    // Always respond with 200 OK
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}