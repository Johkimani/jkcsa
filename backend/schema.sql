-- -- Officials Management System Database Schema
-- -- Run this SQL in PostgreSQL to create the required table

-- CREATE TABLE IF NOT EXISTS officials (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     category VARCHAR(50) NOT NULL,
--     position VARCHAR(100),
--     photo TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create index for faster category queries
-- CREATE INDEX IF NOT EXISTS idx_officials_category ON officials(category);

-- -- Create index for sorting by category and created_at
-- CREATE INDEX IF NOT EXISTS idx_officials_category_created ON officials(category, created_at DESC);

-- -- Insert sample data (optional)
-- -- INSERT INTO officials (name, category, position) VALUES 
-- -- ('John Doe', 'Executive', 'Chairman'),
-- -- ('Jane Smith', 'Executive', 'Secretary');


CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE IF NOT EXISTS officials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    position VARCHAR(100),
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(30) PRIMARY KEY NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    year_of_study VARCHAR(20),
    course VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE
);
CREATE TABLE IF NOT EXISTS roles (
    role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS member_roles (
    member_id VARCHAR(30) REFERENCES members(member_id),
    role_id uuid REFERENCES roles(role_id),
    PRIMARY KEY(member_id, role_id)
);
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(100),
    description TEXT
);
CREATE TABLE IF NOT EXISTS sub_groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS event_subgroup_attendance (
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    group_id UUID REFERENCES sub_groups(group_id) ON DELETE CASCADE,
    attendance_count INT NOT NULL CHECK (attendance_count >= 0),
    PRIMARY KEY (event_id, group_id)
);
CREATE TABLE IF NOT EXISTS contributions (
    contribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(30) REFERENCES members(member_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(event_id) ON DELETE
    SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        contribution_type VARCHAR(50),
        contribution_date DATE DEFAULT CURRENT_DATE
);