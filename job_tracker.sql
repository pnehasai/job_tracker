Create database job_tracker
use job_tracker

CREATE TABLE User (
userID INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(100) NOT NULL,
contact_info VARCHAR(100)
);


CREATE TABLE JobApplication (
applicationID INT AUTO_INCREMENT PRIMARY KEY,
userID INT,
applicationDate DATE NOT NULL,
deadline DATE,
status ENUM('Applied', 'Processing', 'Interview', 'Rejected', 'Selected') DEFAULT 'Applied',
FOREIGN KEY (userID) REFERENCES User(userID)
ON DELETE CASCADE
 );


CREATE TABLE Interview (
interviewID INT AUTO_INCREMENT PRIMARY KEY,
applicationID INT,
interviewDate DATE,
interviewMode ENUM('Online', 'Offline'),
result ENUM('Pending', 'Selected', 'Rejected'),
FOREIGN KEY (applicationID) REFERENCES JobApplication(applicationID)
 ON DELETE CASCADE
   );


CREATE TABLE Admin (
adminID INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100)
  );


CREATE TABLE Notification (
 notificationID INT AUTO_INCREMENT PRIMARY KEY,
 type VARCHAR(50),
 date DATE,
  time TIME,
  applicationID INT,
  adminID INT,
  FOREIGN KEY (applicationID) REFERENCES JobApplication(applicationID)
          ON DELETE CASCADE,
       FOREIGN KEY (adminID) REFERENCES Admin(adminID)
   ON DELETE SET NULL
    );



DELIMITER //

CREATE TRIGGER status_change_notify
AFTER UPDATE ON JobApplication
FOR EACH ROW
BEGIN
IF OLD.status <> NEW.status THEN
INSERT INTO Notification (type, date, time, applicationID)
VALUES (
CONCAT('Status changed to ', NEW.status),
CURDATE(),
CURTIME(),
NEW.applicationID
 );
END IF;
   END//



 DELIMITER ;
 DELIMITER //

 CREATE PROCEDURE AddApplication(
   IN p_userID INT,
        IN p_applicationDate DATE,
        IN p_deadline DATE
     )
    BEGIN
         INSERT INTO JobApplication (userID, applicationDate, deadline)
        VALUES (p_userID, p_applicationDate, p_deadline);
     END//





DELIMITER ;
DELIMITER //

 CREATE FUNCTION ActiveApplications(uID INT)
     RETURNS INT
     DETERMINISTIC
     READS SQL DATA
     BEGIN
         DECLARE count_active INT;
    
         SELECT COUNT(*) INTO count_active
        FROM JobApplication
         WHERE userID = uID
           AND status IN ('Applied', 'Processing', 'Interview', 'Rejected');
    
         RETURN count_active;
     END//



 DELIMITER ;
 DELIMITER $$
 CREATE FUNCTION DaysSinceApplied(appDate DATE)
     RETURNS INT
     READS SQL DATA
     DETERMINISTIC
     BEGIN
         RETURN DATEDIFF(CURDATE(), appDate);
     END$$


 DELIMITER ;
 DELIMITER $$
 CREATE PROCEDURE MarkInactiveApps()
     BEGIN
        UPDATE JobApplication
        SET status = 'No Response'
        WHERE status = 'Applied'
        AND DATEDIFF(CURDATE(), appliedDate) > 60;
     END$$



 DELIMITER ;

 CREATE TABLE Company (
         companyID INT AUTO_INCREMENT PRIMARY KEY,
        companyName VARCHAR(100) NOT NULL,
         location VARCHAR(100)
     );

 CREATE TABLE JobRole (
         roleID INT AUTO_INCREMENT PRIMARY KEY,
         companyID INT,
         roleTitle VARCHAR(100) NOT NULL,
         jobType VARCHAR(50),          -- e.g., Full-time, Internship
         description TEXT,
         FOREIGN KEY (companyID) REFERENCES Company(companyID)
     );

DELIMITER //
CREATE TRIGGER update_status_after_interview
AFTER UPDATE ON Interview
FOR EACH ROW
BEGIN
    IF NEW.result = 'Selected' THEN
        UPDATE JobApplication 
        SET status = 'Selected'
        WHERE applicationID = NEW.applicationID;
    ELSEIF NEW.result = 'Rejected' THEN
        UPDATE JobApplication 
        SET status = 'Rejected'
        WHERE applicationID = NEW.applicationID;
    END IF;
END//
DELIMITER ;
DELIMITER //
CREATE FUNCTION NextInterviewDate(uID INT)
RETURNS DATE
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE next_date DATE;
    SELECT MIN(i.interviewDate) INTO next_date
    FROM Interview i
    JOIN JobApplication a ON i.applicationID = a.applicationID
    WHERE a.userID = uID
      AND i.interviewDate >= CURDATE();
    RETURN next_date;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE SendInterviewReminders()
