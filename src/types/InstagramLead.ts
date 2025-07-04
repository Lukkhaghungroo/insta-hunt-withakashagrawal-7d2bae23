
export interface InstagramLead {
  id: string;
  username: string;
  profileUrl: string;
  followers: string; // Changed from number to string since we store "Unknown" or formatted strings
  bio: string;
  category: string;
  city: string;
  isConfirmed: boolean;
}
