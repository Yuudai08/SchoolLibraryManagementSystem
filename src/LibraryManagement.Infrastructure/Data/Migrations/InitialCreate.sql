IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Categories] (
        [CategoryId] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([CategoryId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Students] (
        [StudentId] int NOT NULL IDENTITY,
        [StudentNumber] nvarchar(20) NOT NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Email] nvarchar(100) NULL,
        [Phone] nvarchar(20) NULL,
        [Department] nvarchar(100) NULL,
        [Year] int NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Students] PRIMARY KEY ([StudentId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [FullName] nvarchar(100) NOT NULL,
        [Email] nvarchar(100) NOT NULL,
        [PasswordHash] nvarchar(255) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Books] (
        [BookId] int NOT NULL IDENTITY,
        [Title] nvarchar(200) NOT NULL,
        [Author] nvarchar(200) NOT NULL,
        [ISBN] nvarchar(20) NULL,
        [Publisher] nvarchar(100) NULL,
        [PublicationYear] int NULL,
        [CategoryId] int NOT NULL,
        [Description] nvarchar(1000) NULL,
        [TotalCopies] int NOT NULL,
        [AvailableCopies] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Books] PRIMARY KEY ([BookId]),
        CONSTRAINT [CK_Books_AvailableCopies_Max] CHECK ([AvailableCopies] <= [TotalCopies]),
        CONSTRAINT [CK_Books_AvailableCopies_NonNegative] CHECK ([AvailableCopies] >= 0),
        CONSTRAINT [CK_Books_TotalCopies_NonNegative] CHECK ([TotalCopies] >= 0),
        CONSTRAINT [FK_Books_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([CategoryId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Loans] (
        [LoanId] int NOT NULL IDENTITY,
        [BookId] int NOT NULL,
        [StudentId] int NOT NULL,
        [BorrowedDate] datetime2 NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [ReturnedDate] datetime2 NULL,
        [Status] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Loans] PRIMARY KEY ([LoanId]),
        CONSTRAINT [FK_Loans_Books_BookId] FOREIGN KEY ([BookId]) REFERENCES [Books] ([BookId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Loans_Students_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Students] ([StudentId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE TABLE [Fines] (
        [FineId] int NOT NULL IDENTITY,
        [LoanId] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [IsPaid] bit NOT NULL,
        [PaidDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Fines] PRIMARY KEY ([FineId]),
        CONSTRAINT [FK_Fines_Loans_LoanId] FOREIGN KEY ([LoanId]) REFERENCES [Loans] ([LoanId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Books_Author] ON [Books] ([Author]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Books_CategoryId] ON [Books] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Books_ISBN] ON [Books] ([ISBN]) WHERE [ISBN] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Books_Title] ON [Books] ([Title]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Categories_Name] ON [Categories] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Fines_IsPaid] ON [Fines] ([IsPaid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Fines_LoanId] ON [Fines] ([LoanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Loans_BookId] ON [Loans] ([BookId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Loans_DueDate_Status] ON [Loans] ([DueDate], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Loans_Status] ON [Loans] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Loans_StudentId] ON [Loans] ([StudentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Loans_StudentId_Status] ON [Loans] ([StudentId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Students_Department] ON [Students] ([Department]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Students_Email] ON [Students] ([Email]) WHERE [Email] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Students_LastName] ON [Students] ([LastName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Students_StudentNumber] ON [Students] ([StudentNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922121340_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260922121340_InitialCreate', N'10.0.12');
END;

COMMIT;
GO

