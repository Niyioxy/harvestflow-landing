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
Visit www.harvestflows.com and fill in the registration form. We set up
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

### Send an Update (WhatsApp messages)
Admins, pastors and the super admin send personalised WhatsApp messages to
converts, members or both from the Dashboard. [Name] becomes each person's first
name and [Church] the church's name. Send now, schedule for one or several dates,
repeat every week, or "Plan several messages" (a different message per date,
written by AI or by you). Queued messages can be edited or cancelled. WhatsApp is
tried first; SMS fallback is optional (SMS doesn't reach UK numbers).

### Members, cell groups and departments
Members with a stage (new member, full member, inactive, relocated, deceased),
undershepherd, cell group and department; children linked to a parent. Any leader
can head a department.

### Attendance and QR self check-in
One register per service. Leaders mark it on the Attendance page, or from My
Flock (undershepherds), My Cell (cell leaders) and My Department (department
heads). People can check themselves in by scanning a QR code with their phone
camera (no app needed); a permanent poster code works for every service. If
anyone marks someone present, they stay present. An automatic "we missed you"
WhatsApp can go to people marked absent.

### Pastoral Care
The day after a service, each adult member marked absent gets one follow-up task
for their undershepherd, cell leader or department head (or the pastors'
"Not yet assigned" list), with a shared contact history. It closes itself when
they come back.

### First-timers
Visitors fill in "First time here?" from the QR code, or an usher adds them. With
their consent they get a WhatsApp welcome, a note 3 days later and an invitation
before the next service; the welcome team phones them; return visits are counted
until they join.

### Barnabas in the app
Signed-in leaders can ask Barnabas inside the app: how things work, who missed
church, who needs a follow-up, how first-timers are doing, and he drafts
messages. He only sees what that leader can see and never sends anything himself.

### Signing in
The app is at app.harvestflows.com (the website is www.harvestflows.com).

### Reports & CSV Export
The Reports page shows aggregate stats and lets you download Convert Registry,
Follow-Up Report, and Retention Summary as CSV files.

### Offline Mode
The app caches data locally so workers can view converts even without internet.
New follow-up logs queue up and sync automatically when back online.

### Roles
- Worker: their assigned converts; can add first-timers
- Cell leader, Undershepherd: their own people, attendance and follow-ups
- Coordinator, Pastor: lead the church day to day
- Admin: everything in their own church
- Ministry admin / General overseer: all branches of a ministry
- Super Admin: all churches (HarvestFlow team only)

## Common troubleshooting

### Voice registration says "Transcription failed"
Likely causes:
1. The recording was too short (release the button after a longer pause)
2. Background noise was too loud
3. Network issue
Try again in a quieter spot, holding the button for 3+ seconds.

### Messages say "0 sent" or failed
Check:
1. The message was previewed, then sent or scheduled (look under Upcoming messages)
2. Phone numbers are valid for the church's country; numbers without a + are read
   as local numbers (e.g. 07… in the UK, 08… in Nigeria)
3. UK numbers can only receive WhatsApp, not SMS
4. For anything else, contact Adeniyi

### Phone numbers not personalising
Make sure the message has [Name] (with square brackets, capital N) where you
want the convert's first name to appear. Without [Name], no personalisation
happens.

### "401 unauthorised" errors
Your session has expired. Log out and log back in to get a fresh token.

### Forgot password
Contact your church admin. They can reset your password from the workers page.
If you ARE the church admin, contact Adeniyi directly.

### Adding new workers and leaders
A church admin invites them from People & Roles ("+ Invite User"), choosing their
role. They receive an email to set up their login.

## Privacy & data
- All data is stored on Supabase (PostgreSQL)
- Each church's data is isolated by Row-Level Security
- No church can see another church's data
- The HarvestFlow team can see anonymised aggregate metrics only
- Data is never sold or shared with third parties
- You can export all your data as CSV at any time

## What HarvestFlow does NOT do (yet)
- Donations / giving / tithe tracking — not planned
- Sermon recordings or media library — not planned
- Live streaming — not planned
- Member self-registration via mobile app — not planned (members don't log in)

## Channels for support
- WhatsApp: contact Adeniyi directly (preferred for urgent issues)
- Email: adeniyi.tosin@harvestflows.com (for non-urgent or detailed questions)
- This chat: for general questions and quick answers

## The roadmap (high-level)
- Discipleship pipeline: each person's journey from first visit to serving, with alerts when someone is stuck
- Barnabas briefings: a weekly summary for each leader of who needs care
- Multi-language support for the UI
- iOS / Android native apps
- More integrations (more SMS providers, payment gateways)
`.trim();
