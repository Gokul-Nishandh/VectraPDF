-- CreateTable
CREATE TABLE "public"."User" (
    "userId" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "phoneNumber" TEXT,
    "googleId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "chatId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "persona" TEXT,
    "job" TEXT,
    "insights" TEXT,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "public"."Pdf" (
    "pdfId" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "fileName" TEXT,

    CONSTRAINT "Pdf_pkey" PRIMARY KEY ("pdfId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pdf" ADD CONSTRAINT "Pdf_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
