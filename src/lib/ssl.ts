import tls from 'tls';

/**
 * Connects to the host using TLS and returns the number of days remaining before SSL expiration.
 * Returns null if the URL is not HTTPS or if connection fails.
 */
export function getSSLExpirationDays(urlStr: string): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      if (url.protocol !== 'https:') {
        resolve(null);
        return;
      }
      
      const host = url.hostname;
      const port = url.port ? parseInt(url.port) : 443;
      
      const socket = tls.connect({
        host,
        port,
        servername: host, // SNI support
        rejectUnauthorized: false, // We still want to parse expiration date even if it is self-signed/expired
      }, () => {
        const cert = socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          const validTo = new Date(cert.valid_to);
          const diffTime = validTo.getTime() - Date.now();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          resolve(diffDays);
        } else {
          resolve(null);
        }
        socket.destroy();
      });
      
      socket.on('error', () => {
        resolve(null);
        socket.destroy();
      });
      
      socket.setTimeout(4000, () => {
        resolve(null);
        socket.destroy();
      });
    } catch {
      resolve(null);
    }
  });
}
