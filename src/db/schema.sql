-- Exam Classroom Locator - Database Schema
-- Updated against real Fergusson College backlog exam schedules
-- (NEP 2020 pattern, M.A. / M.Sc., Sem I-IV). Building/room data is
-- still pending - room_id stays nullable until rooms are assigned.

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE  -- e.g. "COMPUTER SCIENCE", "DATA SCIENCE"
);

CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    map_zone VARCHAR(50)  -- identifier used to highlight this building on the campus map
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor VARCHAR(20) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    capacity INTEGER,
    UNIQUE (building_id, room_no)
);

-- One row per paper code + date + slot. room_id starts NULL on import
-- and gets filled in via the admin panel once room assignments are typed in.
CREATE TABLE IF NOT EXISTS exam_schedule (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(30) NOT NULL,       -- paper code, e.g. "CSD-501"
    paper_title VARCHAR(255),
    program VARCHAR(20),                    -- "M.A." or "M.Sc."
    semester SMALLINT,                      -- 1-4
    department_id INTEGER REFERENCES departments(id),
    room_id INTEGER REFERENCES rooms(id),   -- nullable until room is assigned
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    section_label VARCHAR(50),              -- e.g. "Batch A" if a course is ever split
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE (course_code, exam_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_exam_schedule_course_code ON exam_schedule (course_code);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_date ON exam_schedule (exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_room_id ON exam_schedule (room_id);
