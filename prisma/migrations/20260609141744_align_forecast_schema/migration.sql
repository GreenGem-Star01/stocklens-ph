-- AlterTable
ALTER TABLE "market_forecasts_latest" ALTER COLUMN "generated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "market_model_metrics" ALTER COLUMN "computed_at" DROP DEFAULT;
