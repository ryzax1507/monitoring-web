/**
 * Sends a real-time notification to Discord when a server's status changes.
 * 
 * @param name - The friendly name of the monitor
 * @param url - The URL being monitored
 * @param newStatus - The new status of the monitor ('UP' or 'DOWN')
 */
export async function sendDiscordNotification(name: string, url: string, newStatus: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set in environment variables. Notification skipped.');
    return;
  }

  const isUp = newStatus === 'UP';
  const color = isUp ? 3066993 : 15158332; // Green (Decimal 3066993) or Red (Decimal 15158332)
  const emoji = isUp ? '🟢' : '🔴';
  
  const payload = {
    embeds: [
      {
        title: `${emoji} Server Status Transition Alert`,
        description: `Status for monitor **${name}** changed to **${newStatus}**.`,
        color,
        fields: [
          { name: 'Server Name', value: name, inline: true },
          { name: 'URL', value: url, inline: true },
          { name: 'New Status', value: newStatus, inline: true },
          { name: 'Change Time', value: new Date().toLocaleString(), inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Discord Webhook request failed with status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to dispatch Discord Webhook notification:', error);
  }
}
