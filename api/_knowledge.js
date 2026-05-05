// api/_knowledge.js
// HarvestFlow support knowledge base.
// Edit this file to update what the bot knows.
// Re-deploy after every edit.

export const KNOWLEDGE_BASE = `
# HarvestFlow Support Knowledge Base

## What is HarvestFlow?
HarvestFlow is a converts management system built for churches. It helps churches
track every soul who responds at outreaches — from the moment of decision through
follow-up, church attendance, baptism, and ministry involvement.

Tagline: Sow the seed. Track the growth.

## Who built it?
HarvestFlow is built and maintained by Adeniyi Owolabi, a developer and church
leader. It is currently in beta with Perfection Bible Church as the first
partner church.

## Pricing
HarvestFlow is FREE during the beta period. There is no charge to register a
church, add workers, or send messages. Future pricing will be announced before
beta ends, and beta partners will get permanent generous pricing.

## How to register a church
Visit landing.harvestflows.com and fill in the registration form. We set up
your private workspace within 24 hours of receiving the registration. You will
receive your login credentials by email.

## Core features

### Convert Registry
Register every convert from your outreach with name, phone, gender, age group,
location, and decision type. All searchable. Voice registration is supported —
just speak the convert's details and Whisper transcribes them.

### Voice Registration
On the "Register Convert" page, tap "Voice Register". Hold the microphone
button and speak the convert's name, phone, location, gender, and age group
one at a time. The system uses OpenAI Whisper to transcribe. Works in English,
Yoruba, Igbo, Hausa, and Pidgin (Pidgin uses English mode).

### Click-to-Call Tracking
Tap any convert's phone number to dial them directly. After the call, a modal
opens to log the outcome (Responded, No Answer, Met in Person, etc.) and notes.
Every call is logged to the database.

### Discipleship Milestones
Each convert profile tracks 5 milestones:
- Contacted within 48 hours
- First church attendance
- Joined cell group
- Baptized
- Joined ministry unit

### Retention Tracking
Each convert has Month 1, Month 3, and Month 6 status (Active, Irregular, Not
Reachable, Backslid, Transferred, Moved Away). The Retention page shows
percentages by crusade or by decision type.

### Follow-Up Logs
Workers log every follow-up interaction (Call, WhatsApp, Visit, SMS) with the
outcome and notes. The Follow-Up page shows team performance and converts who
need contact.

### SMS / WhatsApp Blast
Admin and Super Admin users can send personalised messages to all converts in
one click. Use [Name] in the message to personalise it. The system tries
WhatsApp first, falls back to SMS. Powered by EbulkSMS.

### Reports & CSV Export
The Reports page shows aggregate stats and lets you download Convert Registry,
Follow-Up Report, and Retention Summary as CSV files.

### Offline Mode
The app caches data locally so workers can view converts even without internet.
New follow-up logs queue up and sync automatically when back online.

### Roles
- Worker: sees only their assigned converts
- Coordinator: manages a team
- Admin: sees everything in the church
- Super Admin: sees all churches (HarvestFlow team only)

## Common troubleshooting

### Voice registration says "Transcription failed"
Likely causes:
1. The recording was too short (release the button after a longer pause)
2. Background noise was too loud
3. Network issue
Try again in a quieter spot, holding the button for 3+ seconds.

### SMS Blast says "0 sent"
Check:
1. The church has EbulkSMS credits loaded
2. The sender ID is approved on EbulkSMS
3. The message contains [Name] if you want personalisation
4. Phone numbers are valid Nigerian format (08xxxxxxxxx or +234xxxxxxxxxx)

### Phone numbers not personalising
Make sure the message has [Name] (with square brackets, capital N) where you
want the convert's first name to appear. Without [Name], no personalisation
happens.

### "401 unauthorised" errors
Your session has expired. Log out and log back in to get a fresh token.

### Forgot password
Contact your church admin. They can reset your password from the workers page.
If you ARE the church admin, contact Adeniyi directly.

### Adding new workers
Currently, new workers must be added by Adeniyi directly. This will become
self-service in a future update. WhatsApp Adeniyi to add a worker.

## Privacy & data
- All data is stored on Supabase (PostgreSQL)
- Each church's data is isolated by Row-Level Security
- No church can see another church's data
- The HarvestFlow team can see anonymised aggregate metrics only
- Data is never sold or shared with third parties
- You can export all your data as CSV at any time

## What HarvestFlow does NOT do (yet)
- Member management (cell groups, departments, attendance) — coming soon
- Donations / giving / tithe tracking — not planned
- Sermon recordings or media library — not planned
- Live streaming — not planned
- Member self-registration via mobile app — not planned (members don't log in)

## Channels for support
- WhatsApp: contact Adeniyi directly (preferred for urgent issues)
- Email: adeniyi.tosin@harvestflows.com (for non-urgent or detailed questions)
- This chat: for general questions and quick answers

## The roadmap (high-level)
- Membership Management System (cell groups, departments, attendance, undershepherds) — in design
- Multi-language support for the UI
- iOS / Android native apps
- More integrations (more SMS providers, payment gateways)
`.trim();
