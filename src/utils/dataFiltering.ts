import { InstagramLead } from "@/types/InstagramLead";

/**
 * Utility function to filter and sort Instagram leads
 */
export const filterAndSortLeads = (
  leads: InstagramLead[], 
  searchFilter: string, 
  sortBy: "followers" | "brandName", 
  sortOrder: "asc" | "desc"
): InstagramLead[] => {
  return leads
    .filter(lead => 
      lead.brandName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      lead.userId.toLowerCase().includes(searchFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "followers") {
        return sortOrder === "desc" ? b.followers - a.followers : a.followers - b.followers;
      } else {
        return sortOrder === "desc" 
          ? b.brandName.localeCompare(a.brandName)
          : a.brandName.localeCompare(b.brandName);
      }
    });
};

/**
 * Validates minimum followers input
 */
export const validateMinFollowers = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: true }; // Empty is valid (no filter)
  }
  
  const num = parseInt(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: "Please enter a valid number" };
  }
  
  if (num < 0) {
    return { isValid: false, error: "Minimum followers cannot be negative" };
  }
  
  if (num > 100000000) { // 100M followers max
    return { isValid: false, error: "Please enter a realistic follower count" };
  }
  
  return { isValid: true };
};