/**
 * Backend Seat Availability Configuration
 * 
 * This file contains the default seat availability configuration for the vendor dashboard.
 * Modify these values to change the default seat layout for all vendors.
 * 
 * Structure:
 * - Each seat category has a default available count
 * - These values are used when creating new vendor layouts
 * - Values are automatically reset daily to these defaults
 * - Simple daily availability - no time slots needed
 */

export const DEFAULT_SEAT_AVAILABILITY = {
  // 2-person tables
  '2': 4,
  
  // 4-person tables  
  '4': 6,
  
  // 6-person tables
  '6': 5,
  
  // 8-person tables
  '8': 3,
  
  // 10-person tables
  '10': 2,
  
  // 11-15 person tables
  '11-15': 3,
  
  // 16-20 person tables
  '16-20': 1,
  
  // 20+ person tables
  '20+': 0,
  
  // 30+ person tables
  '30+': 1,
  
  // 50+ person tables
  '50+': 0
};

// Alias for backward compatibility
export const DEFAULT_SEAT_CONFIG = DEFAULT_SEAT_AVAILABILITY;
