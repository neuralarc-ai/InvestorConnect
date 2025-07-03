# **App Name**: 86F

## Core Features:

- CSV Upload: Implement a drag-and-drop interface for uploading .csv files, with client-side parsing and a confirmation preview of the data.
- Investor Records Display: Display each investor record as a card using ShadCN styling. Each card will show key data fields with an option to open a side panel for full details. If one particular company has multiple contacts in the CSV, just create one record for the company and then, on clicking on the company, load the other contacts from the company.
- Email Generation: Integrate Gemini API to generate personalized outreach emails based on investor data, with a text area for editing before sending. This will be implemented as a tool within the app.
- Email Sending: Provide functionality to send emails via Gmail API or SendGrid. Log the status of sent emails for each investor.
- UI Theme Toggle: Implement a light/dark mode toggle with a minimal black-and-white palette, utilizing ShadCN components for a responsive layout.
- PIN Authentication: Implement a basic 4-digit PIN login for internal use to secure the application.

## Style Guidelines:

- Primary color: Almost black (#222222) for a strong, clean base.
- Background color: Near white (#F2F2F2), visibly of the same hue as the primary color but very desaturated, provides a gentle contrast without overwhelming brightness.
- Accent color: Light gray (#AAAAAA), an analogous hue, ensuring visibility against both light and dark backgrounds for subtle interactive elements.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and short amounts of text; 'Inter' (sans-serif) for body text to maintain a modern tech-focused aesthetic with readability.
- Use minimalistic line icons for all interactive elements. Ensure icons are high contrast and consistent across the app.
- Utilize ShadCN's Card and DataTable components to display data in a clear, structured manner. Implement a responsive design that adapts to different screen sizes.
- Implement subtle transition animations for UI elements, like card expansion and modal appearance, to enhance user experience without being distracting.