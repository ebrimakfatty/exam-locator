# Exam Classroom Locator

Web app for Fergusson College students to find their exam room by course code.

## Project structure

```
exam-locator/
├── package.json
├── .env.example          # copy to .env and fill in real values
├── src/
│   ├── server.js         # starts the server
│   ├── app.js            # express app setup, wires routes + middleware
│   ├── db/
│   │   ├── index.js      # PostgreSQL connection pool
│   │   ├── schema.sql    # table definitions (placeholder - refine with real data)
│   │   └── init.js       # run once to create tables
│   ├── middleware/
│   │   └── requireAdmin.js  # blocks admin routes unless logged in
│   └── routes/
│       ├── search.js     # public: GET /api/search?course_code=...
│       └── admin.js      # admin: login, add exam schedule entries
└── public/                # plain HTML/CSS/JS frontend (student-facing)
    ├── index.html
    ├── css/style.css
    └── js/search.js
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your PostgreSQL connection string.

3. Create the database tables:
   ```
   npm run db:init
   ```

4. Load the real buildings and rooms (Mathematics, Geology, Chemistry,
   Physics, Amphitheatre, Computer Science, Main Building):
   ```
   npm run db:seed-rooms
   ```
   Note: Chemistry and Main Building room floors are marked
   "Unspecified" - confirm these with the examination section and
   update `src/db/seed_buildings_rooms.sql` (or edit directly in the
   database) once known. Room capacity also isn't filled in yet.

5. Import the real exam schedule (parsed from the examination section's
   documents - 264 entries across M.A./M.Sc. Sem I-IV). Rooms are left
   blank on import; you'll assign them via the admin panel next.
   ```
   npm run db:import-schedule
   ```

6. Create your first admin account (no signup form on purpose - only the
   exam section staff should be able to log in):
   ```
   npm run create-admin -- admin YourPassword123
   ```
   (Password must be at least 8 characters. Run it again to reset a password.)

7. Start the server:
   ```
   npm start
   ```
   Visit http://localhost:3000 for the student search and
   http://localhost:3000/admin.html for the admin panel.

   Shortcut for steps 3-5: `npm run setup`.

## Current status

- [x] Project structure, database schema, real buildings/rooms, 264-exam schedule import
- [x] Public search API + frontend (handles "room not yet assigned")
- [x] Admin login, schedule listing, room assignment, edit and delete
- [x] Campus map highlighting the exam building (7 real buildings, mobile layout)
- [ ] Room capacity data (not provided yet)
- [ ] Chemistry / Main Building floor confirmation
- [ ] Deployment (set `NODE_ENV=production`, a strong `SESSION_SECRET`, and HTTPS)

## Notes

- Schema in `src/db/schema.sql` currently assumes a course code can map to
  multiple rooms in the same slot (via `section_label`). Confirm this against
  real Fergusson data and adjust if it's always one room per course/slot.
- `map_zone` on `buildings` is a placeholder field for whatever the campus
  map implementation ends up needing (an SVG element ID, an image
  coordinate, etc.) — not finalized yet.
