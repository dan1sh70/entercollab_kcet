-- Add isAI field to chat_rooms table to support AI assistant conversations
ALTER TABLE "chat_rooms" ADD COLUMN "is_ai" INTEGER NOT NULL DEFAULT 0;
