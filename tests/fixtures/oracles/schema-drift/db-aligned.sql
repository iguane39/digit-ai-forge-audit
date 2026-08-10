CREATE TABLE listings ( id integer PRIMARY KEY, title varchar(255) );
CREATE TABLE territories ( id integer PRIMARY KEY, name varchar(80) );
ALTER TABLE listings ADD COLUMN status varchar(20);
ALTER TABLE listings ADD COLUMN closed_at timestamp;
ALTER TABLE listings ADD COLUMN territory_id integer;
