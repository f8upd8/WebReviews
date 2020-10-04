DROP TABLE IF EXISTS interview;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS video;

CREATE TABLE interview (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
);

CREATE TABLE question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    interview_id INTEGER,
    FOREIGN KEY (interview_id) REFERENCES interview (id)
);

CREATE TABLE video (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recording BLOB NOT NULL,
    key_timestamps TEXT NOT NULL,
    interview_id INTEGER,
    FOREIGN KEY (interview_id) REFERENCES interview (id)
);