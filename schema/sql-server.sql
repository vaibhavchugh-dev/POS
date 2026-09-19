-- Optional manual setup. The app also creates these tables on first SQL Server connect.

IF OBJECT_ID('dbo.BillLines', 'U') IS NOT NULL DROP TABLE dbo.BillLines;
IF OBJECT_ID('dbo.Bills', 'U') IS NOT NULL DROP TABLE dbo.Bills;
IF OBJECT_ID('dbo.MenuItems', 'U') IS NOT NULL DROP TABLE dbo.MenuItems;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Counters', 'U') IS NOT NULL DROP TABLE dbo.Counters;

CREATE TABLE dbo.Categories (
  Id NVARCHAR(64) NOT NULL PRIMARY KEY,
  Name NVARCHAR(120) NOT NULL,
  SortOrder INT NOT NULL
);

CREATE TABLE dbo.MenuItems (
  Id NVARCHAR(64) NOT NULL PRIMARY KEY,
  Name NVARCHAR(160) NOT NULL,
  CategoryId NVARCHAR(64) NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  Available BIT NOT NULL DEFAULT 1,
  FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
);

CREATE TABLE dbo.Bills (
  Id NVARCHAR(64) NOT NULL PRIMARY KEY,
  BillNumber INT NOT NULL UNIQUE,
  TableLabel NVARCHAR(80) NOT NULL,
  CreatedAt DATETIME2 NOT NULL,
  Subtotal DECIMAL(10,2) NOT NULL,
  TaxRate DECIMAL(6,4) NOT NULL,
  TaxAmount DECIMAL(10,2) NOT NULL,
  Total DECIMAL(10,2) NOT NULL
);

CREATE TABLE dbo.BillLines (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  BillId NVARCHAR(64) NOT NULL,
  MenuItemId NVARCHAR(64) NOT NULL,
  Name NVARCHAR(160) NOT NULL,
  UnitPrice DECIMAL(10,2) NOT NULL,
  Quantity INT NOT NULL,
  LineTotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (BillId) REFERENCES dbo.Bills(Id)
);

CREATE TABLE dbo.Counters (
  Name NVARCHAR(40) NOT NULL PRIMARY KEY,
  NextValue INT NOT NULL
);

INSERT INTO dbo.Counters (Name, NextValue) VALUES ('BillNumber', 1);
