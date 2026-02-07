-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfillmentType" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "designFileUrl" TEXT,
ADD COLUMN     "isPrintOnDemand" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printVariantId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPrintOnDemand" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "printProductId" TEXT;

-- CreateTable
CREATE TABLE "PrintProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintProduct" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "blueprintId" TEXT,
    "printProviderId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variants" JSONB NOT NULL,
    "mockupUrls" JSONB,
    "designFiles" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "externalOrderNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "statusMessage" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "shippingCost" DECIMAL(10,2),
    "productionCost" DECIMAL(10,2),
    "items" JSONB NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "webhookEvents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintWebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrintProvider_name_idx" ON "PrintProvider"("name");

-- CreateIndex
CREATE INDEX "PrintProvider_isActive_idx" ON "PrintProvider"("isActive");

-- CreateIndex
CREATE INDEX "PrintProduct_providerId_idx" ON "PrintProduct"("providerId");

-- CreateIndex
CREATE INDEX "PrintProduct_externalId_idx" ON "PrintProduct"("externalId");

-- CreateIndex
CREATE INDEX "PrintProduct_isPublished_idx" ON "PrintProduct"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "PrintProduct_providerId_externalId_key" ON "PrintProduct"("providerId", "externalId");

-- CreateIndex
CREATE INDEX "PrintOrder_orderId_idx" ON "PrintOrder"("orderId");

-- CreateIndex
CREATE INDEX "PrintOrder_providerId_idx" ON "PrintOrder"("providerId");

-- CreateIndex
CREATE INDEX "PrintOrder_externalOrderId_idx" ON "PrintOrder"("externalOrderId");

-- CreateIndex
CREATE INDEX "PrintOrder_status_idx" ON "PrintOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PrintOrder_orderId_providerId_key" ON "PrintOrder"("orderId", "providerId");

-- CreateIndex
CREATE INDEX "PrintWebhookLog_provider_idx" ON "PrintWebhookLog"("provider");

-- CreateIndex
CREATE INDEX "PrintWebhookLog_event_idx" ON "PrintWebhookLog"("event");

-- CreateIndex
CREATE INDEX "PrintWebhookLog_processed_idx" ON "PrintWebhookLog"("processed");

-- CreateIndex
CREATE INDEX "PrintWebhookLog_createdAt_idx" ON "PrintWebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "Order_fulfillmentType_idx" ON "Order"("fulfillmentType");

-- CreateIndex
CREATE INDEX "OrderItem_isPrintOnDemand_idx" ON "OrderItem"("isPrintOnDemand");

-- CreateIndex
CREATE INDEX "Product_isPrintOnDemand_idx" ON "Product"("isPrintOnDemand");

-- CreateIndex
CREATE INDEX "Product_printProductId_idx" ON "Product"("printProductId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_printProductId_fkey" FOREIGN KEY ("printProductId") REFERENCES "PrintProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintProduct" ADD CONSTRAINT "PrintProduct_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "PrintProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "PrintProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