BEGIN
    INSERT INTO Notification (type, date, time, applicationID)
    SELECT 
        'Interview Reminder',
        CURDATE(),
        CURTIME(),
        i.applicationID
    FROM Interview i
    WHERE i.interviewDate = CURDATE() + INTERVAL 1 DAY;
END//
DELIMITER ;


DELIMITER //
CREATE FUNCTION TotalApplications(uID INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total INT;
    SELECT COUNT(*) INTO total
    FROM JobApplication
    WHERE userID = uID;
    RETURN total;
END//
DELIMITER ;


ALTER TABLE JobRole 
ADD COLUMN salaryRange VARCHAR(50),
ADD COLUMN location VARCHAR(100);

ALTER TABLE Company
ADD COLUMN contactInfo VARCHAR(100),
ADD COLUMN industry VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN country VARCHAR(100);

ALTER TABLE JobApplication
ADD COLUMN roleID INT,
ADD CONSTRAINT fk_jobrole
    FOREIGN KEY (roleID)
    REFERENCES JobRole(roleID)
    ON DELETE SET NULL
    ON UPDATE CASCADE;


ALTER TABLE Admin
ADD COLUMN password VARCHAR(100) NOT NULL AFTER email;

UPDATE Admin
SET password = 'admin123'
WHERE adminID = 1;

UPDATE Admin
SET password = 'secure456'
WHERE adminID = 2;

DELIMITER //
CREATE PROCEDURE VerifyAdminLogin(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(100)
)
BEGIN
    DECLARE admin_exists INT;

    SELECT COUNT(*) INTO admin_exists
    FROM Admin
    WHERE email = p_email AND password = p_password;

    IF admin_exists = 1 THEN
        SELECT 'Login Successful' AS Message;
    ELSE
        SELECT 'Invalid Email or Password' AS Message;
    END IF;
END//
DELIMITER ;


DELETE FROM Admin;

INSERT INTO Admin (name, email, password)
VALUES 
('Admin One', 'admin1@jobtracker.com', 'admin123'),
('Admin Two', 'admin2@jobtracker.com', 'secure456');


INSERT INTO Company (companyName, location)
VALUES
('Google', 'Mountain View'),
('Microsoft', 'Redmond'),
('Infosys', 'Bangalore'),
('Amazon', 'Seattle');


INSERT INTO JobRole (companyID, roleTitle, jobType, description)
VALUES
(1, 'Software Engineer', 'Full-time', 'Develop and maintain software applications.'),
(1, 'Data Analyst', 'Internship', 'Assist in analyzing business data and trends.'),
(2, 'System Administrator', 'Full-time', 'Maintain IT infrastructure.'),
(3, 'Frontend Developer', 'Full-time', 'Develop responsive user interfaces.'),
(4, 'Cloud Architect', 'Full-time', 'Design and manage cloud systems.');


INSERT INTO User (name, email, password, contact_info)
VALUES
('Neha Patel', 'neha@gmail.com', 'neha123', '9876543210'),
('Ravi Kumar', 'ravi@gmail.com', 'ravi123', '9123456789'),
('Aisha Khan', 'aisha@gmail.com', 'aisha123', '9998887777');


ALTER TABLE Admin MODIFY password VARCHAR(100) NOT NULL DEFAULT '';

INSERT INTO Admin (name, email, password)
VALUES 
('Admin One', 'admin1@jobtracker.com', 'admin123'),
('Admin Two', 'admin2@jobtracker.com', 'secure456');


INSERT INTO JobApplication (userID, roleID, applicationDate, deadline, status)
VALUES
(1, 1, '2025-09-01', '2025-09-30', 'Applied'),
(1, 2, '2025-08-15', '2025-09-15', 'Interview'),
(2, 3, '2025-07-10', '2025-08-01', 'Processing'),
(3, 4, '2025-07-20', '2025-08-15', 'Rejected'),
(3, 5, '2025-08-25', '2025-09-20', 'Selected');


INSERT INTO Interview (applicationID, interviewDate, interviewMode, result)
VALUES
(1, '2025-09-10', 'Online', 'Pending'),
(2, '2025-09-12', 'Offline', 'Selected'),
(3, '2025-08-05', 'Online', 'Rejected'),
(4, '2025-08-10', 'Offline', 'Rejected'),
(5, '2025-09-05', 'Online', 'Selected');


INSERT INTO Notification (type, date, time, applicationID, adminID)
VALUES
('Manual Status Update', CURDATE(), CURTIME(), 1, 1);

