-- Limite opcional de valor por categoria (NULL = sem limite)
ALTER TABLE "categories" ADD COLUMN "maxAmount" REAL;
