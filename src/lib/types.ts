export interface Investor {
  Investor_Name: string;
  Contact_Person: string;
  Designation?: string;
  Email?: string;
  Phone?: string;
  Website?: string;
  LinkedIn?: string;
  Company_LinkedIn?: string;
  Twitter?: string;
  Facebook?: string;
  Country?: string;
  State?: string;
  City?: string;
  Founded_Year?: string;
  Investor_Type?: string;
  Practice_Areas?: string;
  Description?: string;
  Overview?: string;
  Investment_Score?: string;
  Business_Models?: string;
  Contact_Summary?: string;
  Location?: string;
  Domain_Name?: string;
  Blog_Url?: string;
  Tracxn_URL?: string;
  // For any other columns in the CSV
  [key: string]: string | undefined;
}
