import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { prisma } from './prismaClient.js';
import bcrypt from 'bcryptjs';
const hash = (pw) => bcrypt.hashSync(pw, 12);
async function main() {
    console.log('Seeding database...\n');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@intercollab.app' },
        update: {},
        create: {
            name: 'Admin User', email: 'admin@intercollab.app', password: hash('password'),
            emailVerifiedAt: new Date(), bio: 'Platform administrator and research coordinator.',
            university: 'InterCollab University', major: 'Computer Science', isAdmin: 1,
        },
    });
    console.log(`  Admin: ${admin.email}`);
    const users = [
        { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@stanford.edu', bio: 'PhD in Quantum Computing. Passionate about quantum algorithms and cryptography.', university: 'Stanford University', major: 'Quantum Computing' },
        { name: 'Prof. Michael Chen', email: 'michael.chen@mit.edu', bio: 'AI Researcher specializing in machine learning and computer vision.', university: 'MIT', major: 'Artificial Intelligence' },
        { name: 'Emily Rodriguez', email: 'emily.r@harvard.edu', bio: 'Medical research focused on AI-powered diagnostics and personalized medicine.', university: 'Harvard University', major: 'Biomedical Engineering' },
        { name: 'David Kim', email: 'david.kim@berkeley.edu', bio: 'Environmental scientist working on climate change modeling.', university: 'UC Berkeley', major: 'Environmental Science' },
        { name: 'Dr. Olivia Martinez', email: 'olivia.m@oxford.ac.uk', bio: 'Cybersecurity expert with focus on network security.', university: 'Oxford University', major: 'Cybersecurity' },
        { name: 'James Wilson', email: 'james.w@caltech.edu', bio: 'Aerospace engineer developing satellite systems.', university: 'Caltech', major: 'Aerospace Engineering' },
        { name: 'Sophia Lee', email: 'sophia.lee@cmu.edu', bio: 'Data scientist specializing in neural networks and deep learning.', university: 'Carnegie Mellon', major: 'Data Science' },
        { name: 'Alex Thompson', email: 'alex.t@cambridge.ac.uk', bio: 'Blockchain researcher focused on decentralized systems.', university: 'Cambridge University', major: 'Distributed Systems' },
        { name: 'Maria Garcia', email: 'maria.garcia@princeton.edu', bio: 'Renewable energy researcher working on next-gen solar cells.', university: 'Princeton University', major: 'Energy Systems' },
        { name: 'Ryan Cooper', email: 'ryan.c@yale.edu', bio: 'Bioinformatics researcher developing computational tools for genomics.', university: 'Yale University', major: 'Bioinformatics' },
    ];
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: { ...u, password: hash('password'), emailVerifiedAt: new Date(), isAdmin: 0, accountType: 'student' },
        });
        console.log(`  User: ${user.email}`);
    }
    const test = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            name: 'Test User', email: 'test@example.com', password: hash('password'),
            emailVerifiedAt: new Date(), bio: 'Test account for application testing.',
            university: 'Test University', major: 'Testing', isAdmin: 0,
        },
    });
    console.log(`  Test: ${test.email}`);
    // Colleges
    const colleges = [
        { name: 'Stanford University', slug: 'stanford-university', description: 'Leading research university in Silicon Valley.', isVerified: 1 },
        { name: 'MIT', slug: 'mit', description: 'Massachusetts Institute of Technology — science and engineering excellence.', isVerified: 1 },
        { name: 'Harvard University', slug: 'harvard-university', description: 'World-renowned for research across every discipline.', isVerified: 1 },
        { name: 'UC Berkeley', slug: 'uc-berkeley', description: 'Top public research university on the West Coast.', isVerified: 1 },
        { name: 'Oxford University', slug: 'oxford-university', description: 'The oldest English-speaking university in the world.', isVerified: 1 },
    ];
    console.log('');
    for (const c of colleges) {
        const college = await prisma.college.upsert({
            where: { slug: c.slug },
            update: {},
            create: c,
        });
        console.log(`  College: ${college.name}`);
    }
    // Sample projects
    const sarah = await prisma.user.findUnique({ where: { email: 'sarah.johnson@stanford.edu' } });
    const michael = await prisma.user.findUnique({ where: { email: 'michael.chen@mit.edu' } });
    const emily = await prisma.user.findUnique({ where: { email: 'emily.r@harvard.edu' } });
    console.log('');
    if (sarah) {
        const p1 = await prisma.post.upsert({
            where: { id: 1000 },
            update: {},
            create: {
                id: 1000, userId: sarah.id, type: 'project', title: 'Quantum Error Correction Toolkit',
                content: 'Building an open-source toolkit for quantum error correction algorithms. Looking for collaborators with experience in quantum computing, linear algebra, or systems programming.',
                tags: JSON.stringify(['quantum', 'open-source', 'python', 'algorithms']),
                visibility: 'public', isPinned: 0, isFeatured: 0,
            },
        });
        console.log(`  Project: ${p1.title}`);
    }
    if (michael) {
        const p2 = await prisma.post.upsert({
            where: { id: 1001 },
            update: {},
            create: {
                id: 1001, userId: michael.id, type: 'project', title: 'Campus Vision AI',
                content: 'Developing a computer vision system for smart campus navigation. Need team members skilled in PyTorch, React Native, and UI/UX design.',
                tags: JSON.stringify(['ai', 'computer-vision', 'mobile', 'pytorch']),
                visibility: 'public', isPinned: 0, isFeatured: 0,
            },
        });
        console.log(`  Project: ${p2.title}`);
    }
    if (emily) {
        const p3 = await prisma.post.upsert({
            where: { id: 1002 },
            update: {},
            create: {
                id: 1002, userId: emily.id, type: 'project', title: 'MedAI Diagnostics Platform',
                content: 'Creating an AI-powered medical diagnostics platform for early disease detection. Seeking researchers in biomedical engineering, ML, and clinical trial design.',
                tags: JSON.stringify(['healthcare', 'ai', 'diagnostics', 'research']),
                visibility: 'public', isPinned: 0, isFeatured: 0,
            },
        });
        console.log(`  Project: ${p3.title}`);
    }
    // Sample events
    console.log('');
    if (sarah) {
        const e1 = await prisma.event.upsert({
            where: { id: 1000 },
            update: {},
            create: {
                id: 1000, userId: sarah.id, title: 'Quantum Computing Workshop 2026',
                description: 'A hands-on workshop covering the fundamentals of quantum computing, from qubits to quantum error correction. Open to all campuses.',
                location: 'Stanford Campus — Gates Building', eventDate: new Date('2026-05-15T09:00:00'), type: 'workshop',
            },
        });
        console.log(`  Event: ${e1.title}`);
    }
    if (michael) {
        const e2 = await prisma.event.upsert({
            where: { id: 1001 },
            update: {},
            create: {
                id: 1001, userId: michael.id, title: 'Inter-University AI Hackathon',
                description: '48-hour hackathon bringing together students from across universities to build AI solutions for real-world problems. Prizes and mentorship included.',
                location: 'MIT Media Lab', eventDate: new Date('2026-06-20T18:00:00'), type: 'hackathon',
            },
        });
        console.log(`  Event: ${e2.title}`);
    }
    console.log('\nDone! All passwords: password');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map