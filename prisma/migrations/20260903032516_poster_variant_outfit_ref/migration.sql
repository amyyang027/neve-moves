-- AlterTable
ALTER TABLE "OutfitSuggestion" ADD COLUMN "referenceImageUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songTitle" TEXT NOT NULL,
    "kpopGroup" TEXT NOT NULL,
    "themeVibe" TEXT,
    "dateWindowLabel" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'planning',
    "crabfitUrl" TEXT,
    "posterSvg" TEXT,
    "posterUpdatedAt" DATETIME,
    "posterVariant" INTEGER NOT NULL DEFAULT 0,
    "youtubeUrl" TEXT,
    "coverImageUrl" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("coverImageUrl", "crabfitUrl", "createdAt", "dateWindowLabel", "id", "isSample", "kpopGroup", "phase", "posterSvg", "posterUpdatedAt", "songTitle", "themeVibe", "updatedAt", "youtubeUrl") SELECT "coverImageUrl", "crabfitUrl", "createdAt", "dateWindowLabel", "id", "isSample", "kpopGroup", "phase", "posterSvg", "posterUpdatedAt", "songTitle", "themeVibe", "updatedAt", "youtubeUrl" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
