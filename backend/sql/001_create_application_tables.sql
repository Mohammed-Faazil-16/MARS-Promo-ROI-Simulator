/*
  REVIEW-ONLY PROPOSAL. The application never executes this file.
  Do not run against B4A-S7-T1 until the company DBA approves the target schema,
  names, permissions, and deployment procedure. Creates application-owned tables only.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.PRODUCTS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PRODUCTS (
        ProductId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PRODUCTS PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Category NVARCHAR(100) NOT NULL,
        Brand NVARCHAR(100) NULL,
        UnitCost DECIMAL(19,4) NOT NULL,
        NormalPrice DECIMAL(19,4) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_PRODUCTS_IsActive DEFAULT (1),
        IsDevelopmentSeed BIT NOT NULL CONSTRAINT DF_PRODUCTS_IsDevelopmentSeed DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PRODUCTS_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PRODUCTS_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_PRODUCTS_IsActive_Category ON dbo.PRODUCTS(IsActive, Category);
END;

IF OBJECT_ID(N'dbo.RETAILERS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RETAILERS (
        RetailerId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RETAILERS PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Region NVARCHAR(100) NULL,
        AccountManager NVARCHAR(200) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_RETAILERS_IsActive DEFAULT (1),
        IsDevelopmentSeed BIT NOT NULL CONSTRAINT DF_RETAILERS_IsDevelopmentSeed DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_RETAILERS_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_RETAILERS_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_RETAILERS_IsActive_Region ON dbo.RETAILERS(IsActive, Region);
END;

IF OBJECT_ID(N'dbo.PROMOTIONS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PROMOTIONS (
        PromotionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PROMOTIONS PRIMARY KEY,
        Name NVARCHAR(150) NOT NULL,
        ProductId INT NOT NULL,
        RetailerId INT NOT NULL,
        ProductNameSnapshot NVARCHAR(200) NOT NULL,
        RetailerNameSnapshot NVARCHAR(200) NOT NULL,
        RegionSnapshot NVARCHAR(100) NULL,
        Price DECIMAL(19,4) NOT NULL,
        Cost DECIMAL(19,4) NOT NULL,
        DiscountPercent DECIMAL(9,4) NOT NULL,
        DurationWeeks INT NOT NULL,
        BaselineUnitsPerWeek DECIMAL(19,4) NOT NULL,
        PromoUnitsPerWeek DECIMAL(19,4) NOT NULL,
        PromoPrice DECIMAL(19,4) NOT NULL,
        NormalMargin DECIMAL(19,4) NOT NULL,
        PromoMargin DECIMAL(19,4) NOT NULL,
        ExtraUnitsPerWeek DECIMAL(19,4) NOT NULL,
        ExtraUnits DECIMAL(19,4) NOT NULL,
        UpliftPercent DECIMAL(19,6) NULL,
        ProfitWithout DECIMAL(19,4) NOT NULL,
        ProfitWith DECIMAL(19,4) NOT NULL,
        ExtraProfit DECIMAL(19,4) NOT NULL,
        PromoCost DECIMAL(19,4) NOT NULL,
        ROI DECIMAL(19,6) NULL,
        BreakEvenPromoUnits DECIMAL(19,4) NULL,
        Verdict NVARCHAR(16) NOT NULL,
        CalculationStatus NVARCHAR(32) NOT NULL,
        ROIReason NVARCHAR(MAX) NULL,
        VerdictReason NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PROMOTIONS_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PROMOTIONS_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_PROMOTIONS_PRODUCTS FOREIGN KEY (ProductId) REFERENCES dbo.PRODUCTS(ProductId),
        CONSTRAINT FK_PROMOTIONS_RETAILERS FOREIGN KEY (RetailerId) REFERENCES dbo.RETAILERS(RetailerId),
        CONSTRAINT CK_PROMOTIONS_Weeks CHECK (DurationWeeks > 0),
        CONSTRAINT CK_PROMOTIONS_Verdict CHECK (Verdict IN (N'Approve', N'Review', N'Reject'))
    );
    CREATE INDEX IX_PROMOTIONS_CreatedAt ON dbo.PROMOTIONS(CreatedAt);
    CREATE INDEX IX_PROMOTIONS_Verdict ON dbo.PROMOTIONS(Verdict);
    CREATE INDEX IX_PROMOTIONS_Product_Retailer ON dbo.PROMOTIONS(ProductId, RetailerId);
END;

COMMIT TRANSACTION;
