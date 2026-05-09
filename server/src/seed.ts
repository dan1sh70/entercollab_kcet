import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from './prismaClient.js';
import bcrypt from 'bcryptjs';
const hash = (pw: string) => bcrypt.hashSync(pw, 12);

async function main() {
  console.log('Clearing database...\n');
  
  // Empty all relevant tables
  await prisma.message.deleteMany();
  await prisma.chatRoomUser.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.projectRequest.deleteMany();
  await prisma.post.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.researchPaper.deleteMany();
  await prisma.collegeUser.deleteMany();
  await prisma.college.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database with requested users...\n');

  // Create GCET College
  const gcet = await prisma.college.create({
    data: {
      name: 'GCET',
      slug: 'gcet',
      description: 'Government College of Engineering and Technology',
      isVerified: 1,
    }
  });

  const testUsers = [
    { name: 'Ifam', email: 'ifam@gcet.edu' },
    { name: 'Danish', email: 'danish@gcet.edu' },
    { name: 'Asgr', email: 'asgr@gcet.edu' },
  ];

  for (const u of testUsers) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hash('123456'),
        emailVerifiedAt: new Date(),
        university: 'GCET',
        major: 'Computer Science',
        isAdmin: 0,
        accountType: 'student'
      }
    });
    console.log(`Created User: ${user.name} | Email: ${user.email} | Password: 123456`);
  }

  console.log('\nDatabase reset and seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
