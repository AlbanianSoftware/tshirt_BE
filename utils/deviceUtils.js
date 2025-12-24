// utils/deviceUtils.js - Device detection utility

/**
 * Detect device type from user agent string
 * @param {string} userAgent - Browser user agent string
 * @returns {string} - 'mobile' | 'tablet' | 'desktop'
 */
export const detectDeviceType = (userAgent) => {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();

  // Mobile devices
  const mobileRegex =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  if (mobileRegex.test(ua)) {
    return "mobile";
  }

  // Tablets
  const tabletRegex = /ipad|android(?!.*mobile)|tablet|kindle|silk/i;
  if (tabletRegex.test(ua)) {
    return "tablet";
  }

  // Default to desktop
  return "desktop";
};

/**
 * Get device info from request (server-side)
 * @param {Request} req - Express request object
 * @returns {Object} - Device information
 */
export const getDeviceInfo = (req) => {
  const userAgent = req.get("user-agent") || "";
  const deviceType = detectDeviceType(userAgent);

  // Get IP address (handles proxies)
  const ipAddress =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown";

  return {
    deviceType,
    userAgent,
    ipAddress: ipAddress.replace("::ffff:", ""), // Clean IPv6 prefix
  };
};

/**
 * Get device info from browser (client-side)
 * @returns {Object} - Device information
 */
export const getClientDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const deviceType = detectDeviceType(userAgent);

  return {
    deviceType,
    userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    platform: navigator.platform,
  };
};

/**
 * Get device icon name for UI
 * @param {string} deviceType - 'mobile' | 'tablet' | 'desktop'
 * @returns {string} - Icon identifier
 */
export const getDeviceIcon = (deviceType) => {
  const icons = {
    mobile: "smartphone",
    tablet: "tablet",
    desktop: "monitor",
  };
  return icons[deviceType] || "monitor";
};

/**
 * Get device display name
 * @param {string} deviceType - 'mobile' | 'tablet' | 'desktop'
 * @returns {string} - Human-readable name
 */
export const getDeviceDisplayName = (deviceType) => {
  const names = {
    mobile: "Mobile",
    tablet: "Tablet",
    desktop: "Desktop",
  };
  return names[deviceType] || "Unknown";
};

/**
 * Parse browser info from user agent
 * @param {string} userAgent - Browser user agent string
 * @returns {Object} - Browser and OS info
 */
export const parseBrowserInfo = (userAgent) => {
  if (!userAgent) return { browser: "Unknown", os: "Unknown" };

  const ua = userAgent.toLowerCase();

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edge")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edge")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
    os = "iOS";

  return { browser, os };
};
