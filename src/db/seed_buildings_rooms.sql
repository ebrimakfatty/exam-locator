-- Seed data: buildings and rooms at Fergusson College
-- Source: room list provided by the examination section (Aug 2026)
-- NOTE: floor is "Unspecified" for Chemistry and Main Building rooms -
-- confirm with the examination section and update before go-live.
-- NOTE: room capacity not yet provided - important since sir mentioned
-- some classes exceed the standard 30-student block size and some
-- rooms hold more than 30. Fill in capacity once known.

INSERT INTO buildings (name) VALUES
    ('Mathematics Department'),
    ('Geology Department'),
    ('Chemistry Department'),
    ('Physics Department'),
    ('Amphitheatre'),
    ('Computer Science Department'),
    ('Main Building')
ON CONFLICT DO NOTHING;

-- Mathematics Department
INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'Ground Floor', room FROM buildings, unnest(ARRAY['R1','R2','R3','R4']) AS room
WHERE name = 'Mathematics Department'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'First Floor', room FROM buildings, unnest(ARRAY['R6','R7','R8','R9']) AS room
WHERE name = 'Mathematics Department'
ON CONFLICT DO NOTHING;

-- Geology Department
INSERT INTO rooms (building_id, floor, room_no) VALUES
    ((SELECT id FROM buildings WHERE name = 'Geology Department'), 'Ground Floor', 'GL101'),
    ((SELECT id FROM buildings WHERE name = 'Geology Department'), 'First Floor', 'GL202')
ON CONFLICT DO NOTHING;

-- Chemistry Department (floor unspecified - confirm and update)
INSERT INTO rooms (building_id, floor, room_no) VALUES
    ((SELECT id FROM buildings WHERE name = 'Chemistry Department'), 'Unspecified', 'C6'),
    ((SELECT id FROM buildings WHERE name = 'Chemistry Department'), 'Unspecified', 'C10')
ON CONFLICT DO NOTHING;

-- Physics Department
INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'Ground Floor', room FROM buildings, unnest(ARRAY['P2','P3','P9']) AS room
WHERE name = 'Physics Department'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'First Floor', room FROM buildings, unnest(ARRAY['P10','P11']) AS room
WHERE name = 'Physics Department'
ON CONFLICT DO NOTHING;

-- Amphitheatre
INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'Ground Floor', room FROM buildings, unnest(ARRAY['A2','A6','A7']) AS room
WHERE name = 'Amphitheatre'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'First Floor', room FROM buildings, unnest(ARRAY['A8','A9']) AS room
WHERE name = 'Amphitheatre'
ON CONFLICT DO NOTHING;

-- Computer Science Department (named rooms, not numbered)
INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'Ground Floor', room FROM buildings, unnest(ARRAY['Nalanda','Taxila','Vakaramsila']) AS room
WHERE name = 'Computer Science Department'
ON CONFLICT DO NOTHING;

-- Main Building (Environment Science) - floor unspecified, confirm and update
INSERT INTO rooms (building_id, floor, room_no)
SELECT id, 'Unspecified', room FROM buildings, unnest(ARRAY['M22','M14','M20']) AS room
WHERE name = 'Main Building'
ON CONFLICT DO NOTHING;
