/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EventStatus {
  Inquiry = "Inquiry",
  ProposalSent = "Proposal Sent",
  ContractSigned = "Contract Signed",
  DepositPaid = "Deposit Paid",
  ActivePrep = "Active Prep",
  Completed = "Completed",
  Archived = "Archived"
}

export enum CourseCategory {
  AmuseBouche = "Amuse-Bouche",
  FirstCourse = "First Course",
  Intermezzo = "Intermezzo",
  Main = "Main",
  Dessert = "Dessert",
  Mignardise = "Mignardise"
}

export enum PrepComplexity {
  Low = "Low",
  Medium = "Medium",
  High = "High"
}

export enum DietaryPreference {
  Vegan = "Vegan",
  Vegetarian = "Vegetarian",
  Keto = "Keto",
  Halal = "Halal",
  None = "None"
}

export interface MenuItem {
  id: string;
  name: string;
  category: CourseCategory;
  description: string;
  keyIngredients: string[];
  complexity: PrepComplexity;
  costPerServing: number;
  imageUrl: string;
}

export interface Booking {
  id: string;
  eventName: string;
  clientName: string;
  eventDate: string;
  guestCount: number;
  pricePerPlate: number;
  status: EventStatus;
  venueAddress: string;
  notes: string;
  menuItemIds: string[]; // Many-to-many link to Menu Builder DB
}

export interface DietaryRecord {
  id: string;
  guestIdentifier: string; // e.g., "Guest: Jane Doe" or "Seat 3"
  bookingId: string;       // Linked to Booking
  criticalAllergies: string[]; // e.g., ["Oysters", "Shellfish", "Nuts"]
  preference: DietaryPreference;
}
