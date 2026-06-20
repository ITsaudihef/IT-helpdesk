const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء إنشاء البيانات التجريبية...");

  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin123", 10);
  const supportHash = await bcrypt.hash("support123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: { name: "أحمد المدير", email: "admin@helpdesk.com", passwordHash: adminHash, role: "ADMIN", department: "تقنية المعلومات" },
  });

  const support1 = await prisma.user.create({
    data: { name: "محمد الدعم", email: "support1@helpdesk.com", passwordHash: supportHash, role: "SUPPORT", department: "تقنية المعلومات" },
  });

  const support2 = await prisma.user.create({
    data: { name: "سارة التقنية", email: "support2@helpdesk.com", passwordHash: supportHash, role: "SUPPORT", department: "تقنية المعلومات" },
  });

  const user1 = await prisma.user.create({
    data: { name: "علي المستخدم", email: "user1@helpdesk.com", passwordHash: userHash, role: "USER", department: "المحاسبة" },
  });

  const user2 = await prisma.user.create({
    data: { name: "نورة الموظفة", email: "user2@helpdesk.com", passwordHash: userHash, role: "USER", department: "الموارد البشرية" },
  });

  const user3 = await prisma.user.create({
    data: { name: "خالد الإداري", email: "user3@helpdesk.com", passwordHash: userHash, role: "USER", department: "الإدارة" },
  });

  console.log("✅ تم إنشاء 6 مستخدمين");

  const ticketsData = [
    { ticketNo: "IT-2026-00001", title: "الطابعة في قسم المحاسبة لا تعمل", description: "توقفت الطابعة HP LaserJet عن العمل فجأة، تظهر رسالة خطأ عند محاولة الطباعة", type: "HARDWARE", priority: "HIGH", status: "IN_PROGRESS", createdById: user1.id, assignedToId: support1.id },
    { ticketNo: "IT-2026-00002", title: "مشكلة في برنامج المحاسبة SAP", description: "لا يمكن تسجيل الدخول إلى برنامج SAP منذ الصباح، يظهر خطأ في الاتصال بالسيرفر", type: "SOFTWARE", priority: "CRITICAL", status: "OPEN", createdById: user1.id },
    { ticketNo: "IT-2026-00003", title: "طلب صلاحية الوصول لنظام الموارد البشرية", description: "أحتاج صلاحية قراءة تقارير الإجازات لمتابعة فريق العمل", type: "ACCESS", priority: "MEDIUM", status: "PENDING_APPROVAL", requiresApproval: true, createdById: user2.id },
    { ticketNo: "IT-2026-00004", title: "الإنترنت بطيء في الطابق الثاني", description: "يعاني جميع موظفي الطابق الثاني من بطء شديد في الاتصال بالإنترنت", type: "NETWORK", priority: "HIGH", status: "IN_PROGRESS", createdById: user2.id, assignedToId: support2.id },
    { ticketNo: "IT-2026-00005", title: "لاب توب مكسور الشاشة", description: "سقط اللاب توب وانكسرت الشاشة، أحتاج إصلاحها أو استبدالها", type: "HARDWARE", priority: "MEDIUM", status: "RESOLVED", createdById: user3.id, assignedToId: support1.id, resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), rating: 5 },
    { ticketNo: "IT-2026-00006", title: "نسيت كلمة مرور البريد الإلكتروني", description: "لا أستطيع تسجيل الدخول إلى بريدي الإلكتروني الخاص بالشركة", type: "ACCESS", priority: "LOW", status: "CLOSED", createdById: user1.id, assignedToId: support2.id, resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), rating: 4 },
    { ticketNo: "IT-2026-00007", title: "برنامج الأمان يحجب موقعاً مطلوباً", description: "برنامج الحماية يمنع الوصول لموقع حكومي نحتاجه في العمل اليومي", type: "SOFTWARE", priority: "MEDIUM", status: "WAITING_INFO", createdById: user3.id, assignedToId: support1.id },
    { ticketNo: "IT-2026-00008", title: "تركيب برنامج Microsoft Office", description: "أحتاج تثبيت Office على الكمبيوتر الجديد", type: "SOFTWARE", priority: "LOW", status: "OPEN", createdById: user2.id },
    { ticketNo: "IT-2026-00009", title: "الكمبيوتر لا يعمل عند بدء التشغيل", description: "يظهر شاشة زرقاء عند تشغيل الكمبيوتر مع رمز خطأ SYSTEM_THREAD_EXCEPTION", type: "HARDWARE", priority: "CRITICAL", status: "IN_PROGRESS", createdById: user3.id, assignedToId: support2.id },
    { ticketNo: "IT-2026-00010", title: "طلب توسعة مساحة التخزين السحابي", description: "امتلأت مساحة OneDrive الخاصة بي، أحتاج رفع الحد إلى 1TB", type: "ACCESS", priority: "LOW", status: "APPROVED", requiresApproval: true, createdById: user1.id, assignedToId: support1.id },
    { ticketNo: "IT-2026-00011", title: "مشكلة في الاتصال بـ VPN", description: "لا أستطيع الاتصال بالشبكة الداخلية عبر VPN من المنزل", type: "NETWORK", priority: "HIGH", status: "RESOLVED", createdById: user2.id, assignedToId: support2.id, resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), rating: 3 },
    { ticketNo: "IT-2026-00012", title: "الماسح الضوئي لا يظهر في الكمبيوتر", description: "تم تركيب ماسح ضوئي جديد لكن الكمبيوتر لا يتعرف عليه", type: "HARDWARE", priority: "LOW", status: "OPEN", createdById: user3.id },
    { ticketNo: "IT-2026-00013", title: "خطأ في تحديث Windows", description: "يفشل تحديث Windows ويظهر خطأ 0x80070057 عند كل محاولة", type: "SOFTWARE", priority: "MEDIUM", status: "IN_PROGRESS", createdById: user1.id, assignedToId: support1.id },
    { ticketNo: "IT-2026-00014", title: "شبكة WiFi في قاعة الاجتماعات تنقطع", description: "خلال الاجتماعات تنقطع شبكة WiFi بشكل متكرر مما يسبب إزعاجاً", type: "NETWORK", priority: "HIGH", status: "RESOLVED", createdById: user2.id, assignedToId: support2.id, resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), rating: 5 },
    { ticketNo: "IT-2026-00015", title: "طلب صلاحية الوصول لقاعدة بيانات المبيعات", description: "أحتاج صلاحية قراءة بيانات المبيعات لإعداد التقارير الشهرية", type: "ACCESS", priority: "MEDIUM", status: "PENDING_APPROVAL", requiresApproval: true, createdById: user3.id },
  ];

  for (const t of ticketsData) {
    const ticket = await prisma.ticket.create({ data: t });

    if (["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(t.status) && t.assignedToId) {
      await prisma.comment.create({
        data: { ticketId: ticket.id, authorId: t.assignedToId, body: "تم استلام طلبك وسنعمل على معالجته في أقرب وقت ممكن", isInternal: false },
      });
    }

    if (t.status === "WAITING_INFO" && t.assignedToId) {
      await prisma.comment.create({
        data: { ticketId: ticket.id, authorId: t.assignedToId, body: "نحتاج المزيد من التفاصيل، هل يمكنك مشاركة اسم الموقع الذي يتم حجبه؟", isInternal: false },
      });
    }

    if (t.status === "RESOLVED" && t.assignedToId) {
      await prisma.comment.create({
        data: { ticketId: ticket.id, authorId: t.assignedToId, body: "تم حل المشكلة بنجاح. يرجى إعلامنا إذا تكررت أي مشكلة", isInternal: false },
      });
    }

    await prisma.notification.create({
      data: { userId: t.createdById, ticketId: ticket.id, message: `تم استلام تذكرتك ${t.ticketNo}`, read: Math.random() > 0.5 },
    });
  }

  console.log("✅ تم إنشاء 15 تذكرة تجريبية");
  console.log("\n📋 بيانات الدخول:");
  console.log("  مدير     → admin@helpdesk.com    / admin123");
  console.log("  دعم 1    → support1@helpdesk.com / support123");
  console.log("  دعم 2    → support2@helpdesk.com / support123");
  console.log("  مستخدم 1 → user1@helpdesk.com   / user123");
  console.log("  مستخدم 2 → user2@helpdesk.com   / user123");
  console.log("  مستخدم 3 → user3@helpdesk.com   / user123");
  console.log("\n🚀 المشروع جاهز! شغّل: npm run dev");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
