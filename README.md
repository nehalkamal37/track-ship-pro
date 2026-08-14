# TrackFlow Insights

Build a professional responsive frontend for a shipment tracking and intelligence platform named TrackFlow.

The application will connect later to an ASP.NET Core REST API. For now, use realistic mock data, but place all data access inside a clean API service layer so the mock implementation can later be replaced with real HTTP requests without changing the page components.

Product purpose

TrackFlow is used by delivery operators and merchants to create shipments, monitor shipment progress, update shipment statuses, identify delayed shipments, and allow customers to track packages publicly using a tracking number.

Technology

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

React Router

TanStack Query

React Hook Form

Zod

Recharts

Lucide icons

The application must be production-style, clean, accessible, and responsive.

Visual direction

Create a modern logistics SaaS interface.

Use:

A spacious professional layout

Clear typography

Neutral backgrounds

A restrained blue or indigo accent

Status badges with consistent semantic styling

Cards with subtle borders and shadows

Useful empty, loading, and error states

Avoid excessive gradients, oversized headings, glassmorphism, decorative animations, and unnecessary visual clutter.

Roles

Support these frontend roles:

Admin

Operator

Merchant

Add a mock authenticated user and structure authorization so navigation items and actions can later be restricted by role.

Main application layout

Create:

Collapsible left sidebar

Top header

Search

User profile menu

Notification icon

Breadcrumbs

Responsive mobile navigation

Sidebar pages:

Dashboard

Shipments

At-Risk Shipments

Merchants

Activity Log

Settings

1. Login page

Create a professional login page with:

Email

Password

Remember me

Show or hide password

Validation

Loading state

Invalid credentials error

Use mock credentials for the current prototype.

2. Dashboard

Display these KPI cards:

Total Shipments

In Transit

Delivered

Delayed

Delivery Success Rate

Add:

Shipment status distribution chart

Shipment volume trend chart

Recent tracking activity

At-risk shipment preview

View-all navigation links

Cards and charts must use realistic mock data and support loading and empty states.

3. Shipments list

Create a paginated shipment table.

Columns:

Tracking Number

Merchant

Recipient

Origin

Destination

Current Status

Expected Delivery

Risk Level

Last Updated

Actions

Features:

Search by tracking number or recipient

Filter by shipment status

Filter by merchant

Filter by risk level

Date range filter

Sort controls

Pagination

Clear filters

Row click opens shipment details

Button to create a shipment

Use status values:

Created

Picked Up

At Origin Facility

In Transit

At Destination Facility

Out for Delivery

Delivered

Delivery Failed

On Hold

Returned to Sender

Cancelled

Lost

Use risk levels:

Normal

At Risk

Delayed

Critical

4. Create shipment page

Create a validated form with these sections:

Merchant

Merchant selection

Recipient

Name

Phone

Email

Package

Package description

Weight

Optional reference number

Route

Origin address

Destination address

Delivery

Expected delivery date

Optional notes

Include:

Required field validation

Submit loading state

Cancel action

Success confirmation

API error display

5. Shipment details page

Create a comprehensive shipment details page.

Header:

Tracking number

Current status

Risk level

Merchant

Expected delivery date

Last updated time

Actions:

Update Status

Cancel Shipment

Copy Tracking Link

Sections:

Shipment summary

Recipient details

Origin and destination

Package information

Shipment intelligence

Tracking timeline

Audit information

The tracking timeline must show:

Status

Location

Timestamp

Notes

User or source that created the event

Show newest and oldest ordering controls.

6. Update status modal

Create a modal with:

New status

Location

Notes

Event date and time

Submit button

For the mock implementation, show only logically valid next statuses based on the shipment's current status.

Display a confirmation before terminal statuses such as:

Delivered

Cancelled

Lost

Returned to Sender

7. Shipment intelligence

On the shipment details page, display an intelligence card that explains the current operational risk.

Example messages:

“This shipment is progressing normally.”

“This shipment has not moved for 14 hours and may miss its expected delivery date.”

“This shipment is delayed and requires immediate review.”

“Two delivery attempts have failed.”

Display contributing factors such as:

Hours since last movement

Expected delivery variance

Failed delivery attempts

Current facility

Do not present this as artificial intelligence. Present it as rule-based shipment intelligence.

8. At-risk shipments page

Create a focused operational page containing:

Risk summary cards

Filters for At Risk, Delayed, and Critical

Table of affected shipments

Reason for risk

Hours inactive

Expected delivery date

Last known location

Quick access to shipment details

Sort Critical shipments first.

9. Merchants page

Create:

Merchant list

Search

Status filter

Create Merchant button

Merchant fields:

Company name

Contact name

Email

Phone

Active status

Shipment count

Created date

Create merchant details and edit forms using realistic mock data.

10. Activity log page

Create a filterable audit activity table.

Fields:

Timestamp

User

Action

Entity

Entity ID

Description

Filters:

User

Action type

Entity type

Date range

11. Public tracking page

Create a public page outside the authenticated dashboard.

Route example:

/track

The page must include:

TrackFlow branding

Tracking number input

Track button

Validation

Package-not-found state

After searching, display:

Tracking number

Current status

Expected delivery

Origin city

Destination city

Tracking timeline

Do not display private information such as full phone numbers, internal notes, user IDs, or full recipient details.

Make this page polished enough to be shared directly with customers.

API architecture

Create a dedicated API folder with typed services such as:

authApi

shipmentsApi

merchantsApi

dashboardApi

trackingApi

activityApi

Use TypeScript request and response interfaces.

Create a configurable API base URL using:

VITE_API_BASE_URL

For now, the API service methods should return mock data asynchronously with simulated loading delays.

Do not access mock data directly inside page components.

Prepare the services for these future endpoints:

POST /api/auth/login

GET /api/auth/me

GET /api/merchants

POST /api/merchants

GET /api/merchants/{id}

PUT /api/merchants/{id}

GET /api/shipments

POST /api/shipments

GET /api/shipments/{id}

POST /api/shipments/{id}/events

POST /api/shipments/{id}/cancel

GET /api/tracking/{trackingNumber}

GET /api/dashboard/summary

GET /api/dashboard/status-breakdown

GET /api/dashboard/at-risk-shipments

GET /api/dashboard/recent-activity

Important implementation requirements

Use reusable components.

Keep page components separate from API logic.

Use typed models and enums.

Use URL query parameters for shipment filters.

Add loading skeletons.

Add toast notifications.

Add error states and retry buttons.

Add empty states.

Add confirmation dialogs for destructive actions.

Ensure mobile responsiveness.

Ensure keyboard accessibility.

Do not create a backend.

Do not use Supabase.

Do not hardcode data inside UI components.

Do not add features outside this scope.

Generate the full frontend application with realistic seeded mock data and navigation between all pages.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://track-ship-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fcbefae9-881f-47e2-ac22-e21fa679d343).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
