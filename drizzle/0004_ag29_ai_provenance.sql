-- AG-29: AI Authoring Drafts & Provenance Tracking
-- Invariants Gate P4: Mọi bản thảo do AI sinh ra phải có provenance rõ ràng, không tự động xuất bản
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "provenance" text DEFAULT 'MANUAL' NOT NULL;
