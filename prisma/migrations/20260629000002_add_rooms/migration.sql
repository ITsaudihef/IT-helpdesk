CREATE TABLE "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "features" TEXT NOT NULL DEFAULT '',
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "room_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "room_bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "room_bookings_roomId_date_idx" ON "room_bookings"("roomId", "date");
CREATE INDEX "room_bookings_userId_idx" ON "room_bookings"("userId");

INSERT INTO "rooms" ("id","name","capacity","features","location","isActive","createdAt") VALUES
('room_01','قاعة الاجتماعات A',8,'بروجكتور,تكييف,لوح كتابة','الطابق الأول',1,CURRENT_TIMESTAMP),
('room_02','قاعة العروض',30,'شاشة ضخمة,مايك,بروجكتور','الطابق الثاني',1,CURRENT_TIMESTAMP),
('room_03','غرفة المؤتمرات',4,'تلفزيون,تكييف','الطابق الأول',1,CURRENT_TIMESTAMP),
('room_04','قاعة المشاريع',12,'لوح تفاعلي,بروجكتور,تكييف','الطابق الثاني',1,CURRENT_TIMESTAMP),
('room_05','غرفة VIP',6,'تكييف,تلفزيون','الطابق الثالث',1,CURRENT_TIMESTAMP);
