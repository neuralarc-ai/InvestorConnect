export interface Contact {
  investorName: string;
  email: string;
  [key: string]: string; // Allow other dynamic properties
}

export interface Company {
  companyName: string;
  companyDescription: string;
  investmentStage: string;
  pastInvestments: string;
  contacts: Contact[];
}
