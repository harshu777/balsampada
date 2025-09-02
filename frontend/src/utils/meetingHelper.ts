/**
 * Helper functions for Google Meet integration
 */

/**
 * Generate a unique meeting ID for Google Meet
 * Format: xxx-xxxx-xxx (similar to Google Meet format)
 */
export const generateMeetingId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [3, 4, 3];
  
  return segments
    .map(length => {
      let segment = '';
      for (let i = 0; i < length; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return segment;
    })
    .join('-');
};

/**
 * Generate a Google Meet link
 * Note: This creates a format that looks like a Google Meet link
 * For production, you'd use Google Calendar API to create actual meetings
 */
export const generateGoogleMeetLink = (classTitle?: string): string => {
  const meetingId = generateMeetingId();
  // In production, you would use Google Calendar API to create an actual meeting
  // For now, we'll create a formatted link that users can use as a template
  return `https://meet.google.com/${meetingId}`;
};

/**
 * Validate if a URL is a valid Google Meet link
 */
export const isValidGoogleMeetLink = (url: string): boolean => {
  if (!url) return false;
  
  const patterns = [
    /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^https:\/\/meet\.google\.com\/[a-z]{10}$/,
    /^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

/**
 * Format meeting link for display
 */
export const formatMeetingLink = (link: string): string => {
  if (!link) return '';
  
  // Remove https:// for display
  return link.replace(/^https?:\/\//, '');
};

/**
 * Instructions for creating Google Meet link
 */
export const GOOGLE_MEET_INSTRUCTIONS = `
To create a Google Meet link:
1. Go to https://meet.google.com
2. Click "New meeting"
3. Select "Create a meeting for later"
4. Copy the meeting link
5. Paste it here

Or use the auto-generated link and share it with your students.
`;

/**
 * Get meeting status based on class schedule
 */
export const getMeetingStatus = (startDate: string, endDate: string): 'upcoming' | 'live' | 'ended' => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'live';
};