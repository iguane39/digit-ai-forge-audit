-- Schéma DEV réel AVANT migration : listings sans status/closed_at/territory_id
CREATE TABLE listings (
  id integer PRIMARY KEY,
  title varchar(255)
);
CREATE TABLE territories ( id integer PRIMARY KEY, name varchar(80) );
