import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core"; // ✅ Correct import

export const MockInterview = pgTable("mockInterview", {
    id: serial("id").primaryKey(), // ✅ Serial now properly imported
    jsonMockResp: text("jsonMockResp").notNull(),
    jobPosition: varchar("jobPosition", { length: 255 }).notNull(), // ✅ Specify length
    jobDesc: varchar("jobDesc", { length: 255 }).notNull(), // ✅ Specify length
    jobExperience: varchar("jobExperience", { length: 255 }).notNull(),
    createdBy: varchar("createdBy", { length: 255 }).notNull(),
    createdAt: varchar("createdAt", { length: 255 }).notNull(),
    mockId: varchar("mockId", { length: 255 }).notNull(),
});

export const UserAnswer=pgTable("userAnswer",{
    id:serial('id').primaryKey(),
    mockidRef:varchar('mockid').notNull(),
    question:varchar('question').notNull(),
    correctAns:varchar('correctAns'),
    userAns:text('userAns'),
    feedback:varchar('rating'),
    userEmail:varchar('userEmail'),
    createdAt:varchar('createdAt')
})
