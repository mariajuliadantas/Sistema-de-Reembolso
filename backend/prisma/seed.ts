import bcrypt from 'bcryptjs';
import { prisma } from '../src/utils/prisma';

const main = async () => {
    console.log('Iniciando seed...\n');

    const passwordHash = await bcrypt.hash('admin123', 10);

    // Usuários
    const users = [
        { name: 'Administrador', email: 'admin@pitang.com', role: 'ADMIN' },
        { name: 'Colaborador', email: 'colaborador@pitang.com', role: 'COLLABORATOR' },
        { name: 'Gestor', email: 'gestor@pitang.com', role: 'MANAGER' },
        { name: 'Financeiro', email: 'financeiro@pitang.com', role: 'FINANCIAL' },
    ] as const;

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: { name: user.name, email: user.email, passwordHash, role: user.role },
        });
        console.log(`Usuário criado: ${user.email} [${user.role}]`);
    }

    const categories = [
        { name: 'Alimentação', maxAmount: null as number | null },
        { name: 'Transporte', maxAmount: 300 },
        { name: 'Hospedagem', maxAmount: 5000 },
        { name: 'Material de Escritório', maxAmount: null },
        { name: 'Treinamento', maxAmount: null },
    ];

    for (const c of categories) {
        await prisma.category.upsert({
            where: { name: c.name },
            update: { maxAmount: c.maxAmount },
            create: { name: c.name, active: true, maxAmount: c.maxAmount },
        });
        console.log(`Categoria: ${c.name}${c.maxAmount != null ? ` (limite R$ ${c.maxAmount})` : ''}`);
    }



    console.log('\nSeed concluído com sucesso!');
    console.log('\nCredenciais de teste (senha: admin123):');
    console.log('  admin@pitang.com         → ADMIN');
    console.log('  colaborador@pitang.com   → COLLABORATOR');
    console.log('  gestor@pitang.com        → MANAGER');
    console.log('  financeiro@pitang.com    → FINANCIAL');
};

main()
    .catch((e) => {
        console.error('Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });